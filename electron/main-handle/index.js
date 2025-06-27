const { application } = require("./core/Application");
const config = require("./config/app.config");
const { logger } = require("../utils/logger");
const { eventBus, EventType } = require("./core/EventBus");
const ipcManager = require("./core/IPCManager");
const controllerManager = require("./core/ControllerManager");

// 获取环境配置
const env = process.env.NODE_ENV || "development";
const envConfig = config[env] || config.development;

// 合并配置
const appConfig = {
  controllersPath: config.controllers.path,
  hotReload: config.controllers.hotReload && envConfig.hotReload,
  middleware: config.middleware.map((m) => m.handler),
  services: config.services,
};

/**
 * 设置事件监听
 */
function setupEventListeners() {
  // 监听错误事件
  eventBus.on(EventType.ERROR_OCCURRED, (data) => {
    logger.error(`💥 错误发生 [${data.context}]:`, data.error);
  });

  // 监听性能事件
  if (envConfig.performanceMonitoring) {
    eventBus.on("ipc:call:success", (data) => {
      if (data.duration > config.performance.slowCallThreshold) {
        logger.warn(`🐌 慢调用检测: ${data.channel} (${data.duration.toFixed(2)}ms)`);
      }
    });
  }
}

/**
 * 新的主处理器注册函数
 * 使用现代化架构启动应用
 */
const registerHandler = async () => {
  try {
    // 设置应用配置
    Object.assign(application.options, appConfig);

    // 设置事件监听
    setupEventListeners();

    // 启动应用
    await application.start();

    // 输出启动信息
    const status = application.getStatus();
    logger.info("✅ 应用启动成功!");
    logger.info(`📊 统计信息:`);
    logger.info(`   - 控制器: ${status.controllers.total}`);
    logger.info(`   - 路由: ${status.stats.routesRegistered}`);
    logger.info(`   - 启动时间: ${status.stats.startupTime}ms`);
    logger.info(`   - 内存使用: ${(status.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);

    // 在开发环境下启用额外功能
    if (env === "development") {
      setupDevelopmentFeatures();
    }
  } catch (error) {
    logger.error("❌ 应用启动失败:", error);
    throw error;
  }
};

/**
 * 设置开发环境功能
 */
function setupDevelopmentFeatures() {
  logger.info("🔧 启用开发环境功能...");

  // 健康检查端点
  ipcManager.handle("dev:health", async () => {
    return await application.healthCheck();
  });

  ipcManager.handle("dev:status", async () => {
    return application.getStatus();
  });

  ipcManager.handle("dev:performance", async () => {
    return application.getPerformanceInfo();
  });

  ipcManager.handle("dev:restart", async () => {
    logger.info("🔄 开发环境重启请求...");
    await application.restart();
    return { success: true, message: "应用重启完成" };
  });

  logger.info("✅ 开发环境功能已启用");
}

/**
 * 清理函数
 * 在应用关闭时调用
 */
const cleanup = async () => {
  await application.stop();
};

// 导出函数和实例
module.exports = {
  registerHandler,
  cleanup,
  application,
  controllerManager,
  ipcManager,
  eventBus,
};
