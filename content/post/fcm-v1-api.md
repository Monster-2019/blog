---
title: 'FCM 迁移到新 V1 API'
date: 2024-09-01T11:35:41+08:00
description: 'FCM 从旧 API 迁移到新 V1 API'
tags:
    - Firebase
    - Notification
---

从 2024 年 6 月 20 日之后就无法使用旧版的 FCM API 了，必须迁移到 V1 版本才能使用，今天介绍国内如何迁移到 V1 版本。

### 1. 生成服务账号

进入你的 Firebase Messaging 项目 > 项目设置 > 服务账号 > 生成新的私钥

### 2. 获取 accessToken

我是 node 项目，所以使用 google-auth-library 库

```bash
npm install google-auth-library
```

```javascript
const { GoogleAuth } = require('google-auth-library')
const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_ADMIN_SDK // 服务账号JSON路径
const serviceAccount = requrie(SERVICE_ACCOUNT_FILE)

const auth = new GoogleAuth({
	credentials: serviceAccount,
	scopes: ['https://www.googleapis.com/auth/cloud-platform'] // 直接使用示例授权范围即可
})

async function getAccessToken() {
	const accessToken = await auth.getAccessToken()
	return accessToken
}

getAccessToken().then(accessToken => console.log(accessToken))
```

本地开发的话，国内需要使用代理，google-auth-library 并不提供 proxy 配置，但支持 HTTPS_PROXY 环境代理，Windows 使用以下命令

```bash
set HTTPS_PROXY=http://xxx.xxx.xxx.xxx:xxx # 配置代理
set HTTPS_PROXY= # 取消代理
```

### 3. 发送通知

与之前的接口相比，URL、授权、请求参数都发生了些许变化

#### URL 变化

原 URL

```js
https://fcm.googleapis.com/fcm/send // 原URL
```

V1 新 URL

```js
https://fcm.googleapis.com/v1/projects/{project-name}/messages:send // projects-name为firebase项目名

```

#### 授权变化

原来使用服务器密钥

```js
Authorization: key=AIzaSyZ-1u...0GBYzPu7Udno5aA

```

现在使用 accessToken

```js
Authorization: Bearer ya29.ElqKBGN2Ri_Uz...HnS_uNreA

```

#### 请求参数

原请求参数

```json
{
	// 旧请求参数
	"to": "bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...", // or "/topics/news"
	"registration_ids": ["bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1..."],
	"notification": {
		"title": "Breaking News",
		"body": "New news story available."
	},
	"data": {
		"story_id": "story_12345"
	}
}
```

-   单设备或者主题通知使用 to 参数
-   多设备使用 registration_ids 参数

V1 新请求参数

```json
{ // 新请求参数
	"message": {
		"token": "bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1..."
		"topic": "news",
		"notification": {
			"title": "Breaking News",
			"body": "New news story available."
		},
		"data": {
			"story_id": "story_12345"
		}
	}
}
```

-   使用 message 包裹
-   单设备使用 token
-   主题通知使用 topic，但不需要/topics/，只用主题名
-   删除了多设备通知，只能使用主题实现

返回结果：projects/{project_id}/messages/{message_id}格式字符串

```
{
	"name": "projects/myproject-b5ae1/messages/0:1500415314455276%31bd1c9631bd1c96"
}
```

### 4. 订阅和退订主题

之前多设备都是用的 registration_ids 参数，但移除了不得不使用主题通知

#### 订阅通知

URL: https://iid.googleapis.com/iid/v1:batchAdd

```json
{
	"to": "/topics/{your_topic}",
	"registration_tokens": ["bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...", "..."]
}
```

-   授权方式和发送通知一样用 accessToken
-   to：订阅主题，/topics/ + 你的主题名
-   registration_tokens: 订阅的设备令牌数组，支持多个设备一起订阅

返回结果

```json
{ "results": [{}] }
```

-   results 包含每个令牌的订阅结果
-   如果结果中有 error 字段表示该令牌订阅失败

#### 退订通知

URL: https://iid.googleapis.com/iid/v1:batchRemove

```json
{
	"to": "/topics/{your_topic}",
	"registration_tokens": ["bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...", "..."]
}
```

-   授权方式和发送通知一样用 accessToken
-   to：退订主题，/topics/ + 你的主题名
-   registration_tokens: 订阅的设备令牌数组，支持多个设备一起退订

