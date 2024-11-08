---
title: Vue项目格式化
date: 2022-05-25T18:16:27+08:00
description: VsCode配置保存自动格式化Vue文件
tags:
    - VsCode
    - Vue
	- ESLint
	- Prettier
	- Vetur
---

VsCode 配置保存自动格式化 Vue 文件

<!--more-->

```
{
  // 配置vscode默认使用bash控制台
	"terminal.integrated.shell.windows": "D:\\dev\\Git\\bin\\bash.exe",
  // git安装路径
	"git.path": "D:\\dev\\Git\\bin\\git.exe",

	// vetur设置
	"vetur.format.defaultFormatter.html": "js-beautify-html",
	"vetur.format.defaultFormatter.js": "vscode-typescript",
	"vetur.format.defaultFormatter.scss": "prettier",
	"vetur.format.defaultFormatterOptions": {
		"js-beautify-html": {
		"wrap_attributes": "force-expand-multiline"
		},
		"prettier": {
			"singleQuote": true,
			"semi": true
		}
	},
	"vetur.format.options.tabSize": 4,
	"vetur.format.options.useTabs": true,

	// eslint配置
	"eslint.validate": ["javascript", "vue", "html"],

	// editor配置
	"editor.formatOnSave": false,
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	},
	"editor.tabSize": 4,
	"editor.wordWrapColumn": 100,
	"editor.fontSize": 16,
	"launch": {
		"configurations": [],
		"compounds": []
	}
}
```
