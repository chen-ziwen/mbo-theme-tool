# MBO Theme Tool - 现代化后端架构

这是一个基于现代化设计模式的 Electron 主进程后端架构，提供了强大的 IPC 通信、控制器管理、依赖注入、事件总线等功能。

## 架构概览

### 核心组件

1. **IPCManager** (`core/IPCManager.js`)
   - 统一管理所有IPC通信
   - 提供中间件支持
   - 自动错误处理和日志记录
   - 性能监控

2. **BaseController** (`core/BaseController.js`)
   - 所有控制器的基类
   - 提供路由注册机制
   - 统一的错误处理
   - 参数验证
   - 生命周期钩子

3. **ControllerManager** (`core/ControllerManager.js`)
   - 自动发现和加载控制器
   - 管理控制器生命周期
   - 统一注册路由

### 控制器

- **DialogController** - 处理对话框相关操作
- **FileController** - 处理文件操作和主题资源管理
- **ConfigController** - 处理配置管理
- **UpdaterController** - 处理应用更新

## 使用方法

### 创建新控制器

```javascript
const BaseController = require('../core/BaseController');

class MyController extends BaseController {
  constructor() {
    super('MyController');
    
    // 注册路由
    this.addRoute('my-channel', 'myMethod', {
      logSuccess: true,
      monitor: true
    });
  }

  async myMethod(event, param1, param2) {
    // 参数验证
    this.validateParams({ param1, param2 }, {
      param1: { required: true, type: 'string' },
      param2: { required: false, type: 'number' }
    });

    try {
      // 业务逻辑
      return { success: true, data: 'result' };
    } catch (error) {
      this.handleError(error, 'myMethod');
    }
  }

  async onInit() {
    // 控制器初始化逻辑
  }

  async onDestroy() {
    // 控制器清理逻辑
  }
}

module.exports = MyController;
```

### 渲染器端使用

```javascript
// 新的模块化API
const result = await window.electronAPI.dialog.openFolder();
const configs = await window.electronAPI.config.load();

// 或使用兼容性API
const result = await window.electronAPI.openFolder();
```

## 架构优势

### 1. 更好的代码组织
- 按功能模块分离控制器
- 清晰的文件结构
- 统一的编码规范

### 2. 增强的错误处理
- 统一的错误处理机制
- 详细的错误日志
- 优雅的错误恢复

### 3. 性能监控
- 自动监控IPC调用性能
- 识别慢查询
- 性能统计

### 4. 类型安全
- 参数验证
- 运行时类型检查
- 更好的开发体验

### 5. 可扩展性
- 中间件系统
- 插件化架构
- 易于添加新功能

### 6. 调试友好
- 详细的日志记录
- 调试API
- 开发工具支持

## 中间件系统

可以添加自定义中间件来扩展功能：

```javascript
const ipcManager = require('./core/IPCManager');

// 添加认证中间件
ipcManager.use(async (event, channel, args, options) => {
  if (options.requireAuth) {
    // 检查认证状态
    if (!isAuthenticated(event)) {
      throw new Error('未授权访问');
    }
  }
});

// 添加缓存中间件
ipcManager.use(async (event, channel, args, options) => {
  if (options.cache) {
    const cacheKey = `${channel}:${JSON.stringify(args)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
});
```

## 迁移指南

### 从旧架构迁移

1. **保持兼容性**：新架构保持了向后兼容，现有代码无需修改
2. **逐步迁移**：可以逐个模块迁移到新的API
3. **测试验证**：确保所有功能正常工作

### 推荐的迁移步骤

1. 更新主进程注册代码
2. 测试现有功能
3. 逐步使用新的模块化API
4. 添加错误处理和参数验证
5. 利用新的调试和监控功能

## 配置选项

### IPC处理器选项

```javascript
this.addRoute('channel-name', 'methodName', {
  logSuccess: true,     // 是否记录成功日志
  logArgs: false,       // 是否记录参数（敏感数据设为false）
  monitor: true,        // 是否启用性能监控
  throwError: true,     // 是否抛出错误
  requireAuth: false,   // 是否需要认证（需要认证中间件）
  cache: false,         // 是否启用缓存（需要缓存中间件）
  timeout: 30000        // 超时时间（毫秒）
});
```

## 最佳实践

1. **错误处理**：始终使用try-catch包装业务逻辑
2. **参数验证**：对所有输入参数进行验证
3. **日志记录**：合理使用日志级别
4. **性能优化**：避免在IPC处理器中执行耗时操作
5. **安全性**：验证用户输入，防止路径遍历等安全问题

## 故障排除

### 常见问题

1. **控制器未注册**：检查控制器是否正确继承BaseController
2. **IPC调用失败**：查看控制台错误日志
3. **性能问题**：使用性能监控功能识别瓶颈

### 调试工具

```javascript
// 获取已注册的控制器
console.log(controllerManager.getControllerNames());

// 获取已注册的IPC通道
console.log(ipcManager.getChannels());

// 获取渲染器端使用的通道
console.log(window.electronAPI.debug.getUsedChannels());
```