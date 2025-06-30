const BaseRenderer = require("../core/base");

class FileRenderer extends BaseRenderer {
  /**
   * 检查文件夹名称和资源
   * @param {string} folderPath 文件夹路径
   */
  checkFolderName(folderPath) {
    if (!folderPath || typeof folderPath !== "string") {
      throw new Error("文件夹路径不能为空且必须是字符串");
    }
    return this.invoke("checkFolderName", folderPath);
  }

  /**
   * 复制资源文件
   * @param {Object} params 复制参数
   * @param {string} params.theme 主题名称
   * @param {string} params.src 源路径
   * @param {string} params.destPath 目标路径
   */
  copyFileResource({ theme, src, destPath }) {
    // 参数验证
    if (!theme || !src || !destPath) {
      throw new Error("theme, src, destPath 参数都是必需的");
    }

    return this.invoke("copyFileResource", { theme, src, destPath });
  }

  toExport() {
    return {
      checkFolderName: this.checkFolderName.bind(this),
      copyFileResource: this.copyFileResource.bind(this),
    };
  }
}

module.exports = new FileRenderer();
