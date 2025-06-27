const BaseController = require("../core/BaseController");
const fs = require("fs").promises;
const path = require("path");
const { logger } = require("../../utils");
const ConfigService = require("../services/ConfigService");

/**
 * 配置控制器
 * 处理应用配置的加载、保存、备份和重置
 */
class ConfigController extends BaseController {
  constructor() {
    super("Config");
    
    // 使用 ConfigService 处理业务逻辑
    this.configService = new ConfigService();
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
   * 读取文件路径配置
   */
  async readPathConfig() {
    try {
      await this.configService.ensureUserConfigDir();
      const content = await fs.readFile(this.configService.THEME_CHECK_PATH, "utf-8");
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
      await this.configService.ensureUserConfigDir();
      const content = await fs.readFile(this.configService.EXTRA_FOLDER_PATH, "utf-8");
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
      await this.configService.ensureUserConfigDir();
      const config = { necessary, optional };
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(this.configService.THEME_CHECK_PATH, content, "utf-8");
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
      await this.configService.ensureUserConfigDir();
      const content = JSON.stringify(extraFolders, null, 2);
      await fs.writeFile(this.configService.EXTRA_FOLDER_PATH, content, "utf-8");
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
    // 参数验证
    this.validateParams(
      { necessary, optional, extraFolders },
      {
        necessary: { required: true, type: "object" },
        optional: { required: true, type: "object" },
        extraFolders: { required: true, type: "object" },
      }
    );

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
      const backupDir = path.join(this.configService.USER_CONFIG_DIR, "backup", timestamp);

      // 创建备份目录
      await fs.mkdir(backupDir, { recursive: true });

      // 备份文件
      await fs.copyFile(this.configService.THEME_CHECK_PATH, path.join(backupDir, "theme-check.json"));
      await fs.copyFile(this.configService.EXTRA_FOLDER_PATH, path.join(backupDir, "extra-folder.json"));

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
      await this.configService.copyDefaultConfigs();
      return { success: true, message: "配置已重置为默认值" };
    } catch (error) {
      this.handleError(error, "resetConfigs");
    }
  }

  /**
   * 初始化配置（应用启动时调用）
   */
  async initializeConfigs() {
    return await this.configService.initializeConfigs();
  }

  /**
   * 控制器初始化
   */
  async onInit() {
    // 在应用启动时自动初始化配置
    await this.initializeConfigs();
  }
}

module.exports = ConfigController;
