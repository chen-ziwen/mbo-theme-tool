const { app } = require("electron");
const { autoUpdater } = require("electron-updater");
const { logger } = require("../utils");

// 自动更新事件处理
const setupAutoUpdater = () => {
  autoUpdater.on("error", (err) => {
    logger.error("更新出错:", err);
  });
};

// 检查更新并通知
const checkForUpdatesAndNotify = () => {
  autoUpdater.checkForUpdatesAndNotify();
};

const checkForUpdates = async () => {
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
    logger.error("检查更新失败:", error);
    throw new Error(`检查更新失败: ${error.message}`);
  }
};

// 版本比较函数
const compareVersions = (version1, version2) => {
  const v1parts = version1.split(".").map(Number);
  const v2parts = version2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;

    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }

  return 0;
};

const downloadUpdate = async () => {
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
    if (error.message.includes("net::")) {
      throw new Error("网络连接失败，请检查网络设置");
    } else if (error.message.includes("404")) {
      throw new Error("更新文件不存在，请检查 GitHub Release 是否包含所有必要文件（latest.yml等）");
    } else if (error.message.includes("403")) {
      throw new Error("访问被拒绝，可能是权限问题");
    } else if (error.message.includes("ENOTFOUND")) {
      throw new Error("无法连接到更新服务器，请检查网络连接");
    } else {
      throw new Error(`下载失败: ${error.message}`);
    }
  }
};

const quitAndInstall = () => {
  autoUpdater.quitAndInstall();
};

const getAppVersion = () => {
  return app.getVersion();
};

const updaterHandlers = [
  {
    type: "handle",
    name: "check-for-updates",
    callback: checkForUpdates,
  },
  {
    type: "handle",
    name: "download-update",
    callback: downloadUpdate,
  },
  {
    type: "handle",
    name: "quit-and-install",
    callback: quitAndInstall,
  },
  {
    type: "handle",
    name: "get-app-version",
    callback: getAppVersion,
  },
];

module.exports = {
  updaterHandlers,
  setupAutoUpdater,
  checkForUpdatesAndNotify,
};
