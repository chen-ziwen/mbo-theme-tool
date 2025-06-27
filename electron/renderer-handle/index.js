const { ipcRenderer } = require("electron");

const renderer = {
  // 打开文件夹
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  // 打开文件
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  // 根据文件夹路径 检查图片命名是否正确
  checkFolderName: (url) => ipcRenderer.invoke("checkFolderName", url),
  // 复制资源路径图片到项目路径图片
  copyFileResource: ({ theme, src, destPath }) =>
    ipcRenderer.invoke("copyFileResource", { theme, src, destPath }),

  // 配置管理相关
  loadConfigs: () => ipcRenderer.invoke("loadConfigs"),
  saveConfigs: (configs) => ipcRenderer.invoke("saveConfigs", configs),
  backupConfigs: () => ipcRenderer.invoke("backupConfigs"),
  resetConfigs: () => ipcRenderer.invoke("resetConfigs"),

  // 应用更新相关
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
};

module.exports = renderer;
