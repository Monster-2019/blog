---
title: 'Chrome Extensions在指定路由才注入执行content.js'
date: 2024-07-01T22:30:28+08:00
description: Chrome Extensions只有在指定子路由的时候才注入执行content.js，而不是在访问matches域名时注入执行
tags:
    - Chrome Extensions
    - SPA
---

因为 Chrome Extensions 的 content.js matches 会忽略域名后面的 path，所以 content.js 会在访问 matches 域名时就会注入进去，如果我们希望 content.js 只需要在指定的 path 执行，那么因为这个规则就会导致我们的 content.js 执行失败。

#### 使用 background.js 代替 Content Matches

虽然可以在 content.js 中通过条件判断来实现匹配 path，但 content 应该更注重操作，而不是操作条件，所以我们把这个判断条件放到 background 中。

###### manifest.json

```json
{
    "permissions": ["webNavigation", "scripting"],
    "host_permissions": ["https://*.xxx.com/*"],
    "background": {
        "service_worker": "background.js"
    }
}
```

-   permissions：background.js 需要的权限，用于调用 Chrome Extensions 的 API
-   host_permissions：Service Worker 需要的主机访问权限
-   background：注册 Service Worker 服务

###### background.js

```javascript
chrome.webNavigation.onCompleted.addListener(
    function (details) {
        console.log('onCompleted event detected:', details.url)
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            files: ['content.js']
        })
    },
    {
        url: [{ urlMatches: 'https://www.xxx.com/xxx.*' }]
    }
)

chrome.webNavigation.onHistoryStateUpdated.addListener(
    function (details) {
        console.log('onHistoryStateUpdated event detected:', details.url)
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            files: ['content.js']
        })
    },
    {
        url: [{ urlMatches: 'https://www.xxx.com/xxx.*' }]
    }
)
```

实现原理：注册 Chrome Extensions Service Worker → 匹配 chrome.webNavigation 监听器中的 url → 触发回调函数 → 在指定标签页中执行 content.js

监听器只有在 url 匹配时才会触发。回调函数中的 details 中包含当前标签页的信息，我们使用了 url 和 tabId。onCompleted 和 onHistoryStateUpdated 监听器分别在页面第一次加载和跳转路由时触发。

> 需要注意的点，host_permissions 和 urlMatches 的全匹配不一样，urlMatches 是正则匹配，全匹配需要用.\*，host_permissions 不需要，可以直接使用\*
