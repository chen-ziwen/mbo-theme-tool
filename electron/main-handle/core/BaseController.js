const ipcManager = require("./IPCManager");
const { logger } = require("../../utils/logger");
const { eventBus, EventType } = require("./EventBus");
const { container } = require("./DIContainer");

/**
 * 基础控制器类
 * 提供统一的控制器接口和路由注册机制
 */
class BaseController {
  constructor(name) {
    this.name = name || this.constructor.name.replace("Controller", "").toLowerCase();
    this.routes = new Map();
    this.middlewares = [];
    this.initialized = false;
    this.destroyed = false;
    this.dependencies = new Map();
    this.eventListeners = new Map();

    // 绑定方法上下文
    this.bindMethods();
  }

  /**
   * 定义路由配置
   * 子类应该重写此方法来定义自己的路由
   * @returns {Array} 路由配置数组
   */
  defineRoutes() {
    return [];
  }

  /**
   * 添加路由
   * @param {string} channel IPC通道名
   * @param {string|Function} handler 处理函数或方法名
   * @param {Object} options 选项
   */
  addRoute(channel, handler, options = {}) {
    let handlerFunc;
    let methodName;

    if (typeof handler === "string") {
      methodName = handler;
      if (typeof this[handler] !== "function") {
        throw new Error(`方法 ${handler} 不存在于控制器 ${this.name}`);
      }
      handlerFunc = this[handler].bind(this);
    } else if (typeof handler === "function") {
      handlerFunc = handler.bind(this);
      methodName = handler.name || "anonymous";
    } else {
      throw new Error(`无效的处理器类型: ${typeof handler}`);
    }

    this.routes.set(channel, {
      method: methodName,
      handler: handlerFunc,
      options,
    });
  }

  /**
   * 添加中间件
   * @param {Function} middleware 中间件函数
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * 绑定方法上下文
   */
  bindMethods() {
    const proto = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(proto).filter((name) => {
      return name !== "constructor" && typeof this[name] === "function" && !name.startsWith("_");
    });

    methodNames.forEach((name) => {
      this[name] = this[name].bind(this);
    });
  }

  /**
   * 注入依赖
   */
  inject(name, service) {
    this.dependencies.set(name, service);
    return this;
  }

  /**
   * 获取依赖
   */
  getDependency(name) {
    if (this.dependencies.has(name)) {
      return this.dependencies.get(name);
    }

    // 尝试从容器解析
    try {
      const service = container.resolve(name);
      this.dependencies.set(name, service);
      return service;
    } catch (error) {
      logger.warn(`无法解析依赖: ${name}`, error);
      return null;
    }
  }

  /**
   * 监听事件
   */
  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const boundHandler = handler.bind(this);
    this.eventListeners.get(event).push(boundHandler);
    eventBus.on(event, boundHandler);

    return this;
  }

  /**
   * 发射事件
   */
  emit(event, data) {
    eventBus.safeEmit(event, {
      controller: this.name,
      ...data,
    });
    return this;
  }

  /**
   * 初始化控制器
   */
  async initialize() {
    if (this.initialized || this.destroyed) {
      return;
    }

    try {
      // 调用生命周期钩子
      await this.beforeInit();

      // 定义路由
      const routeConfigs = this.defineRoutes();
      for (const config of routeConfigs) {
        this.addRoute(config.channel, config.handler, config.options || {});
      }

      // 设置事件监听
      this.setupEventListeners();

      // 调用生命周期钩子
      await this.afterInit();

      this.initialized = true;
      this.emit(EventType.CONTROLLER_INIT, { name: this.name });
    } catch (error) {
      logger.error(`控制器 ${this.name} 初始化失败`, error);
      this.emit(EventType.ERROR_OCCURRED, {
        context: "controller:init",
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 注册所有路由到IPC管理器
   */
  async register() {
    if (!this.initialized) {
      await this.initialize();
    }

    // 注册控制器级别的中间件
    for (const middleware of this.middlewares) {
      ipcManager.use(middleware);
    }

    // 注册所有路由
    for (const [channel, route] of this.routes) {
      ipcManager.handle(channel, route.handler, route.options);
    }
  }

  /**
   * 初始化前钩子
   */
  async beforeInit() {
    // 子类可以重写此方法
  }

  /**
   * 初始化后钩子
   */
  async afterInit() {
    // 子类可以重写此方法
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 子类可以重写此方法来设置事件监听
  }

  /**
   * 销毁前钩子
   */
  async beforeDestroy() {
    // 子类可以重写此方法
  }

  /**
   * 销毁后钩子
   */
  async afterDestroy() {
    // 子类可以重写此方法
  }

  /**
   * 销毁控制器
   */
  async destroy() {
    if (this.destroyed) {
      return;
    }

    try {
      await this.beforeDestroy();

      // 移除所有事件监听器
      this.eventListeners.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          eventBus.off(event, handler);
        });
      });
      this.eventListeners.clear();

      // 清理依赖
      this.dependencies.clear();

      // 清理路由
      this.routes.clear();

      await this.afterDestroy();

      this.destroyed = true;
      this.initialized = false;

      this.emit(EventType.CONTROLLER_DESTROY, { name: this.name });
    } catch (error) {
      logger.error(`控制器 ${this.name} 销毁失败`, error);
      this.emit(EventType.ERROR_OCCURRED, {
        context: "controller:destroy",
        error: error.message,
      });
    }
  }

  /**
   * 获取控制器状态
   */
  getState() {
    return {
      name: this.name,
      initialized: this.initialized,
      destroyed: this.destroyed,
      routeCount: this.routes.size,
      middlewareCount: this.middlewares.length,
      dependencyCount: this.dependencies.size,
      eventListenerCount: Array.from(this.eventListeners.values()).reduce(
        (total, handlers) => total + handlers.length,
        0
      ),
    };
  }

  /**
   * 错误处理
   * @param {Error} error 错误对象
   * @param {string} context 上下文信息
   */
  handleError(error, context = "") {
    logger.error(`${this.name}控制器错误${context ? ` (${context})` : ""}:`, {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }

  /**
   * 验证参数
   * @param {Object} params 参数对象
   * @param {Object} schema 验证模式
   */
  validateParams(params, schema) {
    for (const [key, validator] of Object.entries(schema)) {
      if (validator.required && !(key in params)) {
        throw new Error(`缺少必需参数: ${key}`);
      }

      if (key in params && validator.type) {
        const actualType = typeof params[key];
        if (actualType !== validator.type) {
          throw new Error(`参数 ${key} 类型错误，期望 ${validator.type}，实际 ${actualType}`);
        }
      }
    }
  }
}

module.exports = BaseController;
