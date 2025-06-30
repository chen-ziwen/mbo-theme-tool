// 禁用签名验证
process.env.ELECTRON_UPDATER_ALLOW_UNVERIFIED = "true";
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

const { app, BrowserWindow } = require("electron");
const path = require("path");
const { registerHandler, cleanup } = require("./main-handle");
const UpdaterService = require("./main-handle/services/UpdaterService");
const ConfigService = require("./main-handle/services/ConfigService");
const { getIconPath, logger } = require("./utils");

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
  // 初始化配置目录和文件
  try {
    await ConfigService.initialize();
  } catch (error) {
    logger.error("配置初始化失败:", error);
  }

  createWindow();

  // 初始化更新服务
  UpdaterService.initialize();

  // 检查更新
  UpdaterService.checkForUpdatesAndNotify();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    await cleanup();
    app.quit();
  }
});

app.on("before-quit", () => {});
