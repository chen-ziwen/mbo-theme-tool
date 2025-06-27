const { logger } = require("../../utils");
const { eventBus } = require("./EventBus");

/**
 * 依赖注入容器
 * 提供服务注册、解析和生命周期管理
 */
class DIContainer {
  constructor() {
    this.services = new Map();
    this.instances = new Map();
    this.factories = new Map();
    this.singletons = new Set();
    this.resolving = new Set(); // 防止循环依赖
  }

  /**
   * 注册服务
   * @param {string} name 服务名称
   * @param {Function|Object} implementation 实现类或实例
   * @param {Object} options 选项
   */
  register(name, implementation, options = {}) {
    const { singleton = true, factory = false, dependencies = [], lazy = false } = options;

    this.services.set(name, {
      implementation,
      dependencies,
      singleton,
      factory,
      lazy,
      registered: Date.now(),
    });

    if (singleton) {
      this.singletons.add(name);
    }

    // 如果不是懒加载且是单例，立即创建实例
    if (!lazy && singleton && !factory) {
      this.resolve(name);
    }

    logger.debug(`注册服务: ${name}`, { singleton, factory, dependencies });
    eventBus.safeEmit("service:registered", { name, options });
  }

  /**
   * 注册工厂函数
   * @param {string} name 服务名称
   * @param {Function} factory 工厂函数
   * @param {Object} options 选项
   */
  registerFactory(name, factory, options = {}) {
    this.factories.set(name, factory);
    this.register(name, factory, { ...options, factory: true });
  }

  /**
   * 注册单例
   * @param {string} name 服务名称
   * @param {Function|Object} implementation 实现
   * @param {Object} options 选项
   */
  registerSingleton(name, implementation, options = {}) {
    this.register(name, implementation, { ...options, singleton: true });
  }

  /**
   * 注册瞬态服务
   * @param {string} name 服务名称
   * @param {Function} implementation 实现类
   * @param {Object} options 选项
   */
  registerTransient(name, implementation, options = {}) {
    this.register(name, implementation, { ...options, singleton: false });
  }

  /**
   * 解析服务
   * @param {string} name 服务名称
   * @param {Object} context 解析上下文
   */
  resolve(name, context = {}) {
    if (!this.services.has(name)) {
      throw new Error(`服务 '${name}' 未注册`);
    }

    // 检查循环依赖
    if (this.resolving.has(name)) {
      throw new Error(`检测到循环依赖: ${name}`);
    }

    const service = this.services.get(name);

    // 如果是单例且已创建实例，直接返回
    if (service.singleton && this.instances.has(name)) {
      return this.instances.get(name);
    }

    this.resolving.add(name);

    try {
      const instance = this.createInstance(name, service, context);

      if (service.singleton) {
        this.instances.set(name, instance);
      }

      this.resolving.delete(name);

      eventBus.safeEmit("service:resolved", { name, instance });
      return instance;
    } catch (error) {
      this.resolving.delete(name);
      logger.error(`解析服务失败: ${name}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 创建服务实例
   */
  createInstance(name, service, context) {
    const { implementation, dependencies, factory } = service;

    // 解析依赖
    const resolvedDependencies = dependencies.map((dep) => {
      if (typeof dep === "string") {
        return this.resolve(dep, context);
      } else if (typeof dep === "object" && dep.name) {
        return this.resolve(dep.name, { ...context, ...dep.context });
      }
      return dep;
    });

    if (factory) {
      // 工厂函数
      return implementation(...resolvedDependencies, context);
    } else if (typeof implementation === "function") {
      // 构造函数
      return new implementation(...resolvedDependencies);
    } else {
      // 直接实例
      return implementation;
    }
  }

  /**
   * 检查服务是否已注册
   * @param {string} name 服务名称
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * 获取所有已注册的服务名称
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * 获取服务信息
   * @param {string} name 服务名称
   */
  getServiceInfo(name) {
    if (!this.services.has(name)) {
      return null;
    }

    const service = this.services.get(name);
    return {
      name,
      ...service,
      hasInstance: this.instances.has(name),
      instanceCount: service.singleton ? (this.instances.has(name) ? 1 : 0) : "N/A",
    };
  }

  /**
   * 移除服务
   * @param {string} name 服务名称
   */
  remove(name) {
    if (this.instances.has(name)) {
      const instance = this.instances.get(name);
      // 如果实例有销毁方法，调用它
      if (typeof instance.destroy === "function") {
        instance.destroy();
      }
      this.instances.delete(name);
    }

    this.services.delete(name);
    this.factories.delete(name);
    this.singletons.delete(name);

    logger.debug(`移除服务: ${name}`);
    eventBus.safeEmit("service:removed", { name });
  }

  /**
   * 创建子容器
   * @param {Object} options 选项
   */
  createChild(options = {}) {
    const child = new DIContainer();

    // 继承父容器的服务（可选）
    if (options.inherit !== false) {
      for (const [name, service] of this.services) {
        child.services.set(name, { ...service });
      }
    }

    return child;
  }

  /**
   * 批量注册服务
   * @param {Object} services 服务映射
   */
  registerBatch(services) {
    for (const [name, config] of Object.entries(services)) {
      if (typeof config === "function") {
        this.register(name, config);
      } else {
        const { implementation, ...options } = config;
        this.register(name, implementation, options);
      }
    }
  }

  /**
   * 获取容器统计信息
   */
  getStats() {
    return {
      totalServices: this.services.size,
      singletons: this.singletons.size,
      instances: this.instances.size,
      factories: this.factories.size,
      resolving: this.resolving.size,
    };
  }

  /**
   * 销毁容器，清理所有实例和服务
   */
  async destroy() {
    // 销毁所有实例
    for (const [name, instance] of this.instances) {
      try {
        if (typeof instance.destroy === "function") {
          await instance.destroy();
        }
      } catch (error) {
        logger.error(`销毁服务实例 '${name}' 失败:`, error);
      }
    }
    // 清理所有映射
    this.services.clear();
    this.instances.clear();
    this.factories.clear();
    this.singletons.clear();
    this.resolving.clear();
    eventBus.safeEmit("container:destroyed");
  }

  /**
   * 清理容器
   */
  clear() {
    // 销毁所有实例
    for (const [name, instance] of this.instances) {
      if (typeof instance.destroy === "function") {
        try {
          instance.destroy();
        } catch (error) {
          logger.error(`销毁服务实例失败: ${name}`, {
            error: error.message,
          });
        }
      }
    }

    this.services.clear();
    this.instances.clear();
    this.factories.clear();
    this.singletons.clear();
    this.resolving.clear();

    eventBus.safeEmit("container:cleared");
  }
}

// 创建全局容器实例
const container = new DIContainer();

// 注册核心服务
container.register("logger", logger, { singleton: true });
container.register("eventBus", eventBus, { singleton: true });

module.exports = {
  container,
  DIContainer,
};
