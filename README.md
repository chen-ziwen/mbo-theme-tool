# 咩播主题新增工具

## 介绍

在公司处理 “咩播” 项目的过程中，经常需要引入大量的图片资源，而这些图片资源大多用于插件的主题，它们的文件路径和图片命名都存在一定的规律。
为了避免重复的新增图片、重命名工作，简单制作了一个 electron 应用，用于快速检查图片资源是否符合要求和一键将图片资源复制到对应的文件夹并重命名。

一开始该项目只是一个脚本工具，后面打算给美术用来检测图片资源是否完整，故做成了可视化应用。

> **有相同需求的 "打工人"，该项目可作为一个参考资料！**

## 重点说明

本应用由于没有提供签名证书，安装时会有安全警告，需要手动允许。

## 示例

### 部分截图
![image](https://github.com/user-attachments/assets/c13e7b1a-67c5-4f97-88a2-d241d24e43e1)
![image](https://github.com/user-attachments/assets/bee2ab1e-c742-4f29-a41c-5e89840d755a)
![image](https://github.com/user-attachments/assets/25241b84-c53d-4778-b553-344bb466c53c)
![image](https://github.com/user-attachments/assets/f114aa5f-7532-4472-be1b-39ccdae0d75d)

### 成功执行
![image](https://github.com/user-attachments/assets/379859b4-8566-45ba-8887-94ec332e4d35)
![image](https://github.com/user-attachments/assets/2e13514b-a537-4264-a7a2-43d9b00eda9d)

## 运行

```git
$ git clone git@github.com:chen-ziwen/mbo-theme-tool.git`
$ npm install
$ npm start
```

## 编译

```git
$ npm run build // 编译前端
$ npm run electron:build // 根据当前环境编译 electron 应用
```
