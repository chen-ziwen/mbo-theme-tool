const { logger } = require("../utils");
const ipcManager = require("./core/IPCManager");
const controllerManager = require("./core/ControllerManager");

/**
 * 注册处理器
 */
async function registerHandler() {
  try {
    // 设置控制器目录
    controllerManager.setControllerDir(__dirname + "/controllers");

    // 启动控制器管理器
    await controllerManager.start();
  } catch (error) {
    logger.error("主处理器启动失败:", error);
    throw error;
  }
}

/**
 * 清理资源
 */
async function cleanup() {
  try {
    logger.info("开始清理资源...");

    await controllerManager.destroy();
    await ipcManager.destroy();

    logger.info("资源清理完成");
  } catch (error) {
    logger.error("清理资源时出错:", error);
  }
}

module.exports = {
  registerHandler,
  cleanup,
  controllerManager,
  ipcManager,
};
