const { app } = require("electron");
const winston = require("winston");
const path = require("path");
const fs = require("fs");
// 获取应用数据目录
const getLogDir = () => {
  const userDataPath = app.getPath("userData");
  const logDir = path.join(userDataPath, "logs");

  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return logDir;
};

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(getLogDir(), "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(getLogDir(), "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 在开发环境下同时输出到控制台
if (process.env.NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}

module.exports = {
  info: logger.info,
  warn: logger.warn,
  error: logger.error,
  debug: logger.info,
  getLogDir,
  logger,
};
