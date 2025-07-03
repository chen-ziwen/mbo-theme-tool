const fs = require("fs").promises;
const path = require("path");
const { logger } = require("../../utils");

/**
 * 控制器管理器
 * 负责自动发现、加载、注册和管理所有控制器
 */
class ControllerManager {
  constructor() {
    this.controllers = new Map();
    this.controllerStates = new Map();
    this.controllerDir = path.join(__dirname, "../controllers");
    this.initialized = false;
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

      return controllerFiles;
    } catch (error) {
      logger.error("发现控制器失败:", error);
      return [];
    }
  }

  /**
   * 加载单个控制器
   * @param {string} filename 控制器文件名
   */
  async loadController(filename) {
    const controllerPath = path.join(this.controllerDir, filename);
    const controllerName = path.basename(filename, ".js");

    try {
      const ControllerClass = require(controllerPath);

      if (typeof ControllerClass !== "function") {
        throw new Error(`控制器 ${controllerName} 必须导出一个类`);
      }

      const controller = new ControllerClass();

      if (typeof controller.init === "function") {
        await controller.init();
      }

      this.controllers.set(controllerName, controller);
      this.controllerStates.set(controllerName, "loaded");

      return controller;
    } catch (error) {
      logger.error(`加载控制器失败: ${controllerName}`, error);
      this.controllerStates.set(controllerName, "error");
      throw error;
    }
  }

  /**
   * 注册控制器路由
   * @param {Object} controller 控制器实例
   */
  async registerController(controller) {
    try {
      if (typeof controller.register === "function") {
        await controller.register();
      } else {
        logger.warn(`控制器 ${controller.name} 没有 register 方法`);
      }
    } catch (error) {
      logger.error(`注册控制器路由失败: ${controller.name}`, error);
      throw error;
    }
  }

  /**
   * 启动控制器管理器
   */
  async start() {
    if (this.initialized) {
      logger.warn("控制器管理器已经初始化");
      return;
    }

    try {
      const controllerFiles = await this.discoverControllers();

      if (controllerFiles.length === 0) {
        logger.warn("没有发现任何控制器文件");
        this.initialized = true;
        return;
      }

      // 加载所有控制器
      for (const filename of controllerFiles) {
        try {
          const controller = await this.loadController(filename);
          await this.registerController(controller);
        } catch (error) {
          logger.error(`处理控制器 ${filename} 时出错:`, error);
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error("启动控制器管理器失败:", error);
      throw error;
    }
  }

  /**
   * 设置控制器目录
   * @param {string} dir 控制器目录路径
   */
  setControllerDir(dir) {
    this.controllerDir = path.resolve(dir);
  }

  /**
   * 重新加载控制器
   * @param {string} controllerName 控制器名称
   */
  async reloadController(controllerName) {
    try {
      // 销毁现有控制器
      if (this.controllers.has(controllerName)) {
        await this.destroyController(controllerName);
      }

      // 重新加载
      const filename = controllerName + ".js";
      const controller = await this.loadController(filename);
      await this.registerController(controller);

      return controller;
    } catch (error) {
      logger.error(`重新加载控制器失败: ${controllerName}`, error);
      throw error;
    }
  }

  /**
   * 销毁单个控制器
   * @param {string} controllerName 控制器名称
   */
  async destroyController(controllerName) {
    const controller = this.controllers.get(controllerName);
    if (!controller) {
      return;
    }

    try {
      if (typeof controller.destroy === "function") {
        await controller.destroy();
      }

      this.controllers.delete(controllerName);
      this.controllerStates.delete(controllerName);
    } catch (error) {
      logger.error(`销毁控制器失败: ${controllerName}`, error);
    }
  }

  /**
   * 获取控制器
   * @param {string} name 控制器名称
   */
  getController(name) {
    return this.controllers.get(name);
  }

  /**
   * 获取所有控制器
   */
  getControllers() {
    return this.controllers;
  }

  /**
   * 获取控制器名称列表
   */
  getControllerNames() {
    return Array.from(this.controllers.keys());
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: this.controllers.size,
      loaded: 0,
      error: 0,
      states: {},
    };

    for (const [name, state] of this.controllerStates) {
      stats.states[name] = state;
      if (state === "loaded") {
        stats.loaded++;
      } else if (state === "error") {
        stats.error++;
      }
    }

    return stats;
  }

  /**
   * 检查控制器是否存在
   * @param {string} name 控制器名称
   */
  hasController(name) {
    return this.controllers.has(name);
  }

  /**
   * 重启所有控制器
   */
  async restart() {
    await this.destroy();
    await this.start();
  }

  /**
   * 销毁控制器管理器
   */
  async destroy() {
    try {
      // 销毁所有控制器
      const destroyPromises = [];
      for (const controllerName of this.controllers.keys()) {
        destroyPromises.push(this.destroyController(controllerName));
      }

      await Promise.all(destroyPromises);

      // 清理状态
      this.controllers.clear();
      this.controllerStates.clear();
      this.initialized = false;
    } catch (error) {
      logger.error("销毁控制器管理器时出错:", error);
    }
  }
}

module.exports = new ControllerManager();
