---
title: 'Koa CORS 时为浏览器 Set Cookie'
date: 2025-04-01T17:44:48+08:00
description: 后端Set-Cookie语句很简单，但遇到跨域时就会遇到各种各样的问题。
categories:
    - Koa
    - Node
    - 后端开发
    - Nginx
tags:
    - Koa
    - Node
    - Cookie
    - CORS
    - Nginx
---

后端 Set-Cookie 语句很简单，但遇到跨域时就会遇到各种各样的问题。正常情况下我们如下就可以很简单的给浏览器设置一个 cookie

```js
ctx.cookies.set('accessToken', accessToken, {
	expires: new Date(accessTokenExpired),
	httpOnly: false
})
```

httpOnly 默认是 true，如果你的 token 本身就是通过 cookie 传递解析可忽略，否则前端 js 无法获取到该 cookie。

在本地开发时并没有什么问题，但发布上线后，就会发现 cookie 无法写入。

## 在跨域情况下后端正确写入 cookie

#### 1. 后端配置

后端使用 nginx 反向代理时，需要开启 Koa 框架的信任代理

```js
const app = new Koa()
app.proxy = true
```

在跨域情况下，Set-Cookie 必须配置 sameSite 和 secure 属性，示例如下

```js
ctx.cookies.set('xxx', xxx, {
	expires: new Date(),
	httpOnly: false,
	secure: true,
	sameSite: 'None',
	domain: '.dongxin.co'
})
```

如果前端域名和 API 域名不同，我们还需要配置 domain，domain 使用.xxx.xxx 的格式，保证你的前端域名和 API 域名都能匹配。

#### 2. 前端配置

前端在请求时也必须携带 cookie 才行

#### axios 配置

```js
const apiInstance = axios.create({
	baseURL: process.env.NODE_ENV === 'production' ? 'https://xxx-api.xxx.xxx/v1' : '/v1', // 设置API的基本URL
	timeout: 5000,
	withCredentials: true // 携带Cookie
})
```

#### fetch 配置

```js
fetch('https://xxx.xxx.xxx/v1', {
	credentials: 'include' // 携带Cookie
})
```

它们默认都是不携带 cookie 的，如果不想在所有请求中都携带 cookie，可以在需要 Set-Cookie 的请求时配置即可。

#### 3. Nginx 配置

```conf
server {
    server_name xxx-api.xxx.xxx;
    proxy_pass_header Set-Cookie;

    add_header Access-Control-Allow-Origin https://xxx.xxx.xxx always;
    add_header Access-Control-Allow-Credentials true always;

    ...othen config

    location / {
        ...other config
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

-   proxy_pass_header：将 Set-Cookie 响应头转发到客户端
-   Access-Control-Allow-Origin: 该响应头必须为具体域名，通常为前端的访问域名
-   Access-Control-Allow-Credentials: 允许携带 cookie
-   proxy_set_header: 转发请求的协议，让后端根据协议配置 secure

完成上述配置后，我们就跨域在请求得到响应时，在浏览器看到响应的 cookie。

当前文章并没有 CORS 配置，默认已经能够在 CORS 情况下请求成功。

## 常见的错误情况

#### 1. 接口响应 200，但却出现 CORS 错误

这种情况下我们能看到接口响应了 200，但没有响应数据，并且 Set-Cookie 没有效果，这是因为我们配置了双重跨域，在 Nginx 和后端都开启了跨域。

#### 2. Set-Cookie 配置成功，但刷新消失了

这是因为 domain 无法匹配当前域名或者 expires 为当前时间导致被清空

最后，跨域 Set-Cookie 重点就是前端携带 cookie 请求，Nginx 允许携带 Credentials，domain 域名匹配，sameSite 为"None"。
