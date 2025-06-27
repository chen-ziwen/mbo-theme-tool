const path = require("path");

// 根据平台获取正确的图标路径
const getIconPath = () => {
  const platform = process.platform;
  const buildPath = path.join(__dirname, "..", "..", "build");

  switch (platform) {
    case "win32":
      return path.join(buildPath, "icons", "win", "icon.ico");
    case "darwin":
      return path.join(buildPath, "icons", "mac", "icon.icns");
    case "linux":
    default:
      return path.join(buildPath, "icons", "png", "512x512.png");
  }
};

module.exports = {
  getIconPath,
};
