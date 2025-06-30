const BaseRenderer = require("../core/base");

class ConfigRenderer extends BaseRenderer {
  /**
   * 保存配置
   * @param {Object} configs 配置对象
   * @param {Object} configs.necessary 必需配置
   * @param {Object} configs.optional 可选配置
   * @param {Array} configs.extraFolders 额外文件夹配置
   */
  save(configs) {
    if (!configs || typeof configs !== "object") {
      throw new Error("配置对象不能为空");
    }

    const { necessary, optional, extraFolders } = configs;
    if (!necessary || !optional || !extraFolders) {
      throw new Error("必需配置、可选配置和额外文件夹配置都是必需的");
    }

    return this.invoke("config:save", configs);
  }

  /**
   * 加载所有配置
   */
  load() {
    return this.invoke("config:load");
  }

  /**
   * 备份配置
   */
  backup() {
    return this.invoke("config:backup");
  }

  /**
   * 重置配置
   */
  reset() {
    return this.invoke("config:reset");
  }

  toExport() {
    return {
      save: this.save.bind(this),
      load: this.load.bind(this),
      backup: this.backup.bind(this),
      reset: this.reset.bind(this),
    }
  }

}

module.exports = new ConfigRenderer();
