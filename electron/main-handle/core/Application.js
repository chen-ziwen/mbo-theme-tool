const ipcManager = require("./IPCManager");
const controllerManager = require("./ControllerManager");
const { eventBus, EventType } = require("./EventBus");
const { container } = require("./DIContainer");
const { logger } = require("../../utils/logger");
const path = require("path");

/**
 * 应用程序主类
 * 负责整个应用的启动、配置和生命周期管理
 */
class Application {
  constructor(options = {}) {
    this.options = {
      controllersPath: path.join(__dirname, "../controllers"),
      hotReload: process.env.NODE_ENV === "development",
      autoStart: true,
      middleware: [],
      services: new Map(),
      ...options,
    };

    this.started = false;
    this.startTime = null;
    this.isShuttingDown = false; // 添加关闭状态标记
    this.stats = {
      startupTime: 0,
      controllersLoaded: 0,
      routesRegistered: 0,
      errors: 0,
    };

    // 绑定方法
    this.bindMethods();

    // 设置错误处理
    this.setupErrorHandling();
  }

  /**
   * 绑定方法上下文
   */
  bindMethods() {
    const methods = ["start", "stop", "restart", "handleError"];
    methods.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    // 监听应用级错误
    eventBus.on(EventType.ERROR_OCCURRED, this.handleError);

    // 监听未捕获的异常
    process.on("uncaughtException", (error) => {
      // 如果应用正在关闭，避免写入日志
      if (!this.isShuttingDown) {
        try {
          logger.error("未捕获的异常:", error);
        } catch (logError) {
          console.error("日志写入失败:", logError.message);
        }
      }
      this.handleError({ error: error.message, context: "uncaughtException" });
    });

    process.on("unhandledRejection", (reason, promise) => {
      // 如果应用正在关闭，避免写入日志
      if (!this.isShuttingDown) {
        try {
          logger.error("未处理的Promise拒绝:", reason);
        } catch (logError) {
          console.error("日志写入失败:", logError.message);
        }
      }
      this.handleError({ error: reason, context: "unhandledRejection" });
    });
  }

  /**
   * 注册服务到容器
   */
  registerServices() {
    // 注册核心服务 - 使用工厂函数
    container.registerFactory("ipcManager", () => ipcManager);
    container.registerFactory("controllerManager", () => controllerManager);
    container.registerFactory("eventBus", () => eventBus);
    container.registerFactory("logger", () => logger);
    container.registerFactory("application", () => this);

    // 注册用户定义的服务
    this.options.services.forEach((factory, name) => {
      if (typeof factory === "function") {
        container.registerFactory(name, factory);
      } else {
        container.registerFactory(name, () => factory);
      }
    });
  }

  /**
   * 注册全局中间件
   */
  registerMiddleware() {
    this.options.middleware.forEach((middleware) => {
      ipcManager.use(middleware);
    });
  }

  /**
   * 启动应用
   */
  async start() {
    if (this.started) {
      return;
    }

    this.startTime = Date.now();

    try {
      // 1. 注册服务
      this.registerServices();

      // 2. 注册全局中间件
      this.registerMiddleware();

      // 3. 设置控制器管理器
      controllerManager.setControllerDir(this.options.controllersPath);

      if (this.options.hotReload) {
        controllerManager.enableHotReload();
      }

      // 4. 启动控制器管理器
      await controllerManager.start();

      // 5. 收集统计信息
      this.collectStats();

      this.started = true;
      this.stats.startupTime = Date.now() - this.startTime;

      // 发射启动完成事件
      eventBus.safeEmit(EventType.APPLICATION_STARTED, {
        startupTime: this.stats.startupTime,
        stats: this.stats,
      });
    } catch (error) {
      logger.error("应用启动失败:", error);
      this.stats.errors++;

      eventBus.safeEmit(EventType.ERROR_OCCURRED, {
        context: "application:start",
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * 停止应用
   */
  async stop() {
    if (!this.started) {
      return;
    }

    // 标记应用正在关闭，避免在关闭过程中记录错误日志
    this.isShuttingDown = true;

    try {
      // 停止控制器管理器
      await controllerManager.destroy();

      // 清理IPC管理器
      await ipcManager.destroy();

      // 清理容器
      await container.destroy();

      this.started = false;

      eventBus.safeEmit(EventType.APPLICATION_STOPPED);
    } catch (error) {
      // 只有在非关闭状态下才记录错误
      if (!this.isShuttingDown) {
        logger.error("应用停止失败:", error);
        this.stats.errors++;
      }
      throw error;
    }
  }

  /**
   * 重启应用
   */
  async restart() {
    logger.info("重启应用...");

    await this.stop();
    await this.start();

    logger.info("应用重启完成");
  }

  /**
   * 收集统计信息
   */
  collectStats() {
    this.stats.controllersLoaded = controllerManager.getControllers().size;
    this.stats.routesRegistered = Array.from(controllerManager.getControllers().values()).reduce(
      (total, controller) => total + controller.routes.size,
      0
    );
  }

  /**
   * 处理错误
   */
  handleError(errorInfo) {
    // 如果应用正在关闭，避免写入日志以防止winston流错误
    if (this.isShuttingDown) {
      return;
    }

    this.stats.errors++;

    try {
      logger.error(`应用错误 [${errorInfo.context}]:`, errorInfo.error);
    } catch (logError) {
      // 如果日志写入失败，静默处理，避免递归错误
      console.error("日志写入失败:", logError.message);
    }

    // 可以在这里添加错误报告、重试逻辑等
  }

  /**
   * 获取应用状态
   */
  getStatus() {
    return {
      started: this.started,
      startTime: this.startTime,
      uptime: this.started ? Date.now() - this.startTime : 0,
      stats: this.stats,
      controllers: controllerManager.getStats(),
      ipc: ipcManager.getStats(),
      memory: process.memoryUsage(),
      version: process.version,
    };
  }

  /**
   * 获取性能信息
   */
  getPerformanceInfo() {
    return {
      application: this.getStatus(),
      ipc: {
        stats: ipcManager.getStats(),
        performance: ipcManager.getPerformanceData(),
        slowCalls: ipcManager.getSlowCalls(),
      },
      controllers: controllerManager.getStats(),
      eventBus: eventBus.getStats(),
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // 检查应用状态
      health.checks.application = {
        status: this.started ? "up" : "down",
        uptime: this.started ? Date.now() - this.startTime : 0,
      };

      // 检查控制器
      const controllerStats = controllerManager.getStats();
      health.checks.controllers = {
        status: controllerStats.total > 0 ? "up" : "down",
        total: controllerStats.total,
      };

      // 检查IPC
      const ipcStats = ipcManager.getStats();
      health.checks.ipc = {
        status: "up",
        totalCalls: ipcStats.totalCalls,
        errorRate:
          ipcStats.totalCalls > 0
            ? ((ipcStats.errors / ipcStats.totalCalls) * 100).toFixed(2) + "%"
            : "0%",
      };

      // 检查内存使用
      const memory = process.memoryUsage();
      health.checks.memory = {
        status: memory.heapUsed < 500 * 1024 * 1024 ? "up" : "warning", // 500MB阈值
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      };

      // 检查错误率
      if (this.stats.errors > 10) {
        health.status = "warning";
      }

      // 检查是否有任何检查失败
      const hasFailures = Object.values(health.checks).some((check) => check.status === "down");

      if (hasFailures) {
        health.status = "unhealthy";
      }
    } catch (error) {
      health.status = "unhealthy";
      health.error = error.message;
    }

    return health;
  }
}

// 创建应用实例
const application = new Application();

module.exports = {
  Application,
  application,
};
