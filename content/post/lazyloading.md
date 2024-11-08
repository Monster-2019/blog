---
title: 'JavaScript实现懒加载图片、动画'
date: 2022-10-10T16:25:50+08:00
description: 懒加载是前端一种常见的优化手段，下面将介绍两种常见的懒加载实现
categories:
    - 前端开发
    - 前端优化
    - JavaScript
tags:
    - JavaScript
    - 懒加载
    - 性能优化
---

懒加载是前端一种常见的优化手段，下面将介绍两种常见的懒加载实现

### 方法一 (getBoundingClientRect API)

该方法优点是兼容性较好，所有浏览器都支持。代码如下

```javascript
const innerHeight = window.innerHeight
const debounce = (func, delay = 200) => {
	let timer
	return function (...args) {
		const context = this
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(context, args)
		}, delay)
	}
}
const lazyLoading = () => {
	let imgs = [...document.querySelectorAll('img')]
	imgs.forEach(el => {
		const { top, height } = el.getBoundingClientRect()
		if (innerHeight - top > 0) {
			el.classList.add('animation')
			el.src = el.dataset.src
		}
		if (top + height < 0 || top > innerHeight) {
			el.classList.remove('animation')
		}
	})
}
window.addEventListener('scroll', debounce(lazyLoading, 300), false)
window.onload = lazyLoading
```

使用 getBoundingClientRect 获取元素高度和距离顶部的距离，计算是否在可视区内，如果在可视区内就给图片设置 src 属性或者添加动画 class，如果不在可视区内就移除动画 class，使元素在下次滚动到可视区时还能有动画效果。因为有些图片一开始就在顶部，这时候并不会触发 scroll 事件，就需要在页面加载完成时调用一次 lazyLoading 方法。

> 优化点：如果只需要使用图片懒加载，可以将选择器改为 document.querySelectorAll("img[src='']")，这样只会遍历还没加载图片的 img 元素。

### 方法二 (IntersectionObserver API)

IntersectionObserver 不支持 IE 浏览器，也不支持一些低版本的浏览器，但在今日，对于一些主流的浏览器兼容是足够的。它更容易实现。代码如下

```javascript
let observer
const loadImage = entries => {
	entries.forEach(entry => {
		if (entry.intersectionRatio > 0) {
			const { src } = entry.target.dataset
			entry.target.src = src
			entry.target.classList.add('animation')
		} else {
			entry.target.classList.remove('animation')
		}
	})
}
window.onload = () => {
	observer = new IntersectionObserver(loadImage)
	let imgs = [...document.querySelectorAll('img')]
	imgs.forEach(el => {
		observer.observe(el)
	})
}
```

首先我们在页面加载完成时注册一个 IntersectionObserver 实例，同时获取所有的 img 元素并使用 IntersectionObserver 实例进行监听。callback 通常会在元素进入视口和离开视口时触发，如果你在实例化 IntersectionObserver 的时候配置了 threshold 属性，它也会在 threshold 条件下触发。

回调函数接受两个参数，一个 IntersectionObserverEntry 对象，一个触发 IntersectionObserver 的实例

IntersectionObserverEntry 中包含如下属性

-   boundingClientRect(触发元素宽高属性，同 getBoundingClientRect)
-   intersectionRatio(相交比例)
-   intersectionRect(相交区域)
-   isIntersecting(与根相交)
-   rootBounds(观察者根元素)
-   target(相交元素)
-   time(相交时间戳)

我们只需要 intersectionRatio 相交比例，在它大于 0 时我们设置 img 标签的 src 属性或者动画 class，在等于 0 时移除动画 class。

> 优化点：如果只需要使用图片懒加载，可以在设置了 src 属性后通过 observer.unobserve 方法移除元素的监听。

可以根据兼容性需要选择合适的实现方案
