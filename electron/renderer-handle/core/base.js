/**
 * 渲染进程 api 基类
 * 为各个模块提供统一的api接口和导出方法
 */
const RendererAPI = require("../core/renderer");

class BaseRenderer {
  constructor() {
    this.api = new RendererAPI();
  }

  /**
   * 调用IPC方法
   * @param {string} channel 通道名
   * @param {...any} args 参数
   */
  invoke(channel, ...args) {
    return this.api.invoke(channel, ...args);
  }

  /**
   * 将类实例转换为简单对象导出
   * @returns {Object} 包含所有公共方法的对象
   */
  toExport() { }
}

module.exports = BaseRenderer;
