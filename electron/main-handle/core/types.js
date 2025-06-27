/**
 * 架构类型定义和接口
 * 提供统一的类型约束和文档
 */

/**
 * 路由配置接口
 * @typedef {Object} RouteConfig
 * @property {string} channel - IPC通道名
 * @property {string|Function} handler - 处理函数或方法名
 * @property {Object} [options] - 路由选项
 * @property {boolean} [options.logSuccess=true] - 是否记录成功日志
 * @property {boolean} [options.logArgs=false] - 是否记录参数
 * @property {boolean} [options.monitor=true] - 是否启用性能监控
 * @property {boolean} [options.throwError=true] - 是否抛出错误
 * @property {number} [options.timeout] - 超时时间(毫秒)
 * @property {Array<Function>} [options.middlewares] - 路由级中间件
 */

/**
 * 中间件函数接口
 * @typedef {Function} Middleware
 * @param {Object} event - IPC事件对象
 * @param {string} channel - 通道名
 * @param {Array} args - 参数数组
 * @param {Object} options - 选项
 * @returns {Promise<void>}
 */

/**
 * 控制器接口
 * @typedef {Object} IController
 * @property {string} name - 控制器名称
 * @property {Map} routes - 路由映射
 * @property {Array<Function>} middlewares - 中间件数组
 * @property {boolean} initialized - 是否已初始化
 * @property {Function} defineRoutes - 定义路由配置
 * @property {Function} addRoute - 添加路由
 * @property {Function} use - 添加中间件
 * @property {Function} initialize - 初始化控制器
 * @property {Function} register - 注册路由
 * @property {Function} onInit - 初始化钩子
 * @property {Function} onDestroy - 销毁钩子
 * @property {Function} handleError - 错误处理
 * @property {Function} validateParams - 参数验证
 */

/**
 * IPC管理器接口
 * @typedef {Object} IIPCManager
 * @property {Map} handlers - 处理器映射
 * @property {Array<Function>} middlewares - 全局中间件
 * @property {Function} use - 添加中间件
 * @property {Function} handle - 注册处理器
 * @property {Function} on - 注册监听器
 * @property {Function} removeHandler - 移除处理器
 * @property {Function} getChannels - 获取通道列表
 * @property {Function} clear - 清理所有处理器
 */

/**
 * 控制器管理器接口
 * @typedef {Object} IControllerManager
 * @property {Map} controllers - 控制器映射
 * @property {boolean} initialized - 是否已初始化
 * @property {Function} discoverControllers - 发现控制器
 * @property {Function} loadController - 加载控制器
 * @property {Function} registerController - 注册控制器
 * @property {Function} initializeControllers - 初始化所有控制器
 * @property {Function} registerAllRoutes - 注册所有路由
 * @property {Function} getController - 获取控制器
 * @property {Function} getControllerNames - 获取控制器名称列表
 * @property {Function} destroyControllers - 销毁所有控制器
 * @property {Function} start - 启动管理器
 * @property {Function} stop - 停止管理器
 */

/**
 * 参数验证模式
 * @typedef {Object} ValidationSchema
 * @property {boolean} [required] - 是否必需
 * @property {string} [type] - 参数类型
 * @property {Function} [validator] - 自定义验证函数
 * @property {*} [default] - 默认值
 * @property {string} [message] - 错误消息
 */

/**
 * 错误信息接口
 * @typedef {Object} ErrorInfo
 * @property {string} message - 错误消息
 * @property {string} [stack] - 错误堆栈
 * @property {string} [code] - 错误代码
 * @property {Object} [context] - 错误上下文
 */

/**
 * 性能监控信息
 * @typedef {Object} PerformanceInfo
 * @property {string} channel - 通道名
 * @property {number} startTime - 开始时间
 * @property {number} endTime - 结束时间
 * @property {number} duration - 持续时间
 * @property {boolean} success - 是否成功
 * @property {ErrorInfo} [error] - 错误信息
 */

/**
 * 日志级别枚举
 * @readonly
 * @enum {string}
 */
const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * 控制器状态枚举
 * @readonly
 * @enum {string}
 */
const ControllerState = {
  UNINITIALIZED: "uninitialized",
  INITIALIZING: "initializing",
  INITIALIZED: "initialized",
  REGISTERING: "registering",
  REGISTERED: "registered",
  DESTROYING: "destroying",
  DESTROYED: "destroyed",
};

/**
 * 事件类型枚举
 * @readonly
 * @enum {string}
 */
const EventType = {
  CONTROLLER_INIT: "controller:init",
  CONTROLLER_REGISTER: "controller:register",
  CONTROLLER_DESTROY: "controller:destroy",
  ROUTE_REGISTER: "route:register",
  ROUTE_CALL: "route:call",
  MIDDLEWARE_ADD: "middleware:add",
  ERROR_OCCURRED: "error:occurred",
};

module.exports = {
  LogLevel,
  ControllerState,
  EventType,
};
