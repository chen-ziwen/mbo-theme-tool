/**
   * 版本比较函数
   * @param {string} version1 版本1
   * @param {string} version2 版本2
   * @returns {number} 比较结果
   */
function compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;

        if (v1part > v2part) return 1;
        if (v1part < v2part) return -1;
    }

    return 0;
}

module.exports = {
    compareVersions
};