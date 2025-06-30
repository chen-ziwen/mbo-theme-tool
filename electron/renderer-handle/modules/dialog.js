const BaseRenderer = require("../core/base");

class DialogRenderer extends BaseRenderer {
  /**
   * 打开文件夹选择对话框
   * @param {Object} options 对话框选项
   */
  openFolder(options = {}) {
    return this.invoke("dialog:openFolder", options);
  }

  /**
   * 打开文件选择对话框
   * @param {Object} options 对话框选项
   */
  openFile(options = {}) {
    return this.invoke("dialog:openFile", options);
  }

  toExport() {
    return {
      openFolder: this.openFolder.bind(this),
      openFile: this.openFile.bind(this),
    };
  }
}

module.exports = new DialogRenderer();
