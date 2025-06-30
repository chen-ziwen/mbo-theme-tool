const BaseRenderer = require("../core/BaseRenderer");

class DialogRenderer extends BaseRenderer {
  /**
   * 打开文件选择对话框
   * @param {Object} options 对话框选项
   */
  openFile(options = {}) {
    return this.invoke("dialog:openFile", options);
  }

  /**
   * 打开文件夹选择对话框
   * @param {Object} options 对话框选项
   */
  openFolder(options = {}) {
    return this.invoke("dialog:openFolder", options);
  }

  toExport() {
    return {
      openFile: this.openFile.bind(this),
      openFolder: this.openFolder.bind(this),
    };
  }
}

module.exports = new DialogRenderer();
