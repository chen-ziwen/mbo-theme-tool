const icons = require("./icons");
const configPath = require("./confgPath");
const logger = require("./logger");
const compareVersions = require("./compare-version");

module.exports = {
  ...icons,
  ...configPath,
  ...logger,
  ...compareVersions
};
