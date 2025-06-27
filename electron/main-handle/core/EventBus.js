const { EventEmitter } = require("events");
const { logger } = require("../../utils");
const { EventType } = require("./types");

/**
 * 事件总线 - 提供应用级别的事件通信
 * 支持控制器间通信、生命周期事件、错误事件等
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // 增加最大监听器数量
    this.eventHistory = [];
    this.maxHistorySize = 1000;

    // 绑定默认错误处理
    this.on("error", this.handleError.bind(this));
  }

  /**
   * 发射事件并记录历史
   * @param {string} eventName 事件名称
   * @param {...any} args 事件参数
   */
  emit(eventName, ...args) {
    const timestamp = Date.now();

    // 记录事件历史
    this.recordEvent(eventName, args, timestamp);

    // 记录日志
    if (this.shouldLogEvent(eventName)) {
      logger.debug(`事件发射: ${eventName}`, { args: this.sanitizeArgs(args) });
    }

    return super.emit(eventName, ...args);
  }

  /**
   * 安全的事件发射，捕获监听器错误
   * @param {string} eventName 事件名称
   * @param {...any} args 事件参数
   */
  safeEmit(eventName, ...args) {
    try {
      return this.emit(eventName, ...args);
    } catch (error) {
      logger.error(`事件发射失败: ${eventName}`, {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * 一次性监听器，自动清理
   * @param {string} eventName 事件名称
   * @param {Function} listener 监听器函数
   * @param {number} timeout 超时时间(毫秒)
   */
  onceWithTimeout(eventName, listener, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(eventName, wrappedListener);
        reject(new Error(`事件监听超时: ${eventName}`));
      }, timeout);

      const wrappedListener = (...args) => {
        clearTimeout(timer);
        try {
          const result = listener(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.once(eventName, wrappedListener);
    });
  }

  /**
   * 等待特定事件
   * @param {string} eventName 事件名称
   * @param {number} timeout 超时时间
   * @param {Function} condition 条件函数
   */
  async waitFor(eventName, timeout = 5000, condition = null) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(eventName, listener);
        reject(new Error(`等待事件超时: ${eventName}`));
      }, timeout);

      const listener = (...args) => {
        if (!condition || condition(...args)) {
          clearTimeout(timer);
          this.removeListener(eventName, listener);
          resolve(args);
        }
      };

      this.on(eventName, listener);
    });
  }

  /**
   * 批量监听事件
   * @param {Object} events 事件映射对象
   */
  onMultiple(events) {
    for (const [eventName, listener] of Object.entries(events)) {
      this.on(eventName, listener);
    }
  }

  /**
   * 批量移除监听器
   * @param {Object} events 事件映射对象
   */
  offMultiple(events) {
    for (const [eventName, listener] of Object.entries(events)) {
      this.removeListener(eventName, listener);
    }
  }

  /**
   * 获取事件历史
   * @param {string} eventName 事件名称过滤
   * @param {number} limit 限制数量
   */
  getEventHistory(eventName = null, limit = 100) {
    let history = this.eventHistory;

    if (eventName) {
      history = history.filter((event) => event.name === eventName);
    }

    return history.slice(-limit);
  }

  /**
   * 清理事件历史
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * 获取事件统计信息
   */
  getStats() {
    const stats = {
      totalEvents: this.eventHistory.length,
      eventTypes: {},
      listeners: {},
    };

    // 统计事件类型
    for (const event of this.eventHistory) {
      stats.eventTypes[event.name] = (stats.eventTypes[event.name] || 0) + 1;
    }

    // 统计监听器
    for (const eventName of this.eventNames()) {
      stats.listeners[eventName] = this.listenerCount(eventName);
    }

    return stats;
  }

  /**
   * 记录事件到历史
   */
  recordEvent(eventName, args, timestamp) {
    this.eventHistory.push({
      name: eventName,
      args: this.sanitizeArgs(args),
      timestamp,
      date: new Date(timestamp).toISOString(),
    });

    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 判断是否应该记录事件日志
   */
  shouldLogEvent(eventName) {
    // 过滤掉高频事件
    const highFrequencyEvents = ["heartbeat", "tick", "progress"];
    return !highFrequencyEvents.includes(eventName);
  }

  /**
   * 清理敏感参数
   */
  sanitizeArgs(args) {
    return args.map((arg) => {
      if (typeof arg === "object" && arg !== null) {
        const sanitized = { ...arg };
        // 移除敏感字段
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        return sanitized;
      }
      return arg;
    });
  }

  /**
   * 默认错误处理
   */
  handleError(error) {
    logger.error("EventBus错误:", {
      message: error.message,
      stack: error.stack,
    });
  }

  /**
   * 销毁事件总线
   */
  destroy() {
    this.removeAllListeners();
    this.clearHistory();
  }
}

// 创建全局单例
const eventBus = new EventBus();

// 导出便捷方法
const createEventBus = () => new EventBus();

module.exports = {
  eventBus,
  createEventBus,
  EventBus,
  EventType,
};
