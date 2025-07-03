const { ipcMain } = require("electron");
const { logger } = require("../../utils");
// const middlewares = require('../middlewares');

/**
 * IPC管理器 - 统一管理所有IPC通信
 * 支持中间件、性能监控等特性
 */
class IPCManager {
  constructor() {
    this.handlers = new Map();
    this.middlewares = [];
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0,
      averageResponseTime: 0,
    };
    this.performanceData = [];
    this.maxPerformanceData = 1000;
  }

  /**
   * 添加中间件
   * @param {Function} middleware 中间件函数
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * 注册处理器
   * @param {string} channel 通道名
   * @param {Function} handler 处理函数
   * @param {Object} options 选项
   */
  handle(channel, handler, options = {}) {
    if (this.handlers.has(channel)) {
      logger.warn(`IPC通道 '${channel}' 已存在，将被覆盖`);
    }

    const wrappedHandler = this.wrapHandler(handler, channel, options);
    this.handlers.set(channel, { handler: wrappedHandler, options });
    ipcMain.handle(channel, wrappedHandler);
  }

  /**
   * 注册监听器
   * @param {string} channel 通道名
   * @param {Function} handler 处理函数
   */
  on(channel, handler) {
    const wrappedHandler = this.wrapListener(handler, channel);
    this.handlers.set(channel, { handler: wrappedHandler, type: "listener" });
    ipcMain.on(channel, wrappedHandler);
  }

  /**
   * 包装处理器
   */
  wrapHandler(handler, channel, options) {
    return async (event, ...args) => {
      const startTime = Date.now();
      const context = {
        event,
        channel,
        args, // 渲染进程传过来的参数
        options,
        startTime,
        data: {}, // 共享数据对象，中间件可以在此存储数据
      };

      try {
        // 执行中间件
        await this.executeMiddlewares(context);

        // 执行处理器，使用中间件可能修改过的参数
        const result = await handler(context.event, ...context.args);

        const duration = Date.now() - startTime;
        this.updateStats(true, duration);
        this.recordPerformance(channel, duration, true);

        logger.info(`IPC调用成功: ${channel} (${duration}ms)`);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.updateStats(false, duration);
        this.recordPerformance(channel, duration, false);

        logger.error(`IPC调用失败: ${channel}`, {
          error: error.message,
          duration,
          args: args.length,
        });

        throw error;
      }
    };
  }

  /**
   * 包装监听器
   */
  wrapListener(handler, channel) {
    return async (event, ...args) => {
      try {
        await handler(event, ...args);
        logger.info(`IPC监听器执行: ${channel}`);
      } catch (error) {
        logger.error(`IPC监听器错误: ${channel}`, error);
      }
    };
  }

  /**
   * 执行中间件
   */
  async executeMiddlewares(context) {
    for (const middleware of this.middlewares) {
      await middleware(context);
    }
  }

  /**
   * 更新统计信息
   */
  updateStats(success, duration) {
    this.stats.totalCalls++;
    if (success) {
      this.stats.successCalls++;
    } else {
      this.stats.errorCalls++;
    }

    // 计算平均响应时间
    const totalTime =
      this.stats.averageResponseTime * (this.stats.totalCalls - 1) + duration;
    this.stats.averageResponseTime = totalTime / this.stats.totalCalls;
  }

  /**
   * 记录性能数据
   */
  recordPerformance(channel, duration, success) {
    this.performanceData.push({
      channel,
      duration,
      success,
      timestamp: Date.now(),
    });

    // 限制性能数据数量
    if (this.performanceData.length > this.maxPerformanceData) {
      this.performanceData.shift();
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalCalls > 0
          ? ((this.stats.successCalls / this.stats.totalCalls) * 100).toFixed(
              2
            ) + "%"
          : "0%",
      handlersCount: this.handlers.size,
      middlewaresCount: this.middlewares.length,
    };
  }

  /**
   * 获取性能数据
   */
  getPerformanceData() {
    return this.performanceData.slice(-100); // 返回最近100条记录
  }

  /**
   * 获取慢调用
   */
  getSlowCalls(threshold = 1000) {
    return this.performanceData
      .filter((data) => data.duration > threshold)
      .slice(-20); // 返回最近20条慢调用
  }

  /**
   * 获取所有通道
   */
  getChannels() {
    return Array.from(this.handlers.keys());
  }

  /**
   * 移除处理器
   */
  removeHandler(channel) {
    if (this.handlers.has(channel)) {
      ipcMain.removeHandler(channel);
      this.handlers.delete(channel);
    }
  }

  /**
   * 移除监听器
   */
  removeListener(channel) {
    if (this.handlers.has(channel)) {
      const handler = this.handlers.get(channel);
      if (handler.type === "listener") {
        ipcMain.removeListener(channel, handler.handler);
        this.handlers.delete(channel);
      }
    }
  }

  /**
   * 清理所有处理器
   */
  clear() {
    for (const [channel, handler] of this.handlers) {
      if (handler.type === "listener") {
        ipcMain.removeListener(channel, handler.handler);
      } else {
        ipcMain.removeHandler(channel);
      }
    }
    this.handlers.clear();
  }

  /**
   * 销毁管理器
   */
  async destroy() {
    try {
      this.clear();
      this.middlewares = [];
      this.performanceData = [];

      // 重置统计信息
      this.stats = {
        totalCalls: 0,
        successCalls: 0,
        errorCalls: 0,
        averageResponseTime: 0,
      };
    } catch (error) {
      logger.error("销毁IPC管理器时出错:", error);
    }
  }
}

// 创建单例实例
const ipcManager = new IPCManager();

// 添加全局中间件
// middlewares.forEach((middleware) => ipcManager.use(middleware));

module.exports = ipcManager;
