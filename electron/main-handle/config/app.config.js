const path = require("path");
const { performance } = require("perf_hooks");

/**
 * 应用配置文件
 * 定义应用的各种配置选项
 */
module.exports = {
  // 控制器配置
  controllers: {
    path: path.join(__dirname, "../controllers"),
    hotReload: process.env.NODE_ENV === "development",
    autoLoad: true,
  },

  // 中间件配置
  middleware: [
    // // 请求日志中间件
    // {
    //   name: "requestLogger",
    //   handler: async (context, next) => {
    //     const start = performance.now();
    //     const { channel } = context;

    //     console.log(`[${new Date().toISOString()}] IPC调用: ${channel}`);

    //     try {
    //       const result = await next();
    //       const duration = performance.now() - start;
    //       console.log(
    //         `[${new Date().toISOString()}] IPC完成: ${channel} (${duration.toFixed(2)}ms)`
    //       );
    //       return result;
    //     } catch (error) {
    //       const duration = performance.now() - start;
    //       console.error(
    //         `[${new Date().toISOString()}] IPC错误: ${channel} (${duration.toFixed(2)}ms)`,
    //         error.message
    //       );
    //       throw error;
    //     }
    //   },
    // },

    // 参数验证中间件
    {
      name: "validation",
      handler: async (context, next) => {
        const { channel, args, route } = context;

        // 检查是否有验证规则
        if (route && route.validation) {
          const { validation } = route;

          // 验证参数数量
          if (validation.minArgs && args.length < validation.minArgs) {
            throw new Error(`${channel} 需要至少 ${validation.minArgs} 个参数`);
          }

          if (validation.maxArgs && args.length > validation.maxArgs) {
            throw new Error(`${channel} 最多接受 ${validation.maxArgs} 个参数`);
          }

          // 验证参数类型
          if (validation.types) {
            args.forEach((arg, index) => {
              const expectedType = validation.types[index];
              if (expectedType && typeof arg !== expectedType) {
                throw new Error(`${channel} 第${index + 1}个参数应为 ${expectedType} 类型`);
              }
            });
          }
        }

        return await next();
      },
    },

    // 错误处理中间件
    {
      name: "errorHandler",
      handler: async (context, next) => {
        try {
          return await next();
        } catch (error) {
          // 记录错误
          console.error(`IPC错误 [${context.channel}]:`, error);

          // 返回标准化的错误响应
          throw {
            success: false,
            error: error.message,
            code: error.code || "UNKNOWN_ERROR",
            timestamp: new Date().toISOString(),
          };
        }
      },
    },

    // 缓存中间件（示例）
    {
      name: "cache",
      handler: async (context, next) => {
        const { channel, args, route } = context;

        // 只对标记为可缓存的路由启用缓存
        if (!route || !route.cacheable) {
          return await next();
        }

        const cacheKey = `${channel}:${JSON.stringify(args)}`;

        // 简单的内存缓存（生产环境应使用更好的缓存方案）
        if (!global._ipcCache) {
          global._ipcCache = new Map();
        }

        // 检查缓存
        if (global._ipcCache.has(cacheKey)) {
          const cached = global._ipcCache.get(cacheKey);
          if (Date.now() - cached.timestamp < (route.cacheTime || 60000)) {
            console.log(`缓存命中: ${channel}`);
            return cached.data;
          }
        }

        // 执行并缓存结果
        const result = await next();
        global._ipcCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      },
    },
  ],

  // 服务配置
  services: new Map([
    // 配置服务
    [
      "configService",
      () => {
        return {
          get: (key, defaultValue) => {
            // 实现配置获取逻辑
            return process.env[key] || defaultValue;
          },
          set: (key, value) => {
            // 实现配置设置逻辑
            process.env[key] = value;
          },
        };
      },
    ],

    // 文件服务
    [
      "fileService",
      () => {
        const fs = require("fs").promises;
        const path = require("path");

        return {
          async readFile(filePath) {
            return await fs.readFile(filePath, "utf8");
          },

          async writeFile(filePath, content) {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            return await fs.writeFile(filePath, content, "utf8");
          },

          async exists(filePath) {
            try {
              await fs.access(filePath);
              return true;
            } catch {
              return false;
            }
          },
        };
      },
    ],

    // HTTP客户端服务
    [
      "httpService",
      () => {
        const https = require("https");
        const http = require("http");

        return {
          async get(url) {
            return new Promise((resolve, reject) => {
              const client = url.startsWith("https:") ? https : http;

              client
                .get(url, (res) => {
                  let data = "";
                  res.on("data", (chunk) => (data += chunk));
                  res.on("end", () => {
                    try {
                      resolve(JSON.parse(data));
                    } catch {
                      resolve(data);
                    }
                  });
                })
                .on("error", reject);
            });
          },
        };
      },
    ],
  ]),

  // 事件配置
  events: {
    // 最大监听器数量
    maxListeners: 100,

    // 事件历史记录数量
    historySize: 1000,

    // 敏感事件（不记录参数）
    sensitiveEvents: ["user:login", "config:save", "file:write"],
  },

  // 性能配置
  performance: {
    // 慢调用阈值（毫秒）
    slowCallThreshold: 1000,

    // 性能数据保留数量
    performanceDataSize: 1000,

    // 统计重置间隔（毫秒）
    statsResetInterval: 24 * 60 * 60 * 1000, // 24小时
  },

  // 日志配置
  logging: {
    level: process.env.NODE_ENV === "development" ? "debug" : "info",

    // 日志文件路径
    file:
      process.env.NODE_ENV === "production" ? path.join(process.cwd(), "logs", "app.log") : null,

    // 最大日志文件大小
    maxFileSize: 10 * 1024 * 1024, // 10MB

    // 保留的日志文件数量
    maxFiles: 5,
  },

  // 开发配置
  development: {
    // 启用热重载
    hotReload: true,

    // 启用详细日志
    verbose: true,

    // 启用性能监控
    performanceMonitoring: true,

    // 启用调试模式
    debug: true,
  },

  // 生产配置
  production: {
    // 禁用热重载
    hotReload: false,

    // 启用错误报告
    errorReporting: true,

    // 启用性能监控
    performanceMonitoring: true,

    // 优化设置
    optimization: {
      // 启用缓存
      enableCache: true,

      // 压缩响应
      compressResponse: true,
    },
  },
};
