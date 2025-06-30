## 介绍

在公司处理 “咩播” 项目的过程中，经常需要引入大量的图片资源，而这些图片资源大多用于插件的主题，它们的命名都存在一定的规律。

为了避免每次重复的替换图片工作，搞了一个简单的 electron 应用，用于快速检查图片资源是否符合要求和一键将图片资源复制到对应的文件夹并重命名。

## 重点说明

本应用由于没有提供签名证书，安装时会有安全警告，需要手动允许。

## 示例

![image](https://github.com/user-attachments/assets/fa4608e4-4f14-44d3-817a-3142fc47111a)
![image](https://github.com/user-attachments/assets/eef1677c-c07b-4e6e-a793-6efa2bb5b2f3)
![image](https://github.com/user-attachments/assets/362c9c09-abdc-4788-be88-c42755dbc664)
![image](https://github.com/user-attachments/assets/9f839c7c-9cd8-4cef-a4f9-fd165a89a263)

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
