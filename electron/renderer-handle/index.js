/**
 * 统一导出所有渲染进程模块
 * 自动扫描当前目录下的所有 modules 下的 js 文件并导出
 */
const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "modules");

const modules = {};

fs.readdirSync(modulePath).forEach((file) => {
  const moduleName = path.basename(file, ".js");
  const moduleContent = require(path.resolve(modulePath, moduleName));
  modules[moduleName.toLocaleLowerCase()] = moduleContent.toExport();
});

module.exports = modules;
