# App Launch Demo

一个最小可运行的手机 H5 Demo，用来验证“在移动浏览器中打开页面并拉起对应 App”的流程。

## 文件

- `index.html`: 页面结构
- `styles.css`: 移动端样式
- `app.js`: 环境识别、深链拉起、回退逻辑

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

## 注意

- 微信里通常无法直接拉起自定义 Scheme，需要引导用户去系统浏览器。
- 不同 Android 厂商对深链拦截策略不同，真机测试必不可少。
- 如果你们后续要做 PWA，可以在此基础上再补 `manifest.webmanifest` 和 Service Worker。
