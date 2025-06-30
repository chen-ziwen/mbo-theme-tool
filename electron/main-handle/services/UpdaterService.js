const { autoUpdater } = require("electron-updater");
const { app } = require("electron");
const { logger } = require("../../utils");

// 禁用签名验证
process.env.ELECTRON_UPDATER_ALLOW_UNVERIFIED = "true";
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

/**
 * 更新服务
 * 提供与IPC无关的更新相关业务逻辑
 */
class UpdaterService {
  /**
   * 设置自动更新器
   */
  static setupAutoUpdater() {
    // 强制禁用签名验证
    process.env.ELECTRON_UPDATER_ALLOW_UNVERIFIED = "true";
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.disableWebInstaller = false;
    
    // 设置更新服务器 URL
    if (app.isPackaged) {
      autoUpdater.setFeedURL({
        provider: "github",
        owner: "chen-ziwen",
        repo: "mbo-theme-tool",
        releaseType: "release"
      });
    }
    
    logger.info("签名验证状态:", {
      allowUnverified: process.env.ELECTRON_UPDATER_ALLOW_UNVERIFIED,
      disableSecurityWarnings: process.env.ELECTRON_DISABLE_SECURITY_WARNINGS
    });

    autoUpdater.on("error", (err) => {
      logger.error("更新出错:", err);
    });

    autoUpdater.on("checking-for-update", () => {
      logger.info("正在检查更新...");
    });

    autoUpdater.on("update-available", (info) => {
      logger.info("发现可用更新:", info);
    });

    autoUpdater.on("update-not-available", (info) => {
      logger.info("当前已是最新版本:", info);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      logger.info(`下载进度: ${progressObj.percent}%`);
    });

    autoUpdater.on("update-downloaded", (info) => {
      logger.info("更新下载完成:", info);
    });

    // 自动更新器事件监听已设置
  }

  /**
   * 检查更新并通知
   */
  static checkForUpdatesAndNotify() {
    autoUpdater.checkForUpdatesAndNotify();
  }

  /**
   * 获取应用版本
   */
  static getAppVersion() {
    return app.getVersion();
  }

  /**
   * 初始化更新服务
   */
  static initialize() {
    this.setupAutoUpdater();
    // 更新服务已初始化
  }
}

module.exports = UpdaterService;