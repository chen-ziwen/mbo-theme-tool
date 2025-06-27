const fs = require("fs").promises;
const path = require("path");
const { logger } = require("../../utils");
const { eventBus } = require("./EventBus");
const { container } = require("./DIContainer");
const { EventType, ControllerState } = require("./types");

/**
 * 控制器管理器
 * 负责自动发现、加载、注册和管理所有控制器
 * 支持依赖注入、生命周期管理、热重载等现代化特性
 */
class ControllerManager {
  constructor() {
    this.controllers = new Map();
    this.controllerStates = new Map();
    this.controllerDir = path.join(__dirname, "../controllers");
    this.initialized = false;
    this.hotReloadEnabled = false;
    this.watchedFiles = new Set();

    // 注册到依赖容器
    container.register("controllerManager", this, { singleton: true });
  }

  /**
   * 自动发现控制器文件
   */
  async discoverControllers() {
    try {
      const files = await fs.readdir(this.controllerDir);
      const controllerFiles = files.filter(
        (file) => file.endsWith("Controller.js") && !file.startsWith("Base")
      );

      eventBus.safeEmit("controllers:discovered", { files: controllerFiles });
      return controllerFiles;
    } catch (error) {
      logger.error("发现控制器失败:", error);
      eventBus.safeEmit(EventType.ERROR_OCCURRED, {
        context: "controller:discovery",
        error: error.message,
      });
      return [];
    }
  }

