const { app, BrowserWindow } = require("electron");
const path = require("path");
const { registerHandler, cleanup } = require("./main-handle");
const { getIconPath } = require("./utils");

// 禁用签名验证
process.env.ELECTRON_UPDATER_ALLOW_UNVERIFIED = "true";
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: getIconPath(),
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: isDev,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  if (isDev) {
    const url = "http://localhost:5210/";
    win.loadURL(url);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 注册主进程事件处理函数并初始化
  registerHandler();
};

app.whenReady().then(async () => {
  createWindow();

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
