const { dialog } = require("electron");

// 打开文件
const openFile = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
  });
  if (canceled) {
    return {
      status: false,
      message: "cancel",
      path: "",
    };
  } else {
    return {
      status: true,
      message: "success",
      path: filePaths[0],
    };
  }
};

// 打开文件夹
const openFolder = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (canceled) {
    return {
      status: false,
      message: "cancel",
      path: "",
    };
  } else {
    return {
      status: true,
      message: "success",
      path: filePaths[0],
    };
  }
};

const dialogHandlers = [
  {
    type: "handle",
    name: "dialog:openFile",
    callback: openFile,
  },
  {
    type: "handle",
    name: "dialog:openFolder",
    callback: openFolder,
  },
];

module.exports = dialogHandlers;
