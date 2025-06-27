const fs = require("fs").promises;
const path = require("path");
const { getUserConfigDir, getDefaultConfigDir, logger } = require("../utils");

// 配置文件路径
const USER_CONFIG_DIR = getUserConfigDir();
const DEFAULT_CONFIG_DIR = getDefaultConfigDir();
const THEME_CHECK_PATH = path.join(USER_CONFIG_DIR, "theme-check.json");
const EXTRA_FOLDER_PATH = path.join(USER_CONFIG_DIR, "extra-folder.json");
const DEFAULT_THEME_CHECK_PATH = path.join(DEFAULT_CONFIG_DIR, "theme-check.json");
const DEFAULT_EXTRA_FOLDER_PATH = path.join(DEFAULT_CONFIG_DIR, "extra-folder.json");

// 确保用户配置目录存在
const ensureUserConfigDir = async () => {
  try {
    await fs.access(USER_CONFIG_DIR);
  } catch (error) {
    await fs.mkdir(USER_CONFIG_DIR, { recursive: true });
    await copyDefaultConfigs();
  }
};

// 复制默认配置文件
const copyDefaultConfigs = async () => {
  try {
    // 复制主题检查配置
    try {
      const themeCheckDefault = await fs.readFile(DEFAULT_THEME_CHECK_PATH, "utf-8");
      await fs.writeFile(THEME_CHECK_PATH, themeCheckDefault, "utf-8");
    } catch (err) {
      // 如果默认配置不存在，创建空配置
      await fs.writeFile(
        THEME_CHECK_PATH,
        JSON.stringify({ necessary: {}, optional: {} }, null, 2),
        "utf-8"
      );
    }

    // 复制额外文件夹配置
    try {
      const extraFolderDefault = await fs.readFile(DEFAULT_EXTRA_FOLDER_PATH, "utf-8");
      await fs.writeFile(EXTRA_FOLDER_PATH, extraFolderDefault, "utf-8");
    } catch (err) {
      // 如果默认配置不存在，创建空配置
      await fs.writeFile(EXTRA_FOLDER_PATH, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (error) {
    logger.error("复制默认配置失败:", error);
  }
};

// 读取文件路径配置
const readPathConfig = async () => {
  try {
    await ensureUserConfigDir();
    const content = await fs.readFile(THEME_CHECK_PATH, "utf-8");
    const { necessary, optional } = JSON.parse(content);
    return { necessary, optional };
  } catch (error) {
    logger.error("读取路径配置失败:", error);
    return { necessary: {}, optional: {} };
  }
};

// 读取额外文件夹配置
const readExtraFolderConfig = async () => {
  try {
    await ensureUserConfigDir();
    const content = await fs.readFile(EXTRA_FOLDER_PATH, "utf-8");
    const extraFolders = JSON.parse(content);
    return extraFolders;
  } catch (error) {
    logger.error("读取额外文件夹配置失败:", error);
    return [];
  }
};

// 保存文件路径配置
const savePathConfig = async (necessary, optional) => {
  try {
    await ensureUserConfigDir();
    const config = {
      necessary,
      optional,
    };
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(THEME_CHECK_PATH, content, "utf-8");
    return true;
  } catch (error) {
    logger.error("保存路径配置失败:", error);
    throw error;
  }
};

// 保存额外文件夹配置
const saveExtraFolderConfig = async (extraFolders) => {
  try {
    await ensureUserConfigDir();
    const content = JSON.stringify(extraFolders, null, 2);
    await fs.writeFile(EXTRA_FOLDER_PATH, content, "utf-8");
    return true;
  } catch (error) {
    logger.error("保存额外文件夹配置失败:", error);
    throw error;
  }
};

// 加载所有配置
const loadConfigs = async () => {
  try {
    const { necessary, optional } = await readPathConfig();
    const extraFolders = await readExtraFolderConfig();

    return {
      necessary,
      optional,
      extraFolders,
    };
  } catch (error) {
    logger.error("加载配置失败:", error);
    throw error;
  }
};

// 保存所有配置
const saveConfigs = async (_, { necessary, optional, extraFolders }) => {
  try {
    await savePathConfig(necessary, optional);
    await saveExtraFolderConfig(extraFolders);

    return { success: true };
  } catch (error) {
    logger.error("保存配置失败:", error);
    throw error;
  }
};

// 备份配置文件
const backupConfigs = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(USER_CONFIG_DIR, "backup", timestamp);

    // 创建备份目录
    await fs.mkdir(backupDir, { recursive: true });

    // 备份文件
    await fs.copyFile(THEME_CHECK_PATH, path.join(backupDir, "theme-check.json"));
    await fs.copyFile(EXTRA_FOLDER_PATH, path.join(backupDir, "extra-folder.json"));

    return { success: true, backupPath: backupDir };
  } catch (error) {
    logger.error("备份配置失败:", error);
    throw error;
  }
};

// 重置配置到默认值
const resetConfigs = async () => {
  try {
    await backupConfigs();
    await copyDefaultConfigs();
    return { success: true, message: "配置已重置为默认值" };
  } catch (error) {
    logger.error("重置配置失败:", error);
    throw error;
  }
};

const configHandlers = [
  {
    type: "handle",
    name: "loadConfigs",
    callback: loadConfigs,
  },
  {
    type: "handle",
    name: "saveConfigs",
    callback: saveConfigs,
  },
  {
    type: "handle",
    name: "backupConfigs",
    callback: backupConfigs,
  },
  {
    type: "handle",
    name: "resetConfigs",
    callback: resetConfigs,
  },
];

module.exports = configHandlers;
