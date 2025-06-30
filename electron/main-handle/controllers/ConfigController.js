const BaseController = require("../core/BaseController");
const fs = require("fs").promises;
const path = require("path");
const {
  logger,
  getUserConfigDir,
  getDefaultConfigDir,
} = require("../../utils");

class ConfigController extends BaseController {
  constructor() {
    super("Config");

    this.USER_CONFIG_DIR = getUserConfigDir();
    this.DEFAULT_CONFIG_DIR = getDefaultConfigDir();
    this.THEME_CHECK_PATH = path.join(this.USER_CONFIG_DIR, "theme-check.json");
    this.EXTRA_FOLDER_PATH = path.join(
      this.USER_CONFIG_DIR,
      "extra-folder.json"
    );
    this.DEFAULT_THEME_CHECK_PATH = path.join(
      this.DEFAULT_CONFIG_DIR,
      "theme-check.json"
    );
    this.DEFAULT_EXTRA_FOLDER_PATH = path.join(
      this.DEFAULT_CONFIG_DIR,
      "extra-folder.json"
    );
  }

  /**
   * 定义路由配置
   */
  defineRoutes() {
    return [
      { channel: "config:load", handler: "loadConfigs" },
      { channel: "config:save", handler: "saveConfigs" },
      { channel: "config:backup", handler: "backupConfigs" },
      { channel: "config:reset", handler: "resetConfigs" },
    ];
  }

  /**
   * 确保用户配置目录存在
   */
  async ensureUserConfigDir() {
    try {
      await fs.access(this.USER_CONFIG_DIR);
    } catch (error) {
      await fs.mkdir(this.USER_CONFIG_DIR, { recursive: true });
      await this.copyDefaultConfigs();
    }
  }

  /**
   * 复制默认配置文件
   */
  async copyDefaultConfigs() {
    try {
      // 复制主题检查配置
      try {
        await fs.access(this.DEFAULT_THEME_CHECK_PATH);
        const themeCheckContent = await fs.readFile(
          this.DEFAULT_THEME_CHECK_PATH,
          "utf8"
        );
        await fs.writeFile(this.THEME_CHECK_PATH, themeCheckContent);
        // 默认主题检查配置已复制
      } catch (error) {
        logger.warn("默认主题检查配置文件不存在，跳过复制");
      }

      // 复制额外文件夹配置
      try {
        await fs.access(this.DEFAULT_EXTRA_FOLDER_PATH);
        const extraFolderContent = await fs.readFile(
          this.DEFAULT_EXTRA_FOLDER_PATH,
          "utf8"
        );
        await fs.writeFile(this.EXTRA_FOLDER_PATH, extraFolderContent);
        // 默认额外文件夹配置已复制
      } catch (error) {
        logger.warn("默认额外文件夹配置文件不存在，跳过复制");
      }
    } catch (error) {
      logger.error("复制默认配置失败:", error);
      throw error;
    }
  }

  /**
   * 读取文件路径配置
   */
  async readPathConfig() {
    try {
      await this.ensureUserConfigDir();
      const content = await fs.readFile(this.THEME_CHECK_PATH, "utf-8");
      const { necessary, optional } = JSON.parse(content);
      return { necessary, optional };
    } catch (error) {
      logger.error("读取路径配置失败:", error);
      return { necessary: {}, optional: {} };
    }
  }

  /**
   * 读取额外文件夹配置
   */
  async readExtraFolderConfig() {
    try {
      await this.ensureUserConfigDir();
      const content = await fs.readFile(this.EXTRA_FOLDER_PATH, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      logger.error("读取额外文件夹配置失败:", error);
      return [];
    }
  }

  /**
   * 保存文件路径配置
   * @param {Object} necessary 必需配置
   * @param {Object} optional 可选配置
   */
  async savePathConfig(necessary, optional) {
    try {
      await this.ensureUserConfigDir();
      const config = { necessary, optional };
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(this.THEME_CHECK_PATH, content, "utf-8");
      return true;
    } catch (error) {
      this.handleError(error, "savePathConfig");
    }
  }

  /**
   * 保存额外文件夹配置
   * @param {Array} extraFolders 额外文件夹列表
   */
  async saveExtraFolderConfig(extraFolders) {
    try {
      await this.ensureUserConfigDir();
      const content = JSON.stringify(extraFolders, null, 2);
      await fs.writeFile(this.EXTRA_FOLDER_PATH, content, "utf-8");
      return true;
    } catch (error) {
      this.handleError(error, "saveExtraFolderConfig");
    }
  }

  /**
   * 加载所有配置
   * @param {Object} event IPC事件对象
   */
  async loadConfigs(event) {
    try {
      const { necessary, optional } = await this.readPathConfig();
      const extraFolders = await this.readExtraFolderConfig();

      return {
        necessary,
        optional,
        extraFolders,
      };
    } catch (error) {
      this.handleError(error, "loadConfigs");
    }
  }

  /**
   * 保存所有配置
   * @param {Object} event IPC事件对象
   * @param {Object} configs 配置对象
   */
  async saveConfigs(event, { necessary, optional, extraFolders }) {
    try {
      await this.savePathConfig(necessary, optional);
      await this.saveExtraFolderConfig(extraFolders);

      return { success: true };
    } catch (error) {
      this.handleError(error, "saveConfigs");
    }
  }

  /**
   * 备份配置文件
   * @param {Object} event IPC事件对象
   */
  async backupConfigs(event) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(this.USER_CONFIG_DIR, "backup", timestamp);

      // 创建备份目录
      await fs.mkdir(backupDir, { recursive: true });

      // 备份文件
      await fs.copyFile(
        this.THEME_CHECK_PATH,
        path.join(backupDir, "theme-check.json")
      );
      await fs.copyFile(
        this.EXTRA_FOLDER_PATH,
        path.join(backupDir, "extra-folder.json")
      );

      return { success: true, backupPath: backupDir };
    } catch (error) {
      this.handleError(error, "backupConfigs");
    }
  }

  /**
   * 重置配置到默认值
   * @param {Object} event IPC事件对象
   */
  async resetConfigs(event) {
    try {
      await this.backupConfigs(event);
      await this.copyDefaultConfigs();
      return { success: true, message: "配置已重置为默认值" };
    } catch (error) {
      this.handleError(error, "resetConfigs");
    }
  }

  /**
   * 初始化配置（应用启动时调用）
   */
  async initializeConfigs() {
    try {
      await this.ensureUserConfigDir();
    } catch (error) {
      logger.error("配置初始化失败:", error);
      throw error;
    }
  }

  /**
   * 控制器初始化
   */
  async onInit() {
    await this.initializeConfigs();
  }
}

module.exports = ConfigController;
