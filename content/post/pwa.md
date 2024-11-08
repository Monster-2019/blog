---
title: '让你的Web支持PWA'
date: 2022-09-22T14:07:46+08:00
description: PWA(渐进式Web应用)，将你的web app安装在桌面给你带来原生应用的体验
categories:
    - Javascript
tags:
    - Javascript
    - PWA
---

当你的 Web 在应用了 PWA 后，可以将 Web 安装在桌面上，就算原生应用一样离线使用，还可以利用 Web API 推送通知，从而提高用户体验，下面就让我们开始吧。

让 PWA 支持安装需要满足以下条件:

-   一个 webmanifest 文件，其中包含你的网站必需信息
-   你的网站必须支持 https 协议
-   一个用于桌面图标的图片
-   一个 Service Worker，并且已经注册完毕，可离线工作

```json
// manifest.webmanifest
{
    "name": "Monster Push PWA",  // PWA完整应用名称
    "short_name": "Monster Push",  // PWA短应用名称，完整名称无法完全展示是显示
    "start_url": "/",  // 资源加载路径 针对网站的相对路径
    "display": "standalone", // 支持fullscreen(全屏)模式 standalone(保留系统状态栏)模式
    "description": "PWA Demo" // 应用描述
    "icons": [ // 应用的图标 针对不同场景显示不同的图标 必须带有src、sizes、type
        {
            "src": "/android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "background_color": "#ffffff", // 应用启动背景颜色
    "theme_color": "#ffffff" // 主题颜色
}
```

name、icons、start_url、display 字段是必需的，其他可以按自己情况填写，在 head 中加载该文件

```html
<head>
	...
	<link rel="manifest" href="/manifest.webmanifest" />
</head>
```

接下来我们注册 Service Worker，在根目录创建 registerSW.js，当浏览器支持 Service Worker 时会注册 Service Worker，执行 sw.js 中的代码

```javascript
// registerSW.js
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		console.log('serviceWorker' in navigator)
		navigator.serviceWorker.register('/sw.js', { scope: '/' })
	})
}
```

只需要加一行代码捕获 fetch 请求即可

```javascript
// sw.js
self.addEventListener('fetch', () => console.log('fetch'))
```

在 html 中加载 registerSW.js

```html
<head>
	...
	<script src="/registerSW.js"></script>
</head>
```

至此你的 web 已经支持 PWA 安装了

![image](https://monster.aiur.site/20220922173704.png)
![image](https://monster.aiur.site/eabb6236ecc7cdd4ca002b4b5d7f8bd1.jpg)

chrome 上出现安装图标或者安装应用就是成功了，安装后会在桌面出现设置的图标，跟原生应用一样

![image](https://monster.aiur.site/b688108204651278eda8cae7b6564ce1.jpg)

打开应用也和原生应用没有太大区别，Service Worker 还有很多功能，可从[Service Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)文档中了解
