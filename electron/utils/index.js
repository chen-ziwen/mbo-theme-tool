const icons = require("./icons");
const configPath = require("./confgPath");
const logger = require("./logger");

module.exports = {
  ...icons,
  ...configPath,
  ...logger,
};
