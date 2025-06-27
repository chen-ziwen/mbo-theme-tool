const fs = require("fs").promises;
const path = require("path");
const { getUserConfigDir, logger } = require("../utils");

// 动态获取配置的函数
const getConfigs = async () => {
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
};

const checkoutFileIsExists = async (src, t = true) => {
  try {
    const fsConstants = require("fs").constants;
    await fs.access(src, fsConstants.F_OK);
    return true;
  } catch (err) {
    if (t) {
      if (err.code == "ENOENT") {
        return false;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }
};

const checked = async (pt, obj, callback) => {
  for (let theme of Object.keys(obj)) {
    const realPath = path.join(pt, "切图", theme);
    const info = await checkoutFileIsExists(realPath);
    const key = info ? "suc" : "err";
    callback(realPath, info, key);
  }
};

// 创建初始状态的工厂函数
const createListInfos = () => ({ suc: [], err: [], disabled: true });

// 检查文件夹路径是否正确
const checkFolderName = async (_, pt) => {
  const listInfos = createListInfos();
  try {
    const { necessary, optional } = await getConfigs();
    await checkoutFileIsExists(pt, false);
    await checked(pt, necessary, (realPath, info, key) => {
      const text = info
        ? "(必须资源) 当前路径下资源存在，检测成功！"
        : "(必须资源) 当前路径下，资源不存在。请仔细检查该路径下的资源是否存在或命名是否规范!";
      listInfos[key].push({ path: realPath, text });
    });
    if (listInfos.err.length == 0) {
      listInfos.disabled = false;
    }
    await checked(pt, optional, (realPath, info, key) => {
      const text = info
        ? "(非必须资源) 当前路径下资源存在，检测成功！"
        : "(非必须资源) 当前路径下，资源不存在。请仔细检查该路径下的资源是否存在或命名是否规范!";
      listInfos[key].push({ path: realPath, text });
    });
    return listInfos;
  } catch (err) {
    logger.error("check file fail", err);
    throw err;
  }
};

// 复制资源路径的图片到项目路径
const copyFileResource = async (_, { theme, src, destPath }) => {
  const listInfos = createListInfos();
  try {
    const { necessary, optional, extraFolder } = await getConfigs();
    for (const folder of extraFolder) {
      const realPath = path.join(src, folder.replaceAll("${theme}", theme));
      await fs.mkdir(realPath, { recursive: true }); // 递归创建文件夹
    }
    for (const [key, value] of Object.entries(Object.assign({}, necessary, optional))) {
      const resource = path.join(destPath, "切图", key); // 资源目录
      const dest = path.join(src, value).replaceAll("${theme}", theme); // 项目地址
      const isExists = await checkoutFileIsExists(resource); // 判断资源目录的图片路径是否存在
      if (isExists) {
        await fs.copyFile(resource, dest); // 将资源目录图片复制到项目目录
        listInfos.suc.push({
          path: resource,
          text: `资源图片已成功复制到开发项目的 "${dest}" 路径下！`,
        });
      } else {
        listInfos.err.push({
          path: resource,
          text: "当前路径下的资源不存在，复制失败！",
        });
      }
    }
    return listInfos;
  } catch (err) {
    logger.error("copy file fail", err);
    throw err;
  }
};

const fileHandlers = [
  {
    type: "handle",
    name: "checkFolderName",
    callback: checkFolderName,
  },
  {
    type: "handle",
    name: "copyFileResource",
    callback: copyFileResource,
  },
];

module.exports = fileHandlers;
