const { ipcRenderer } = require("electron");

/**
 * 现代化的渲染器API类
 * 提供类型安全和更好的错误处理
 */
class RendererAPI {
  constructor() {
    this.channels = new Set();
  }

  /**
   * 安全的IPC调用包装器
   * @param {string} channel 通道名
   * @param {...any} args 参数
   */
  async invoke(channel, ...args) {
    try {
      this.channels.add(channel);
      return await ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      console.error(`IPC调用失败 [${channel}]:`, error);
      throw new Error(`${channel} 调用失败: ${error.message}`);
    }
  }

  /**
   * 获取已使用的通道列表
   */
  getUsedChannels() {
    return Array.from(this.channels);
  }
}

// 创建API实例
const api = new RendererAPI();

/**
 * 对话框相关API
 */
const dialog = {
  /**
   * 打开文件夹选择对话框
   * @param {Object} options 对话框选项
   */
  openFolder: (options = {}) => api.invoke("dialog:openFolder", options),

  /**
   * 打开文件选择对话框
   * @param {Object} options 对话框选项
   */
  openFile: (options = {}) => api.invoke("dialog:openFile", options),
};

/**
 * 文件操作相关API
 */
const file = {
  /**
   * 检查文件夹名称和资源
   * @param {string} folderPath 文件夹路径
   */
  checkFolderName: (folderPath) => {
    if (!folderPath || typeof folderPath !== "string") {
      throw new Error("文件夹路径不能为空且必须是字符串");
    }
    return api.invoke("checkFolderName", folderPath);
  },

  /**
   * 复制资源文件
   * @param {Object} params 复制参数
   * @param {string} params.theme 主题名称
   * @param {string} params.src 源路径
   * @param {string} params.destPath 目标路径
   */
  copyFileResource: ({ theme, src, destPath }) => {
    // 参数验证
    if (!theme || !src || !destPath) {
      throw new Error("theme, src, destPath 参数都是必需的");
    }

    return api.invoke("copyFileResource", { theme, src, destPath });
  },
};

/**
 * 配置管理相关API
 */
const config = {
  /**
   * 加载所有配置
   */
  load: () => api.invoke("config:load"),

  /**
   * 保存配置
   * @param {Object} configs 配置对象
   * @param {Object} configs.necessary 必需配置
   * @param {Object} configs.optional 可选配置
   * @param {Array} configs.extraFolders 额外文件夹配置
   */
  save: (configs) => {
    if (!configs || typeof configs !== "object") {
      throw new Error("配置对象不能为空");
    }

    const { necessary, optional, extraFolders } = configs;
    if (!necessary || !optional || !extraFolders) {
      throw new Error("必需配置、可选配置和额外文件夹配置都是必需的");
    }

    return api.invoke("config:save", configs);
  },

  /**
   * 备份配置
   */
  backup: () => api.invoke("config:backup"),

  /**
   * 重置配置
   */
  reset: () => api.invoke("config:reset"),
};

/**
 * 应用更新相关API
 */
const updater = {
  /**
   * 检查更新
   */
  checkForUpdates: () => api.invoke("check-for-updates"),

  /**
   * 下载更新
   */
  downloadUpdate: () => api.invoke("download-update"),

  /**
   * 退出并安装更新
   */
  quitAndInstall: () => api.invoke("quit-and-install"),

  /**
   * 获取应用版本
   */
  getAppVersion: () => api.invoke("get-app-version"),
};

/**
 * 统一的渲染器API对象
 * 提供模块化的API接口
 */
const renderer = {
  // 对话框API
  dialog,

  // 文件操作API
  file,

  // 配置管理API
  config,

  // 更新API
  updater,

  // 兼容性API（保持向后兼容）
  openFolder: dialog.openFolder,
  openFile: dialog.openFile,
  checkFolderName: file.checkFolderName,
  copyFileResource: file.copyFileResource,
  loadConfigs: config.load,
  saveConfigs: config.save,
  backupConfigs: config.backup,
  resetConfigs: config.reset,
  checkForUpdates: updater.checkForUpdates,
  downloadUpdate: updater.downloadUpdate,
  quitAndInstall: updater.quitAndInstall,
  getAppVersion: updater.getAppVersion,

  // 调试和监控API
  debug: {
    getUsedChannels: () => api.getUsedChannels(),
    getAPI: () => api,
  },
};

module.exports = renderer;
