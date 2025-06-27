# 构建和发布指南

## 🚀 打包大小优化

本项目已进行了全面的打包大小优化，包括：

### Vite 构建优化
- **代码压缩**: 使用 Terser 进行 JavaScript 代码压缩
- **Tree Shaking**: 自动移除未使用的代码
- **代码分割**: 将第三方库分离为独立的 chunk
  - `vue`: Vue 相关库 (vue, vue-router, pinia)
  - `antd`: Ant Design Vue 组件库
- **资源优化**: 按类型分类存储静态资源
- **生产环境**: 移除 console 和 debugger 语句

### Electron Builder 优化
- **最大压缩**: 启用 `compression: "maximum"`
- **文件过滤**: 排除不必要的文件 (源码、map文件等)
- **ASAR 打包**: 核心文件打包为 ASAR 格式
- **多平台支持**: Windows (NSIS), macOS (DMG), Linux (AppImage)

## 📦 本地构建

### 开发环境
```bash
# 启动开发服务器
npm run start

# 或者分别启动
npm run dev          # 启动 Vite 开发服务器
npm run electron:serve  # 启动 Electron
```

### 生产构建
```bash
# 构建所有平台
npm run electron:build

# 构建特定平台
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS  
npm run electron:build:linux  # Linux

# 清理构建文件
npm run clean
```

## 🔄 GitHub 自动发布

### 工作流触发
当推送带有版本标签的提交时，会自动触发构建和发布流程：

```bash
# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0
```

### 自动化流程
1. **多平台构建**: 在 Windows、macOS、Linux 上并行构建
2. **文件上传**: 将构建产物上传为 GitHub Artifacts
3. **创建 Release**: 自动创建 GitHub Release
4. **资源发布**: 将所有平台的安装包附加到 Release

### 发布内容
- **Windows**: `.exe` 安装程序和 `.msi` 包
- **macOS**: `.dmg` 磁盘镜像和 `.zip` 压缩包
- **Linux**: `.AppImage` 便携应用
- **更新文件**: 各平台的自动更新配置文件

## 📋 版本管理

### 版本号格式
使用语义化版本号: `v主版本.次版本.修订版本`

示例:
- `v1.0.0` - 首个正式版本
- `v1.1.0` - 新功能版本
- `v1.1.1` - 修复版本

### 发布步骤
1. 更新 `package.json` 中的版本号
2. 提交更改: `git commit -m "chore: bump version to v1.0.0"`
3. 创建标签: `git tag v1.0.0`
4. 推送代码和标签: `git push origin main --tags`
5. GitHub Actions 会自动构建并发布

## 🛠️ 故障排除

### 构建失败
- 检查 Node.js 版本 (推荐 18.x)
- 清理缓存: `npm run clean && npm ci`
- 检查依赖版本兼容性

### GitHub Actions 失败
- 确保仓库有 `GITHUB_TOKEN` 权限
- 检查标签格式是否正确 (`v*.*.*`)
- 查看 Actions 日志了解具体错误

### 打包体积过大
- 检查是否有大文件被意外包含
- 使用 `npm run build` 查看构建分析
- 考虑进一步的代码分割

## 📊 构建统计

构建完成后，可以查看：
- 压缩前后的文件大小对比
- 各个 chunk 的大小分布
- 构建时间统计

这些信息有助于进一步优化打包配置。