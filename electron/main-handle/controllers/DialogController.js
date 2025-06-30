const { dialog } = require("electron");
const BaseController = require("../core/BaseController");

class DialogController extends BaseController {
  constructor() {
    super("Dialog");
  }

  /**
   * 定义路由配置
   */
  defineRoutes() {
    return [
      { channel: "dialog:openFile", handler: "openFile" },
      { channel: "dialog:openFolder", handler: "openFolder" },
    ];
  }

  /**
   * 打开文件选择对话框
   * @param {Object} event IPC事件对象
   * @param {Object} options 对话框选项
   */
  async openFile(event, options = {}) {
    try {
      const defaultOptions = {
        properties: ["openFile"],
        filters: options.filters || [],
      };

      const { canceled, filePaths } = await dialog.showOpenDialog({
        ...defaultOptions,
        ...options,
      });

      if (canceled) {
        return {
          status: false,
          message: "cancel",
          path: "",
        };
      }

      return {
        status: true,
        message: "success",
        path: filePaths[0],
      };
    } catch (error) {
      this.handleError(error, "openFile");
    }
  }

  /**
   * 打开文件夹选择对话框
   * @param {Object} event IPC事件对象
   * @param {Object} options 对话框选项
   */
  async openFolder(event, options = {}) {
    try {
      const defaultOptions = {
        properties: ["openDirectory"],
      };

      const { canceled, filePaths } = await dialog.showOpenDialog({
        ...defaultOptions,
        ...options,
      });

      if (canceled) {
        return {
          status: false,
          message: "cancel",
          path: "",
        };
      }

      return {
        status: true,
        message: "success",
        path: filePaths[0],
      };
    } catch (error) {
      this.handleError(error, "openFolder");
    }
  }

  /**
   * 控制器初始化
   */
  async onInit() {
    // 可以在这里进行一些初始化工作
    // 比如设置默认的对话框选项等
  }
}

module.exports = DialogController;