返回结果

```json
{ "results": [{}] }
```

-   results 包含每个令牌的退订结果
-   如果结果中有 error 字段表示该令牌退订失败

### 5. 其他参数调整

-   notification 参数中不支持 icon 和 click_action 参数，需要在相关平台参数中配置，如 webpush 的 notificaition，android 的 notificaition
-   webpush 不支持 click_action，改为 fcm_options.link

详细配置参考：[https://firebase.google.com/docs/cloud-messaging/migrate-v1?hl=zh-cn](https://firebase.google.com/docs/cloud-messaging/migrate-v1?hl=zh-cn)

### 6. 请求封装

我在 Node 项目中使用，所以使用 axios 封装，可参考

```js
// axiosInstance.js
const axios = require('axios')
const { GoogleAuth } = require('google-auth-library')
const { HttpsProxyAgent } = require('https-proxy-agent')
const fs = require('fs')
const dotenv = require('dotenv')

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env'
dotenv.config({ path: envFile })

const httpsAgent = process.env.NODE_ENV ? new HttpsProxyAgent('http://xxx.xxx.xxx.xxx:xxxx') : null

const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_ADMIN_SDK
const serviceAccount = require(SERVICE_ACCOUNT_FILE)

const auth = new GoogleAuth({
	credentials: serviceAccount,
	scopes: ['https://www.googleapis.com/auth/cloud-platform']
})

// 获取访问令牌
async function getAccessToken() {
	const accessToken = await auth.getAccessToken()
	return accessToken
}

let accessToken = ''

const axiosInstance = axios.create({
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
		access_token_auth: true
	},
	httpsAgent,
	proxy: false
})

axiosInstance.interceptors.request.use(async config => {
	if (!accessToken) {
		accessToken = await getAccessToken()
	}
	config.headers['Authorization'] = `Bearer ${accessToken}`

	return config
})

axiosInstance.interceptors.response.use(
	async response => {
		return [null, response.data]
	},
	async error => {
		const { status = 0, statusText = '' } = error.response
		if (status === 400) {
			const { message } = error.response.data.error
			return [{ status, statusText: message }, null]
		}
		if (status === 401) {
			const originConfig = error.config
			accessToken = await getAccessToken()
			originConfig.headers['Authorization'] = `Bearer ${accessToken}`
			const result = await axios.request(originConfig)
			return [null, result.data]
		}
		return [{ status, statusText }, null]
	}
)

module.exports = axiosInstance
```

封装接口调用

```js
const axiosInstance = require('./axiosInstance')

const sendNotification = (data, config) =>
	axiosInstance.post('https://fcm.googleapis.com/v1/projects/xxxxxxx/messages:send', data, config)
const batchAdd = (data, config) => axiosInstance.post('https://iid.googleapis.com/iid/v1:batchAdd', data, config)
const batchRemove = (data, config) => axiosInstance.post('https://iid.googleapis.com/iid/v1:batchRemove', data, config)

module.exports = {
	sendNotification,
	batchAdd,
	batchRemove
}
```

接口使用

```js
const { sendNotification, batchAdd, batchRemove } = require('../xx/index')
// 发送通知
const params = {
	message: {
		token: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
		notification: {
			title,
			body: content
		},
		data: {
			messageId: String(newMessage.id)
		}
	}
}

const [err, result] = await sendNotification(params)
if (err) {
	// do something
}

// 设备订阅
let batchData = {
	to: `/topics/{your_topic}`,
	registration_tokens: ['xxxxxx']
}
const [err, result] = await batchAdd(batchData)
if (err) {
	// do something
}

// 设备退订
let batchData = {
	to: `/topics/{your_topic}`,
	registration_tokens: ['xxxxxx']
}
const [err, result] = await batchRemove(batchData)
if (err) {
	// do something
}
```

注意事项：

-   因为我线上服务部署在香港，所以不需要使用代理，只有本地开发需要，所以 httpsAgent 自己调整
-   如果你是使用 axios，并且需要使用代理，请将你的 proxy 配置设置为 false，否则在你配置 HTTPS_PROXY 后请求 https 时会受到影响
-   如果你需要使用订阅和退订，需要在 headers 中使用 access_token_auth: true 配置
