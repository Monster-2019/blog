---
title: 'Fetch封装'
date: 2022-08-26T11:03:58+08:00
description: 随着浏览器的更新迭代，对 fetch 和 Promise 的支持也越来越好，在一些需求小或者无兼容需求的项目引入请求库无疑是浪费资源的，而原生支持的 fetch 就为我们提供了另一条路，下面针对 fetch 和 API 规范做封装
tags:
    - Javascript
    - Fetch
---

随着浏览器的更新迭代，对 fetch 和 Promise 的支持也越来越好，在一些需求小或者无兼容需求的项目引入请求库无疑是浪费资源的，而原生支持的 fetch 就为我们提供了另一条路，下面针对 fetch 和 API 规范做封装

#### 请求基本配置

```javascript
const BASE_URL = 'https://xxxx.com/xxx'       // 请求地址
const TIME_OUT = 5000       // 请求超时时间，单位毫秒
```

#### 先看我们的主要请求体
```javascript {.line-numbers}
const fetchApi = async (url, opts) => {
    const controller = new AbortController()

    url = base_url + url
    const options = {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "content-type": "application/json"
        },
        ...opts,
        signal: controller.signal
    }

    const timer = setTimeout(() => {
        controller.abort()
    }, TIME_OUT)
    try {
        return await fetch(url, options)
            .then(async res => {
                if (res.ok === true) {
                    const data = await res.clone().json()
                    return Promise.resolve(data)
                } else {
                    if (res.status === 401) {
                        let params = {
                            refresh_token: getRefreshToken()
                        }
                        let { access_token } = await refreshToken(params)
                        setAccessToken(access_token)
                        return await fetchApi(url, options)
                    } else {
                        return Promise.reject(res)
                    }
                }
            })
            .catch(err => {
                return Promise.reject(err)
            })
            .finally(_ => {
                clearTimeout(timer)
            })
    } catch (err) {
        return Promise.reject(err)
    }
}
```

-   fetchApi 参数 1. 请求地址 2. 初始化配置对象, 可选
-   4 行 - 11 行，拼接 url 同时初始化请求参数，初始化一般都是携带自定义的请求头
-   2、10、13-15 行，我们通过延时器和 AbortController 控制器取消请求来处理请求时间过长的问题，同时在请求完成后不要忘记清除延时器 39 行
-   为了统一处理 Promise 都是用 await 来接收结果，在外层用 try catch 捕获所有错误
-   17 行 - 40 行就是请求主体了，判断请求状态返回请求结果，如果 token 过期则刷新 token 再次请求
-   通常在 21 行处还需要判断请求成功,但因为其他原因导致失败的状态码，一般都和服务端进行协商约定，这个封装因为后端是自己的项目错误情况都不会是 200 状态码所以省略了这一步

为了便于调用，我们在原型方法上挂载请求方法函数

```javascript
fetchApi.get = async (url, params = {}) => {
    if (JSON.stringify(params) !== '{}') {
        url += (url.indexOf('?') > -1 ? '&' : '?') + paramsStringify(params)
    }

    return await fetchApi(url, {
        method: 'GET'
    })
}

fetchApi.post = async (url, data) => {
    return await fetchApi(url, {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

fetchApi.put = async (url, data) => {
    return await fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

fetchApi.delete = async (url) => {
    return await fetchApi(url, {
        method: 'DELETE',
    })
}
```
get方法和delete方法没有body所以我们需要自己处理参数

封装中用到的其他方法如下：
```javascript
const paramsStringify = (params) => {
    return Object.keys(params).map(key => {
        return `${key}=${encodeURI(params[key])}`
    }).join('&')
}
const setAccessToken = (access_token, options) => {
    return Cookies.set('access_token', access_token, options)
}
const getAccessToken = () => {
    return Cookies.get('access_token')
}
const getRefreshToken = () => {
    return Cookies.get('refresh_token')
}
const refreshToken = (params) => fetchApi.get(`${base_url}/auth/refresh_token`, params)
```

#### 完整的代码如下
```javascript
const base_url = '/api'
const TIME_OUT = 30000

const setAccessToken = (access_token, options) => {
    return Cookies.set('access_token', access_token, options)
}

const getAccessToken = () => {
    return Cookies.get('access_token')
}

const getRefreshToken = () => {
    return Cookies.get('refresh_token')
}

const paramsStringify = (params) => {
    return Object.keys(params).map(key => {
        return `${key}=${encodeURI(params[key])}`
    }).join('&')
}

const refreshToken = (params) => fetchApi.get(`/auth/refresh_token`, params)

const fetchApi = async (url, opts) => {
    const controller = new AbortController();

    url = base_url + url
    const options = {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        },
        mode: "cors",
        ...opts,
        signal: controller.signal
    }

    const timer = setTimeout(() => {
        controller.abort()
    }, TIME_OUT);
    try {
        return await fetch(url, options)
            .then(async res => {
                if (res.ok === true) {
                    const data = await res.clone().json()
                    return Promise.resolve(data)
                } else {
                    if (res.status === 401) {
                        let params = {
                            refresh_token: getRefreshToken()
                        }
                        let { access_token } = await refreshToken(params)
                        setAccessToken(access_token)
                        return await fetchApi(url, options)
                    } else {
                        return Promise.reject(res)
                    }
                }
            })
            .catch(err => {
                return Promise.reject(err)
            })
            .finally(_ => {
                clearTimeout(timer)
            })
    } catch (err) {
        return Promise.reject(err)
    }
}

fetchApi.get = async (url, params = {}) => {
    if (JSON.stringify(params) !== "{}") {
        url += (url.indexOf("?") > -1 ? "&" : "?") + paramsStringify(params)
    }

    return await fetchApi(url, {
        method: "GET",
    })
}

fetchApi.post = async (url, data) => {
    return await fetchApi(url, {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export default fetchApi
```

#### 使用方法
```javascript
fetchApi('/api/login', { username: "monster", password: 123456 }).then(res => xxx)
```

#### 总结
为了简洁，一个方法可以放在utils工具文件中进行复用，此处为了展示完整代码所以搬到了一个文件中。响应可以根据自己的需求进行扩展。因为是原生支持还是存在不同浏览器的兼容问题需要使用polyfill插件来解决。虽然提供了mode来支持跨域，但还是需要服务端来配合使用才行。