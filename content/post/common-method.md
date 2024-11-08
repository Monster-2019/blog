---
title: '常用高频方法'
date: 2022-08-04T14:45:39+08:00
description: 整理一些开发中常用到的高频方法
categories:
    - 前端开发
tags:
    - Javascript
---

整理一些开发中常用到的高频方法

```
/**
 * @description: 防抖 delay 毫秒后执行func
 * @param {function} 执行函数
 * @param {delay} 防抖时间
 * @return {function}
 */
const debounce = (func, delay = 200) => {
	let timer;
	return function (...args) {
		const context = this;
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(context, args);
		}, delay)
	}
}
```

```
/**
 * @description: 节流 delay毫秒内只执行一次func
 * @param {function} 执行函数
 * @param {delay} 节流时间
 * @return {function}
 */
const throttle = function (func, delay = 200) {
	let timer = 0
	return function fn() {
		let context = fn
		let args = arguments
		if (!timer) {
			timer = setTimeout(function () {
				func.apply(context, args)
				timer = 0
			}, delay)
		}
	}
}
```

```
/**
 * @description: 补0
 * @param {string} 需要补0的数或字符串
 * @param {number} 字符串长度
 * @param {string}
 */
function padZero (str = '', num = 2) {
    str = str + ''
    let strLen = str.length
    let padNum = num - strLen
    if (strLen === 0 || num === 0 || padNum <= 0) return str

    for (let i = 0; i < padNum; i++) {
        str = '0' + str
    }
    return str
}
```

```
/**
 * @description: 文件下载
 * @param {url} 文件地址
 * @return {}
 */
const downloadFile = (url) => {
    let a = document.createElement('a')
    a.href = url
    a.download = true
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
}
```

```
/**
 * @description: 文件流下载
 * @param {response} 请求返回体
 * @return {}
 */
const downloadBlob = (response) => {
    const content = response.data
    const fileName = decodeURIComponent(
        response.headers['content-disposition'].match((/(filename\*=UTF-8'')(\S*)/))[2]
    )
    const blob = new Blob([content])
    if ('download' in document.createElement('a')) {
        // 非IE下载
        const elink = document.createElement('a')
        elink.download = fileName
        elink.style.display = 'none'
        elink.href = URL.createObjectURL(blob)
        document.body.appendChild(elink)
        elink.click()
        URL.revokeObjectURL(elink.href) // 释放URL 对象
        document.body.removeChild(elink)
    } else {
        // IE10+下载
        navigator.msSaveBlob(blob, fileName)
    }
}
```

```
/**
 * @description: 时间戳格式化
 * @param {time} 时间戳
 * @return {}
 */
const timestamp = (time) => {
    let timems = Number(time.toString().length === 13 ? time : time + '000')
    return new Date(timems + 8 * 3600 * 1000).toJSON().substr(0, 19).replace('T', ' ')
}
```
