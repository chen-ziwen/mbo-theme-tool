const { app, BrowserWindow } = require("electron");
const path = require("path");
const registerHandler = require("./main-handle");
const { setupAutoUpdater, checkForUpdatesAndNotify } = require("./main-handle/updater");
const { getIconPath, logger } = require("./utils");
const { initializeConfigs } = require("./main-handle/config");
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: getIconPath(),
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    const url = "http://localhost:5210/";
    win.loadURL(url);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 注册主进程事件处理函数
  registerHandler();
};

app.whenReady().then(async () => {
  logger.info("应用启动完成", { version: app.getVersion(), platform: process.platform });

  // 初始化配置目录和文件
  try {
    await initializeConfigs();
    logger.info("配置初始化完成");
  } catch (error) {
    logger.error("配置初始化失败:", error);
  }

  createWindow();

  // 设置自动更新事件监听
  setupAutoUpdater();

  // 检查更新
  checkForUpdatesAndNotify();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  logger.info("所有窗口已关闭");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  logger.info("应用即将退出");
});
