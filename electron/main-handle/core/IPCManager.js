const { ipcMain } = require("electron");
const { logger } = require("../../utils");
const { eventBus } = require("./EventBus");
const { EventType } = require("./types");

/**
 * IPC管理器 - 统一管理所有IPC通信
 * 支持中间件、事件总线、性能监控等现代化特性
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
   * @param {Function} listener 监听函数
   * @param {Object} options 选项
   */
  on(channel, listener, options = {}) {
    if (this.handlers.has(channel)) {
      logger.warn(`IPC通道 '${channel}' 已存在，将被覆盖`);
    }

    const wrappedListener = this.wrapHandler(listener, channel, options);
    this.handlers.set(channel, { handler: wrappedListener, options });

    ipcMain.on(channel, wrappedListener);
  }

  /**
   * 包装处理器，添加中间件、错误处理和性能监控
   */
  wrapHandler(handler, channel, options) {
    return async (event, ...args) => {
      const startTime = Date.now();
      const callId = `${channel}_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

      // 更新统计
      this.stats.totalCalls++;

      // 发射调用开始事件
      eventBus.safeEmit(EventType.ROUTE_CALL, {
        channel,
        callId,
        startTime,
        args: options.logArgs ? args : "[隐藏]",
      });

      try {
        // 构建中间件链
        const allMiddlewares = [...this.middlewares];
        if (options.middlewares) {
          allMiddlewares.push(...options.middlewares);
        }

        // 执行中间件链
        let index = 0;
        const next = async () => {
          if (index < allMiddlewares.length) {
            const middleware = allMiddlewares[index++];
            const context = { event, channel, args, options };
            return await middleware(context, next);
          } else {
            // 执行最终处理器
            if (options.timeout) {
              return await Promise.race([
                handler(event, ...args),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`IPC调用超时: ${channel}`)), options.timeout)
                ),
              ]);
            } else {
              return await handler(event, ...args);
            }
          }
        };

        const result = await next();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // 更新统计
        this.stats.successCalls++;
        this.updatePerformanceStats(duration);

        // 记录性能数据
        this.recordPerformance({
          channel,
          callId,
          startTime,
          endTime,
          duration,
          success: true,
        });

        // 记录成功日志
        if (options.logSuccess !== false) {
          logger.info(`IPC调用成功: ${channel} (${duration}ms)`);
        }

        // 发射调用成功事件
        eventBus.safeEmit("ipc:call:success", {
          channel,
          callId,
          duration,
          result: options.logResult ? result : "[隐藏]",
        });

        return result;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 更新统计
        this.stats.errorCalls++;

        // 记录性能数据
        this.recordPerformance({
          channel,
          callId,
          startTime,
          endTime,
          duration,
          success: false,
          error: error.message,
        });

        logger.error(`IPC调用失败: ${channel} (${duration}ms)`, {
          error: error.message,
          stack: error.stack,
          args: options.logArgs ? args : "[隐藏]",
        });

        // 发射错误事件
        eventBus.safeEmit(EventType.ERROR_OCCURRED, {
          channel,
          callId,
          duration,
          error: {
            message: error.message,
            stack: error.stack,
          },
        });

        if (options.throwError !== false) {
          throw error;
        }

        return { error: error.message };
      }
    };
  }

  /**
   * 移除处理器
   * @param {string} channel 通道名
   */
  removeHandler(channel) {
    if (this.handlers.has(channel)) {
      ipcMain.removeHandler(channel);
      this.handlers.delete(channel);
    }
  }

  /**
   * 获取所有已注册的通道
   */
  getChannels() {
    return Array.from(this.handlers.keys());
  }

  /**
   * 更新性能统计
   */
  updatePerformanceStats(duration) {
    const totalResponseTime =
      this.stats.averageResponseTime * (this.stats.successCalls - 1) + duration;
    this.stats.averageResponseTime = Math.round(totalResponseTime / this.stats.successCalls);
  }

  /**
   * 记录性能数据
   */
  recordPerformance(data) {
    this.performanceData.push(data);

    // 限制数据大小
    if (this.performanceData.length > this.maxPerformanceData) {
      this.performanceData = this.performanceData.slice(-this.maxPerformanceData);
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalCalls > 0
          ? Math.round((this.stats.successCalls / this.stats.totalCalls) * 100)
          : 0,
      errorRate:
        this.stats.totalCalls > 0
          ? Math.round((this.stats.errorCalls / this.stats.totalCalls) * 100)
          : 0,
    };
  }

  /**
   * 获取性能数据
   */
  getPerformanceData(channel = null, limit = 100) {
    let data = this.performanceData;

    if (channel) {
      data = data.filter((item) => item.channel === channel);
    }

    return data.slice(-limit);
  }

  /**
   * 获取慢查询
   */
  getSlowCalls(threshold = 1000) {
    return this.performanceData.filter((item) => item.duration > threshold);
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0,
      averageResponseTime: 0,
    };
    this.performanceData = [];
  }

  /**
   * 清理所有处理器
   */
  clear() {
    for (const channel of this.handlers.keys()) {
      this.removeHandler(channel);
    }
    this.resetStats();
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.clear();
    this.middlewares = [];
    eventBus.safeEmit("ipc:manager:destroyed");
  }
}

// 创建单例实例
const ipcManager = new IPCManager();

// 添加默认中间件
ipcManager.use(async (context, next) => {
  const { channel, args, options } = context;
  // 请求日志中间件
  if (options.logRequest !== false) {
    logger.debug(`IPC请求: ${channel}`, {
      args: options.logArgs ? args : "[隐藏]",
      timestamp: new Date().toISOString(),
    });
  }
  return await next();
});

// 添加安全中间件
ipcManager.use(async (context, next) => {
  const { args, options } = context;
  // 参数验证
  if (options.validateArgs && typeof options.validateArgs === "function") {
    const validation = options.validateArgs(args);
    if (!validation.valid) {
      throw new Error(`参数验证失败: ${validation.message}`);
    }
  }
  return await next();
});

module.exports = ipcManager;
