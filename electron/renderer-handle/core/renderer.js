/**
 * 现代化的渲染器API类
 * 提供类型安全和更好的错误处理
 */
const { ipcRenderer } = require("electron");

class RendererAPI {
  constructor() {
    this.channels = new Set();
  }

  /**
   * 获取已使用的通道列表
   */
  get getUsedChannels() {
    return Array.from(this.channels);
  }

  /**
   * 获取API实例
   */
  get getApi() {
    return this;
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

  // 下面可以补充其他的 IPC 方法
}

module.exports = RendererAPI;
