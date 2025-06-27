const { app } = require("electron");
const path = require("path");

/**
 * 获取用户配置目录路径（可读写）
 * 开发环境：%APPDATA%/应用名/dev_config
 * 生产环境：%APPDATA%/应用名/config
 * 用途：存储用户个性化配置，支持修改和持久化
 */
const getUserConfigDir = () => {
  if (app.isPackaged) {
    return path.join(app.getPath("userData"), "config");
  } else {
    return path.join(app.getPath("userData"), "dev_config");
  }
};

/**
 * 获取默认配置目录路径（只读）
 * 开发环境：项目根目录/electron/config
 * 生产环境：resources/config
 * 用途：存储应用默认配置，用于配置还原和版本更新
 */
const getDefaultConfigDir = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "config");
  } else {
    return path.join(__dirname, "..", "config");
  }
};

module.exports = {
  getUserConfigDir,
  getDefaultConfigDir,
};
