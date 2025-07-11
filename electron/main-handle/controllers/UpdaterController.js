const BaseController = require("../core/BaseController");
const { autoUpdater } = require("electron-updater");
const { app } = require("electron");
const { logger, compareVersions } = require("../../utils");

class UpdaterController extends BaseController {
  constructor() {
    super("Updater");
  }

  /**
   * 定义路由配置
   */
  defineRoutes() {
    return [
      { channel: "check-for-updates", handler: "checkForUpdates" },
      { channel: "download-update", handler: "downloadUpdate" },
      { channel: "quit-and-install", handler: "quitAndInstall" },
      { channel: "get-app-version", handler: "getAppVersion" },
    ];
  }

  /**
   * 设置自动更新器
   */
  setupAutoUpdater() {
    autoUpdater.verifySignature = false;

    // 设置更新服务器 URL
    if (app.isPackaged) {
      autoUpdater.setFeedURL({
        provider: "github",
        owner: "chen-ziwen",
        repo: "mbo-theme-tool",
        releaseType: "release",
      });
    }

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
  }

  /**
   * 检查更新
   * @param {Object} event IPC事件对象
   */
  async checkForUpdates(event) {
    try {
      const result = await autoUpdater.checkForUpdates();

      // 只返回可序列化的数据
      if (result && result.updateInfo) {
        const currentVersion = app.getVersion();
        const remoteVersion = result.updateInfo.version;

        // 比较版本号，只有远程版本大于当前版本时才认为有更新
        const isUpdateAvailable = compareVersions(remoteVersion, currentVersion) > 0;

        return {
          updateAvailable: isUpdateAvailable,
          version: result.updateInfo.version,
          releaseNotes: result.updateInfo.releaseNotes || "",
          releaseDate: result.updateInfo.releaseDate || "",
          currentVersion: currentVersion,
        };
      } else {
        return {
          updateAvailable: false,
          version: null,
          releaseNotes: "",
          releaseDate: "",
          currentVersion: app.getVersion(),
        };
      }
    } catch (error) {
      this.handleError(error, "checkForUpdates");
    }
  }

  /**
   * 下载更新
   * @param {Object} event IPC事件对象
   */
  async downloadUpdate(event) {
    try {
      logger.info("开始下载更新...");

      // 检查是否在开发环境
      if (!app.isPackaged) {
        throw new Error("开发环境不支持自动更新");
      }

      // 添加调试信息
      logger.info("更新服务器 URL:", autoUpdater.getFeedURL());
      logger.info("当前应用版本:", app.getVersion());

      // 检查网络连接和更新
      const updateCheckResult = await autoUpdater.checkForUpdates();
      if (!updateCheckResult || !updateCheckResult.updateInfo) {
        throw new Error("没有可用的更新");
      }

      logger.info("找到更新，开始下载:", updateCheckResult.updateInfo);

      // 开始下载
      const downloadResult = await autoUpdater.downloadUpdate();
      logger.info("更新下载完成", downloadResult);
      return true;
    } catch (error) {
      logger.error("下载更新失败:", error);
      logger.error("错误详情:", {
        message: error.message,
        stack: error.stack,
        feedURL: autoUpdater.getFeedURL(),
      });

      // 提供更详细的错误信息
      let errorMessage = `下载失败: ${error.message}`;

      if (error.message.includes("net::")) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else if (error.message.includes("404")) {
        errorMessage =
          "更新文件不存在，请检查 GitHub Release 是否包含所有必要文件（latest.yml等）";
      } else if (error.message.includes("403")) {
        errorMessage = "访问被拒绝，可能是权限问题";
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "无法连接到更新服务器，请检查网络连接";
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * 退出并安装更新
   * @param {Object} event IPC事件对象
   */
  async quitAndInstall(event) {
    try {
      autoUpdater.quitAndInstall();
    } catch (error) {
      this.handleError(error, "quitAndInstall");
    }
  }

  /**
   * 获取应用版本
   * @param {Object} event IPC事件对象
   */
  async getAppVersion(event) {
    return app.getVersion();
  }

  /**
   * 检查更新并通知
   */
  checkForUpdatesAndNotify() {
    autoUpdater.checkForUpdatesAndNotify();
  }

  /**
   * 控制器初始化
   */
  async onInit() {
    // 初始化更新服务
    this.setupAutoUpdater();
    // 检查更新
    this.checkForUpdatesAndNotify();
  }
}

module.exports = UpdaterController;
