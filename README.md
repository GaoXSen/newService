# App Launch Demo

一个最小可运行的手机 H5 Demo，用来验证“在移动浏览器中打开页面并拉起对应 App”的流程。

## 文件

- `index.html`: 页面结构
- `styles.css`: 移动端样式
- `app.js`: 环境识别、深链拉起、回退逻辑
- `pwa.js`: 安装入口与 Service Worker 注册
- `manifest.webmanifest`: PWA 安装清单
- `service-worker.js`: 静态资源缓存
- `icons/`: SVG + PNG 图标资源，兼容桌面与手机主屏幕

## 本地启动

如果机器上有 Python，可以在当前目录执行：

```bash
python3 -m http.server 8080
```

然后在同一局域网的手机里访问：

```text
http://你的电脑IP:8080
```

## 真实接入时要替换的内容

- `iosScheme`: 你们 App 的 iOS 深链或 Universal Link
- `androidScheme`: 你们 App 的 Android Scheme 或 Intent URL
- `iosStoreUrl`: App Store 地址
- `androidStoreUrl`: Android 下载页、应用市场地址，或你们自己的落地页

## 安装成桌面应用

- 桌面 Chrome / Edge: 打开页面后可以直接安装成独立应用窗口。
- Android Chrome: 可安装到主屏幕。
- iPhone / iPad: 通过 Safari 的“添加到主屏幕”生成图标。

## 注意

- 微信里通常无法直接拉起自定义 Scheme，需要引导用户去系统浏览器。
- 不同 Android 厂商对深链拦截策略不同，真机测试必不可少。
- 如果要兼容更严格的 iOS 图标要求，后续最好再补一套 PNG 图标资源。
