const fs = require("fs").promises;
const path = require("path");
const { getUserConfigDir, getDefaultConfigDir, logger } = require("../../utils");

/**
 * 配置服务
 * 提供与IPC无关的配置相关业务逻辑
 */
class ConfigService {
  constructor() {
    // 配置文件路径
    this.USER_CONFIG_DIR = getUserConfigDir();
    this.DEFAULT_CONFIG_DIR = getDefaultConfigDir();
    this.THEME_CHECK_PATH = path.join(this.USER_CONFIG_DIR, "theme-check.json");
    this.EXTRA_FOLDER_PATH = path.join(this.USER_CONFIG_DIR, "extra-folder.json");
    this.DEFAULT_THEME_CHECK_PATH = path.join(this.DEFAULT_CONFIG_DIR, "theme-check.json");
    this.DEFAULT_EXTRA_FOLDER_PATH = path.join(this.DEFAULT_CONFIG_DIR, "extra-folder.json");
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
        const themeCheckContent = await fs.readFile(this.DEFAULT_THEME_CHECK_PATH, "utf8");
        await fs.writeFile(this.THEME_CHECK_PATH, themeCheckContent);
        // 默认主题检查配置已复制
      } catch (error) {
        logger.warn("默认主题检查配置文件不存在，跳过复制");
      }

      // 复制额外文件夹配置
      try {
        await fs.access(this.DEFAULT_EXTRA_FOLDER_PATH);
        const extraFolderContent = await fs.readFile(this.DEFAULT_EXTRA_FOLDER_PATH, "utf8");
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
   * 初始化配置（应用启动时调用）
   */
  async initializeConfigs() {
    try {
      // 开始初始化配置目录和文件
      await this.ensureUserConfigDir();
      // 配置目录初始化完成
    } catch (error) {
      logger.error("配置初始化失败:", error);
      throw error;
    }
  }

  /**
   * 静态方法：快速初始化配置
   */
  static async initialize() {
    const configService = new ConfigService();
    await configService.initializeConfigs();
    return configService;
  }
}

module.exports = ConfigService;
