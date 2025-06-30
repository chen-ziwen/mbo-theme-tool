const BaseRenderer = require("../core/base");

class UpdaterRenderer extends BaseRenderer {
  /**
   * 检查更新
   */
  checkForUpdates() {
    return this.invoke("check-for-updates");
  }

  /**
   * 下载更新
   */
  downloadUpdate() {
    return this.invoke("download-update");
  }

  /**
   * 退出并安装更新
   */
  quitAndInstall() {
    return this.invoke("quit-and-install");
  }

  /**
   * 获取应用版本
   */
  getAppVersion() {
    return this.invoke("get-app-version");
  }

  toExport() {
    return {
      checkForUpdates: this.checkForUpdates.bind(this),
      downloadUpdate: this.downloadUpdate.bind(this),
      quitAndInstall: this.quitAndInstall.bind(this),
      getAppVersion: this.getAppVersion.bind(this),
    };
  }
}

module.exports = new UpdaterRenderer();
