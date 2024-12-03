---
title: 'Vue3 directives自定义指令实现v-loading效果'
date: 2024-12-03T20:19:16+08:00
description: Vue3 使用directives实现v-loading
categories:
    - Vue3
tags:
    - Directives
    - Loading
---

使用过 element-ui 组件应该都使用过 v-loading 指令来过渡数据加载时间。它是一个常用且非常实用的功能。接下来使用 directives API 实现一个 v-load 自定义指令来实现 v-loading 效果。

## 1.实现 loading 效果

使用 css 实现 loading 效果

```css
.loader-parent--relative {
	position: relative;
}

.loader-mask {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: rgba(255, 255, 255, 0.9);
	z-index: 10;
}

.loader {
	width: 50px;
	aspect-ratio: 1;
	border-radius: 50%;
	border: 4px solid #1ed760;
	animation: l20-1 0.8s infinite linear alternate, l20-2 1.6s infinite linear;
}
@keyframes l20-1 {
	0% {
		clip-path: polygon(50% 50%, 0 0, 50% 0%, 50% 0%, 50% 0%, 50% 0%, 50% 0%);
	}
	12.5% {
		clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 0%, 100% 0%, 100% 0%);
	}
	25% {
		clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 100%, 100% 100%, 100% 100%);
	}
	50% {
		clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%);
	}
	62.5% {
		clip-path: polygon(50% 50%, 100% 0, 100% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%);
	}
	75% {
		clip-path: polygon(50% 50%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 50% 100%, 0% 100%);
	}
	100% {
		clip-path: polygon(50% 50%, 50% 100%, 50% 100%, 50% 100%, 50% 100%, 50% 100%, 0% 100%);
	}
}
@keyframes l20-2 {
	0% {
		transform: scaleY(1) rotate(0deg);
	}
	49.99% {
		transform: scaleY(1) rotate(135deg);
	}
	50% {
		transform: scaleY(-1) rotate(0deg);
	}
	100% {
		transform: scaleY(-1) rotate(-135deg);
	}
}

.fade-in {
	animation: fade-in 0.3s ease;
}

.fade-out {
	animation: fade-out 0.3s ease;
}

@keyframes fade-in {
	0% {
		opacity: 0;
	}

	100% {
		opacity: 1;
	}
}

@keyframes fade-out {
	0% {
		opacity: 1;
	}

	100% {
		opacity: 0;
	}
}
```

.loader-mask 是 loading 的遮罩层，.loading 才是主要的 loading 主体，利用动画来实现 v-loading 一样的圆圈 loading。.fade-in 和.fade-out 分别是显示和隐藏的过渡动画。

## 2. 实现 v-load 指令

```typescript
// directives/load.ts
import { App } from 'vue'

const sleep = async (s: number) => await new Promise(resolve => setTimeout(() => resolve(), s))

const createMask = () => {
	const loadingMask = document.createElement('div')
	loadingMask.classList.add('loader-mask')

	const spinner = document.createElement('div')
	spinner.classList.add('loader')
	loadingMask.appendChild(spinner)

	return loadingMask
}

export const loadDirective = {
	// 指令的生命周期钩子函数：更新时
	async updated(el: HTMLElement, binding: any, vnode, prevVnode) {
		if (binding.oldValue === binding.value) return
		if (binding.value) {
			const loadingMask = createMask()
			loadingMask.classList.add('fade-in')

			el.classList.add('loader-parent--relative')
			el.appendChild(loadingMask)

			await sleep(300).then(() => loadingMask.classList.remove('fade-in'))
		} else {
			const loadingMask = el.querySelector('.loader-mask')
			loadingMask?.classList.add('fade-out')
			await sleep(300)
				.then(() => el.removeChild(loadingMask))
				.then(() => el.classList.remove('loader-parent--relative'))
		}
	}
}

export default {
	install(app: App) {
		app.directive('load', loadDirective)
	}
}
```

loadDirective 对象就是定义自定义指令的配置。

| 钩子函数                                       | 描述                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| created(el, binding, vnode){}                  | 在绑定元素的 attribute 前或事件监听器应用前调用        |
| beforeMount(el, binding, vnode){}              | 在元素被插入到 DOM 前调用                              |
| mounted(el, binding, vnode){}                  | 在绑定元素的父组件及他自己的所有子节点都挂载完成后调用 |
| beforeUpdate(el, binding, vnode， prevVnode){} | 绑定元素的父组件更新前调用                             |
| updated(el, binding, vnode，prevVnode){}       | 在绑定元素的父组件及他自己的所有子节点都更新后调用     |
| beforeUnmount(el, binding, vnode){}            | 绑定元素的父组件卸载前调用                             |
| unmounted(el, binding, vnode){}                | 绑定元素的父组件卸载后调用                             |

| 参数       | 描述                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| el         | 指令绑定的元素                                                                    |
| binding    | 对象                                                                              |
| -value     | 传递给指令的值                                                                    |
| -oldValue  | 之前的值，仅在 beforeUpdate 和 updated 中可用。                                   |
| -arg       | 传递给指令的参数 (如果有的话)。                                                   |
| -modifiers | 一个包含修饰符的对象 (如果有的话)。                                               |
| -instance  | 使用该指令的组件实例。                                                            |
| -dir       | 指令的定义对象。                                                                  |
| vnode      | 代表绑定元素的底层 VNode。                                                        |
| prevVnode  | 代表之前的渲染中指令所绑定元素的 VNode。仅在 beforeUpdate 和 updated 钩子中可用。 |

实现逻辑很简单，v-load 我们只需要用到 updated 钩子。createMask 方法创建遮罩层容器和 loading 主体，分别加上 loader-mask 和 loader 类。
我们只需要在 updated 中判断 binding.value，如果是 true，为 createMask 返回的 el 添加显示过渡 class，给绑定元素添加 loader-parent--relative 类，然后将遮罩层容器添加到绑定元素上即可。
如果是 false，在绑定元素上查找遮罩层元素，为它添加隐藏过渡 class，在等待动画执行时间后移除遮罩层容器，然后移除绑定元素是相对定位 loader-parent--relative 类即可。

> 因为 updated 在父组件和子组件更新时都会调用，即如果页面上使用了 x 次指令，那么在你修改一次值时就会调用 x 次 updated 钩子，所以需要 if (binding.oldValue === binding.value) return 判断是否是值变动的元素。

> 还需要注意，因为只使用了 updated 钩子，如果在一开始就赋值 true，那么不会有 loading 效果，因为没有在 created 钩子中做处理。

## 3. 全局注册指令和局部注册指令

#### 全局注册

因为在 load.ts 中定义了一个有 install 方法的对象，它已经通过 app 注册了指令，所以我们在 main.ts 中使用 app.use 即可全局注册。

```typescript
... other code
const app = createApp(App)

app.use(loadDirective)
... other code
```

#### 局部注册

Vue3 在 setup 语法糖中，任何以 v 开头的驼峰式命名的变量都可以被用作一个自定义指令，我们导入定义自定义指令的 loadDirective 配置即可。

```Vue
// xxx.vue
<script setup lang="ts">
import { loadDirective } from 'directives/load'
const vLoad = loadDirective
</script>
```

## 4. 指令使用

```Vue
<template>
	<div class="w-20 h-20 bg-black" v-load="loading">loading</div>
	<button @click="change">切换loading</button>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const loading = ref<boolean>(false)

const change = () => {
	loading.value = !loading.value
}
</script>
```

v-loading 效果已经实现，如果需要使用其他效果也可参考该文章。
