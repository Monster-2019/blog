---
title: '移动端自适应方案和原理'
date: 2024-09-27T15:02:58+08:00
description: '常见的两种移动端自适应布局方案，REM自适应，VW自适应'
categories:
    - 前端开发
    - 移动端
tags:
    - 自适应设计
---

基于目前前端工程化趋势，加上 postcss 插件的加持，自适应布局已经可以开箱即用了。但还是需要知道其原理才能在面试中从容应对，在此简单记录和分享下 REM 自适应和 VW 自适应实现和原理。

## 1. REM 自适应

常用的单位除了 px 外，就是 em 和 rem 了。em 是相对于父元素的字体大小，rem 是相对于根元素的字体大小，即 HTML 元素。

REM 的自适应原理就是让 css 都使用 rem 单位，我们只需要定义 HTML 元素的 font-size 属性即可，并通过监听 resize 时修改 HTML 元素 font-size，在不同机型或窗口变化时得到一致的布局。

效果如下：

![image](https://s2.loli.net/2024/09/27/sQKOTwmShzGog82.gif)

如上所示，我将 html 的 font-size 定义为了 100px，我的块 width 是 1rem，在视口宽度为 400px 时，块 width 为 100px，视口宽度为 500px 时，块 width 为 125px。

代码如下：

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>自适应</title>
		<style>
			* {
				margin: 0;
				padding: 0;
			}

			html {
				font-size: 100px;
			}

			.container {
				height: 100vh;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.box {
				width: 1rem;
				height: 1rem;
				background-color: pink;
			}
		</style>
	</head>

	<body>
		<div class="container">
			<div class="box"></div>
		</div>
		<script>
			const clientWidth = document.documentElement.clientWidth
			document.documentElement.style.fontSize = clientWidth / 4 + 'px'
			window.addEventListener('resize', () => {
				const clientWidth = document.documentElement.clientWidth
				document.documentElement.style.fontSize = clientWidth / 4 + 'px'
			})
		</script>
	</body>
</html>
```

简单示例，如果你的设计图是 375px，你可以除以 3.75，然后根据设计图计算 rem 即可。script 可以在 onload 事件中执行避免阻塞，resize 可以加上了防抖提高性能。

## 2. VW 自适应

VW 自适应也是依赖视口宽度实现。但它不需要在 resize 时进行额外处理。如果视口宽度为 400，我们希望块的宽度为 100px，将块的 width 值修改为 25vw 即可。效果和上面 rem 一样。

代码如下：

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>自适应</title>
		<style>
			* {
				margin: 0;
				padding: 0;
			}

			.container {
				height: 100vh;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.box {
				width: 25vw;
				height: 25vw;
				background-color: pink;
			}
		</style>
	</head>

	<body>
		<div class="container">
			<div class="box"></div>
		</div>
	</body>
</html>
```

在不同视口宽度的设备下，它会自动计算，达到一致布局。但兼容性没有 rem 好。