  /**
   * 加载单个控制器
   * @param {string} filename 控制器文件名
   */
  async loadController(filename) {
    const controllerName = path.basename(filename, ".js");

    try {
      this.setControllerState(controllerName, ControllerState.INITIALIZING);

      const controllerPath = path.join(this.controllerDir, filename);

      // 清除require缓存以支持热重载
      delete require.cache[require.resolve(controllerPath)];

      const ControllerClass = require(controllerPath);

      if (typeof ControllerClass !== "function") {
        throw new Error(`${filename} 没有导出有效的控制器类`);
      }

      // 创建控制器实例，支持依赖注入
      const controller = this.createControllerInstance(ControllerClass, controllerName);

      // 注册到容器
      container.registerSingleton(`controller:${controllerName}`, controller);

      this.controllers.set(controllerName, controller);
      this.setControllerState(controllerName, ControllerState.INITIALIZED);

      // 添加文件监听（如果启用热重载）
      if (this.hotReloadEnabled) {
        this.watchControllerFile(controllerPath, controllerName);
      }

      eventBus.safeEmit(EventType.CONTROLLER_INIT, {
        name: controllerName,
        controller,
      });

      return controller;
    } catch (error) {
      this.setControllerState(controllerName, ControllerState.DESTROYED);
      logger.error(`加载控制器失败: ${filename}`, error);
      eventBus.safeEmit(EventType.ERROR_OCCURRED, {
        context: "controller:load",
        controller: controllerName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 创建控制器实例（支持依赖注入）
   */
  createControllerInstance(ControllerClass, controllerName) {
    // 检查是否需要依赖注入
    if (ControllerClass.dependencies) {
      const dependencies = ControllerClass.dependencies.map((dep) => {
        return container.resolve(dep);
      });
      return new ControllerClass(...dependencies);
    }

    return new ControllerClass();
  }

  /**
   * 设置控制器状态
   */
  setControllerState(name, state) {
    this.controllerStates.set(name, {
      state,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    });
  }

  /**
   * 获取控制器状态
   */
  getControllerState(name) {
    return this.controllerStates.get(name)?.state || ControllerState.UNINITIALIZED;
  }

  /**
   * 监听控制器文件变化（热重载）
   */
  watchControllerFile(filePath, controllerName) {
    if (this.watchedFiles.has(filePath)) {
      return;
    }

    const fs = require("fs");

    fs.watchFile(filePath, { interval: 1000 }, async () => {
      logger.info(`检测到控制器文件变化: ${controllerName}`);
      try {
        await this.reloadController(controllerName);
      } catch (error) {
        logger.error(`热重载控制器失败: ${controllerName}`, error);
      }
    });

    this.watchedFiles.add(filePath);
  }

  /**
   * 重新加载控制器
   */
  async reloadController(controllerName) {
    logger.info(`重新加载控制器: ${controllerName}`);

    // 销毁旧控制器
    if (this.controllers.has(controllerName)) {
      await this.destroyController(controllerName);
    }

    // 重新加载
    const filename = `${controllerName}.js`;
    await this.loadController(filename);

    // 重新注册
    const controller = this.controllers.get(controllerName);
    if (controller) {
      await this.registerController(controller);
    }
  }

  /**
   * 手动注册控制器
   * @param {string} name 控制器名称
   * @param {Object} controller 控制器实例
   */
  registerController(name, controller) {
    if (typeof controller.register !== "function") {
      throw new Error(`控制器 ${name} 必须有 register 方法`);
    }

    this.controllers.set(name, controller);
  }

  /**
   * 初始化所有控制器
   */
  async initializeControllers() {
    for (const [name, controller] of this.controllers) {
      try {
        if (typeof controller.onInit === "function") {
          await controller.onInit();
        }
      } catch (error) {
        logger.error(`初始化控制器 ${name} 失败:`, error);
      }
    }
  }

  /**
   * 注册所有控制器的路由
   */
  async registerAllRoutes() {
    for (const [name, controller] of this.controllers) {
      try {
        await controller.register();
      } catch (error) {
        logger.error(`注册控制器 ${name} 路由失败:`, error);
      }
    }
  }

  /**
   * 销毁控制器
   */
  async destroyController(controllerName) {
    const controller = this.controllers.get(controllerName);
    if (!controller) {
      return;
    }

    try {
      this.setControllerState(controllerName, ControllerState.DESTROYING);

      // 调用控制器的销毁方法（如果存在）
      if (typeof controller.destroy === "function") {
        await controller.destroy();
      }

      // 从容器中移除
      container.remove(`controller:${controllerName}`);

      // 从管理器中移除
      this.controllers.delete(controllerName);
      this.setControllerState(controllerName, ControllerState.DESTROYED);

      eventBus.safeEmit(EventType.CONTROLLER_DESTROY, {
        name: controllerName,
      });
    } catch (error) {
      logger.error(`销毁控制器失败: ${controllerName}`, error);
      eventBus.safeEmit(EventType.ERROR_OCCURRED, {
        context: "controller:destroy",
        controller: controllerName,
        error: error.message,
      });
    }
  }

  /**
   * 启用热重载
   */
  enableHotReload() {
    this.hotReloadEnabled = true;
    // 启用控制器热重载
  }

  /**
   * 禁用热重载
   */
  disableHotReload() {
    this.hotReloadEnabled = false;

    // 清理文件监听
    const fs = require("fs");
    this.watchedFiles.forEach((filePath) => {
      fs.unwatchFile(filePath);
    });
    this.watchedFiles.clear();
  }

  /**
   * 获取所有控制器
   * @returns {Map} 控制器映射
   */
  getControllers() {
    return this.controllers;
  }

  /**
   * 获取指定控制器
   * @param {string} name 控制器名称
   * @returns {Object|null} 控制器实例
   */
  getController(name) {
    return this.controllers.get(name) || null;
  }

  /**
   * 设置控制器目录
   * @param {string} dir 控制器目录路径
   */
  setControllerDir(dir) {
    this.controllerDir = dir;
    // 设置控制器目录
  }

  /**
   * 获取所有控制器名称
   */
  getControllerNames() {
    return Array.from(this.controllers.keys());
  }

  /**
   * 获取控制器状态信息
   */
  getControllerStates() {
    const states = {};
    this.controllerStates.forEach((info, name) => {
      states[name] = info;
    });
    return states;
  }

  /**
   * 获取控制器统计信息
   */
  getStats() {
    return {
      total: this.controllers.size,
      states: this.getControllerStates(),
      hotReloadEnabled: this.hotReloadEnabled,
      watchedFiles: this.watchedFiles.size,
    };
  }

  /**
   * 销毁所有控制器
   */
  async destroyControllers() {
    for (const [name, controller] of this.controllers) {
      try {
        if (typeof controller.onDestroy === "function") {
          await controller.onDestroy();
        }
      } catch (error) {
        logger.error(`销毁控制器 ${name} 失败:`, error);
      }
    }

    this.controllers.clear();
  }

  /**
   * 清理所有控制器
   */
  async clear() {
    // 销毁所有控制器
    const destroyPromises = Array.from(this.controllers.keys()).map((name) =>
      this.destroyController(name)
    );

    await Promise.all(destroyPromises);

    // 禁用热重载
    this.disableHotReload();

    // 清理状态
    this.controllerStates.clear();
  }

  /**
   * 销毁管理器
   */
  async destroy() {
    await this.clear();
    eventBus.safeEmit(EventType.CONTROLLER_MANAGER_DESTROY);
  }

  /**
   * 启动控制器管理器
   */
  async start() {
    const controllerFiles = await this.discoverControllers();
    await this.loadAllControllers(controllerFiles);
    await this.initializeControllers();
    await this.registerAllRoutes();
  }

  /**
   * 加载所有控制器
   */
  async loadAllControllers(controllerFiles) {
    for (const filename of controllerFiles) {
      try {
        await this.loadController(filename);
      } catch (error) {
        logger.error(`加载控制器失败: ${filename}`, error);
      }
    }
  }

  /**
   * 停止控制器管理器
   */
  async stop() {
    await this.destroyControllers();
  }
}

// 创建单例实例
const controllerManager = new ControllerManager();

module.exports = controllerManager;
