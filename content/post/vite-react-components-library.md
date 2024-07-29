---
title: '基于Vite + React + TypeScript + TailwindCss 构建React组件'
date: 2024-07-29T21:06:15+08:00
description: 基于Vite + React + TypeScript + TailwindCss 构建React组件
tags:
    - Vite
    - React
    - TypeScript
    - Rollup
    - TailwindCss
---

使用 Vite + React + TypeScript + Tailwind CSS 技术栈封装一个 React 组件

#### 1. 使用 Vite 创建项目

```bash
$ npm create vite@latest blog-demo --template react-swc-ts
√ Select a framework: » React
√ Select a variant: » TypeScript + SWC
```

#### 1. 添加 Tailwind CSS

###### 安装

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

###### 配置

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {}
    },
    plugins: []
}
```

```js
// postcss.config.js
export default {
    plugins: {
        tailwindcss: {},
        autoprefixer: {}
    }
}
```

```css
/* style.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### 2. 封装我们的组件

我们在 src/components 目录下封装一个简单的 button 组件

```tsx
// MyButton.tsx
import { FC } from 'react'
import './index.css'

export interface MyButtonProps {
    onClick?: () => void
    children: string
}

const MyButton: FC<MyButtonProps> = ({ onClick, children }) => {
    return (
        <button className="py-4 px-6 bg-blue-500 text-white" onClick={onClick}>
            {children}
        </button>
    )
}

export default MyButton
```

```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### 3.打包和 npm 发布

###### 编写入口文件导出我们的组件和 TS 声明

```ts
// src/index.ts
import MyButton, { MyButtonProps } from './components/MyButton'

export default MyButton
export type { MyButtonProps }
```

###### 安装相关插件

```bash
npm i -D @types/node vite-plugin-dts
```

###### 配置 vite.config.ts 和 package.json

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, './lib/index.ts'),
            name: 'react-simple-slide-captcha',
            formats: ['es'],
            fileName: format => `index.${format}.js`
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM'
                }
            },
            plugins: [insertConsoleLog()]
        }
    },
    plugins: [
        react(),
        dts({ rollupTypes: true, include: ['./lib'], tsconfigPath: './tsconfig.app.json' })
    ]
})
```

-   在 lib 中指定文件入口，包名，包格式，文件名。
-   自定义 rollup 配置，在 rollupOptions 中排除打包 react 和 react-dom，并指定最终输出时的命名。
-   使用 react 插件支持打包 react 语法，使用 dts 将 src 目录的声明文件打包到一个单独的文件中。

```json
{
    "name": "react-button",
    "version": "1.0.0",
    "type": "module",
    "main": "./dist/index.es.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "import": "./dist/index.es.js",
            "types": "./dist/index.d.ts"
        },
        "./dist/style.css": {
            "import": "./dist/style.css"
        }
    },
    "files": ["dist"],
    ...
}
```

-   name: 包名
-   version: 版本
-   type: 包格式
-   main: 指定包入口文件
-   types: 指定包的 ts 声明文件
-   exports: 指定包的导出内容
-   files: "指定 npm 包包含的内容"

如果打包没问题就可以 npm 发布了

```bash
npm login

npm publish
```

#### 4.组件使用

```bash
npm i react-button
```

```tsx
import MyButton from 'react-button'
import 'react-button/dist/style.css'

const App = () => {
    const handleClick = () => {
        console.log('按钮点击')
    }
    return <MyButton onClick={handleClick}>My Button</MyButton>
}

export default App
```

#### 5. 优化样式引用问题

即使我们文件中有导入 style 的代码，但在打包时会删除掉，所以我们在打包后的文件中引用 style 即可。

###### 自定义 rollup 插件引入 style

```js
// vite.config.js
function insertStyle() {
    return {
        name: 'insert-style',
        renderChunk(code: any, chunk: any, options: any, meta: any) {
            return {
                code: `import "./style.css";` + code
            }
        }
    }
}

export default defineConfig({
    build: {
        ... // 其他代码
        rollupOptions: {
            ... // 其他代码
            plugins: [insertStyle()]
        }
    },
    ... // 其他代码
})
```

定义一个名为 insertStyle 的 rollup 插件，通过 renderChunk 钩子获取编译打包后的 code，然后在首行加上 style 的导入 code，在 rollupOptions 的 plugins 中使用 insertStyle 插件即可。

优点是不用再手动导入 style 文件，缺点是好像不支持 umd，暂时没有验证。
