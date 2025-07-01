/**
 * 统一导出所有渲染进程模块
 * 自动扫描当前目录下的所有 js 文件（除了 index.js 自身）并导出
 */
const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "modules");

const modules = {};

// 读取当前目录下的所有文件
fs.readdirSync(modulePath).forEach((file) => {
  // 提取模块名（去掉.js扩展名）
  const moduleName = path.basename(file, ".js");
  // 导入模块
  const moduleContent = require(path.resolve(modulePath, moduleName));
  // 添加到导出对象
  modules[moduleName.toLocaleLowerCase()] = moduleContent.toExport();
});

module.exports = modules;
