const ipcManager = require("./IPCManager");
const { logger } = require("../../utils/logger");

/**
 * 基础控制器类
 * 提供统一的控制器接口和路由注册机制
 */
class BaseController {
  constructor(name) {
    this.name =
      name || this.constructor.name.replace("Controller", "").toLowerCase();
    this.routes = new Map();
    this.middlewares = [];
    this.initialized = false;
    this.destroyed = false;

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
      return (
        typeof this[name] === "function" &&
        name !== "constructor" &&
        !name.startsWith("_")
      );
    });

    methodNames.forEach((name) => {
      this[name] = this[name].bind(this);
    });
  }

  /**
   * 初始化控制器
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      // 调用子类的初始化方法
      if (typeof this.onInit === "function") {
        await this.onInit();
      }

      this.initialized = true;
      // logger.info(`控制器 ${this.name} 初始化完成`);
    } catch (error) {
      logger.error(`控制器 ${this.name} 初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 注册路由到IPC管理器
   */
  async register() {
    if (this.destroyed) {
      throw new Error(`控制器 ${this.name} 已被销毁`);
    }

    try {
      // 获取路由定义
      const routeDefinitions = this.defineRoutes();

      // 注册定义的路由
      for (const route of routeDefinitions) {
        this.addRoute(route.channel, route.handler, route.options || {});
      }

      // 注册控制器中间件到IPC管理器
      for (const middleware of this.middlewares) {
        ipcManager.use(middleware);
      }

      // 注册所有路由到IPC管理器
      for (const [channel, route] of this.routes) {
        ipcManager.handle(channel, route.handler, route.options);
        // logger.info(`注册路由: ${channel} -> ${this.name}.${route.method}`);
      }

      // logger.info(
      //   `控制器 ${this.name} 注册完成，共 ${this.routes.size} 个路由`
      // );
    } catch (error) {
      logger.error(`控制器 ${this.name} 注册失败:`, error);
      throw error;
    }
  }

  /**
   * 获取路由信息
   */
  getRoutes() {
    const routes = [];
    for (const [channel, route] of this.routes) {
      routes.push({
        channel,
        method: route.method,
        options: route.options,
      });
    }
    return routes;
  }

  /**
   * 获取控制器统计信息
   */
  getStats() {
    return {
      name: this.name,
      routes: this.routes.size,
      middlewares: this.middlewares.length,
      initialized: this.initialized,
      destroyed: this.destroyed,
    };
  }

  /**
   * 销毁控制器
   */
  async destroy() {
    if (this.destroyed) {
      return;
    }

    try {
      // 移除所有注册的路由
      for (const channel of this.routes.keys()) {
        ipcManager.removeHandler(channel);
      }

      // 调用子类的销毁方法
      if (typeof this.onDestroy === "function") {
        await this.onDestroy();
      }

      // 清理状态
      this.routes.clear();
      this.middlewares = [];
      this.destroyed = true;
      this.initialized = false;

      logger.info(`控制器 ${this.name} 销毁完成`);
    } catch (error) {
      logger.error(`控制器 ${this.name} 销毁失败:`, error);
    }
  }

  /**
   * 重启控制器
   */
  async restart() {
    logger.info(`重启控制器: ${this.name}`);
    await this.destroy();
    await this.init();
    await this.register();
    logger.info(`控制器 ${this.name} 重启完成`);
  }

  /**
   * 检查控制器是否健康
   */
  healthCheck() {
    return {
      name: this.name,
      status: this.destroyed
        ? "destroyed"
        : this.initialized
        ? "healthy"
        : "initializing",
      routes: this.routes.size,
      uptime: this.initialized ? Date.now() - this.initTime : 0,
    };
  }

  /**
   * 生命周期钩子 - 初始化时调用
   * 子类可以重写此方法
   */
  async onInit() {
    // 子类实现
  }

  /**
   * 生命周期钩子 - 销毁时调用
   * 子类可以重写此方法
   */
  async onDestroy() {
    // 子类实现
  }
}

module.exports = BaseController;
