---
title: '利用husky钩子提交自动格式化'
date: 2022-06-13T16:45:42+08:00
description: 多人协作开发除了共同修改文件触发git冲突，还经常有实现相同却因为代码风格不同而造成的diff问题，虽然不会有什么大影响，但每次人工手动merge也是很麻烦的一件事，因此我们通过husky配合Eslint、Prettier来实现自动格式化统一代码风格
categories:
    - 前端开发
    - 工具
tags:
    - Eslint
    - Prettier
    - Husky
    - Git Hook
---

多人协作开发除了共同修改文件触发 git 冲突，还经常有实现相同却因为代码风格不同而造成的 diff 问题，虽然不会有什么大影响，但每次人工手动 merge 也是很麻烦的一件事，因此我们通过 husky 配合 Eslint、Prettier 来实现自动格式化统一代码风格

#### 安装依赖

```
npm install eslint eslint-config-prettier eslint-plugin-prettier eslint-plugin-vue prettier --save-dev

npm install husky lint-staged --save-dev
npx husky install // 安装完成后还需要install初始化
```

-   eslint js 语法检查
-   eslint-plugin-vue vue 中 js 语法检查
-   eslint-config-prettier eslint-plugin-prettier 优先使用 prettier 配置格式化
-   husky lint-staged git 钩子
-   prettier 代码风格格式化

#### ESlint Prettier 配置

```
// .eslintrc.js
module.exports = {
  root: true,
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  parser: 'vue-eslint-parser',
  extends: [
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  rules: {
    'vue/multi-word-component-names': 0,
    'vue/no-mutating-props': 0
  },
}
```

```
// .prettierrc
{
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": true,
    "semi": false,
    "singleQuote": false,
    "bracketSpacing": true,
    "arrowParens": "avoid",
    "trailingComma": "es5"
}
```

以上配置仅供参考

#### husky 配置

```
npx husky add .husky/pre-commit
```

```
// pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```
// package.json
{
    ...
    "scripts": {
        "prepare": "husky install"
    }
    ...
    "lint-staged": {
        "src/**": [
            "prettier --config .prettierrc --write",
            "eslint --fix",
            "git add"
        ]
    }
}
```

配好以上内容后，当我们在 commit 的时候 会执行 lint-staged 任务，针对 src 目录下的文件 使用 prettier 配置文件进行格式化，以及使用 eslint 进行修复，最后提交成功。如果存在无法自动修复的内容，会中止提交，并在终端中显示无法通过 eslint 检测的内容，待修改后再次提交。
