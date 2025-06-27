const BaseController = require("../core/BaseController");
const fs = require("fs").promises;
const path = require("path");
const { getUserConfigDir, logger } = require("../../utils");

/**
 * 文件控制器
 * 处理文件操作和主题资源管理
 */
class FileController extends BaseController {
  constructor() {
    super("File");
  }

  /**
   * 定义路由配置
   */
  defineRoutes() {
    return [
      { channel: "checkFolderName", handler: "checkFolderName" },
      { channel: "copyFileResource", handler: "copyFileResource" },
      { channel: "file:exists", handler: "checkFileExists" },
      { channel: "file:getConfigs", handler: "getConfigs" },
    ];
  }

  /**
   * 动态获取配置
   */
  async getConfigs() {
    try {
      const configDir = getUserConfigDir();
      const themeCheckPath = path.join(configDir, "theme-check.json");
      const extraFolderPath = path.join(configDir, "extra-folder.json");

      const themeContent = await fs.readFile(themeCheckPath, "utf-8");
      const extraContent = await fs.readFile(extraFolderPath, "utf-8");

      const { necessary, optional } = JSON.parse(themeContent);
      const extraFolder = JSON.parse(extraContent);

      return { necessary, optional, extraFolder };
    } catch (error) {
      logger.error("读取配置文件失败:", {
        message: error.message,
        code: error.code,
        path: error.path,
      });
      return { necessary: {}, optional: {}, extraFolder: [] };
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} src 文件路径
   * @param {boolean} throwOnError 是否在错误时抛出异常
   */
  async checkFileExists(src, throwOnError = true) {
    try {
      const fsConstants = require("fs").constants;
      await fs.access(src, fsConstants.F_OK);
      return true;
    } catch (err) {
      if (throwOnError) {
        if (err.code === "ENOENT") {
          return false;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  }

  /**
   * 检查主题文件
   * @param {string} basePath 基础路径
   * @param {Object} themeObj 主题对象
   * @param {Function} callback 回调函数
   */
  async checkThemeFiles(basePath, themeObj, callback) {
    for (const theme of Object.keys(themeObj)) {
      const realPath = path.join(basePath, "切图", theme);
      const exists = await this.checkFileExists(realPath);
      const status = exists ? "suc" : "err";
      callback(realPath, exists, status);
    }
  }

  /**
   * 创建初始状态对象
   */
  createListInfos() {
    return { suc: [], err: [], disabled: true };
  }

  /**
   * 检查文件夹名称和资源
   * @param {Object} event IPC事件对象
   * @param {string} folderPath 文件夹路径
   */
  async checkFolderName(event, folderPath) {
    // 参数验证
    this.validateParams(
      { folderPath },
      {
        folderPath: { required: true, type: "string" },
      }
    );

    const listInfos = this.createListInfos();

    try {
      const { necessary, optional } = await this.getConfigs();

      // 检查路径是否存在
      await this.checkFileExists(folderPath, false);

      // 检查必需资源
      await this.checkThemeFiles(folderPath, necessary, (realPath, exists, status) => {
        const text = exists
          ? "(必须资源) 当前路径下资源存在，检测成功！"
          : "(必须资源) 当前路径下，资源不存在。请仔细检查该路径下的资源是否存在或命名是否规范!";
        listInfos[status].push({ path: realPath, text });
      });

      // 如果必需资源都存在，启用操作
      if (listInfos.err.length === 0) {
        listInfos.disabled = false;
      }

      // 检查可选资源
      await this.checkThemeFiles(folderPath, optional, (realPath, exists, status) => {
        const text = exists
          ? "(非必须资源) 当前路径下资源存在，检测成功！"
          : "(非必须资源) 当前路径下，资源不存在。请仔细检查该路径下的资源是否存在或命名是否规范!";
        listInfos[status].push({ path: realPath, text });
      });

      return listInfos;
    } catch (error) {
      this.handleError(error, "checkFolderName");
    }
  }

  /**
   * 复制文件资源
   * @param {Object} event IPC事件对象
   * @param {Object} params 参数对象
   */
  async copyFileResource(event, { theme, src, destPath }) {
    // 参数验证
    this.validateParams(
      { theme, src, destPath },
      {
        theme: { required: true, type: "string" },
        src: { required: true, type: "string" },
        destPath: { required: true, type: "string" },
      }
    );

    const listInfos = this.createListInfos();

    try {
      const { necessary, optional, extraFolder } = await this.getConfigs();

      // 创建额外文件夹
      for (const folder of extraFolder) {
        const realPath = path.join(src, folder.replaceAll("${theme}", theme));
        await fs.mkdir(realPath, { recursive: true });
      }

      // 复制文件
      const allResources = { ...necessary, ...optional };
      for (const [key, value] of Object.entries(allResources)) {
        const resourcePath = path.join(destPath, "切图", key);
        const destFilePath = path.join(src, value).replaceAll("${theme}", theme);

        const exists = await this.checkFileExists(resourcePath);

        if (exists) {
          // 确保目标目录存在
          const destDir = path.dirname(destFilePath);
          await fs.mkdir(destDir, { recursive: true });

          await fs.copyFile(resourcePath, destFilePath);
          listInfos.suc.push({
            path: resourcePath,
            text: `资源图片已成功复制到开发项目的 "${destFilePath}" 路径下！`,
          });
        } else {
          listInfos.err.push({
            path: resourcePath,
            text: "当前路径下的资源不存在，复制失败！",
          });
        }
      }

      return listInfos;
    } catch (error) {
      this.handleError(error, "copyFileResource");
    }
  }

  /**
   * 控制器初始化
   */
  async onInit() {
    // 可以在这里进行文件系统相关的初始化
  }
}

module.exports = FileController;
