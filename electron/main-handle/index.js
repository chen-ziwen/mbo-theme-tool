const { ipcMain } = require("electron");
const dialogHandlers = require("./dialog");
const fileHandlers = require("./file");
const configHandlers = require("./config");
const { updaterHandlers } = require("./updater");

const mainHandle = [...dialogHandlers, ...fileHandlers, ...configHandlers, ...updaterHandlers];

const registerHandler = () => {
  for (let value of mainHandle) {
    if (typeof value.callback == "function") {
      ipcMain[value.type](value.name, value.callback);
    }
  }
};

module.exports = registerHandler;
