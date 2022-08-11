---
title: Vue-cli3项目模板
date: 2022-05-25T18:16:27+08:00
categories: Vue
description: Webpack现在是Vue项目打包的首选，也是vue-cli3脚手架的默认打包工具，在此分享出自己基于Vue-cli3创建的项目基础配置，为大家解决webpack配置复杂问题。
tags: 
- Vue
---
Webpack现在是Vue项目打包的首选，也是vue-cli3脚手架的默认打包工具，在此分享出自己基于Vue-cli3创建的项目基础配置，为大家解决webpack配置复杂问题。

### 准备工作

#### 创建项目
```
$ vue create project-name || vue ui
```

#### 安装依赖
```
$ npm install
```

#### 启动服务
```
$ npm run serve
```

#### 生产环境打包
```
$ npm run build
```


<!--more-->

### 项目目录

    ├── public                      静态模板资源文件
    ├── src                         项目文件
    ├──|── api                      请求接口
    ├──|── assets                   静态文件 img 、css 、js    
    ├──|── components               全局组件
    ├──|── filters                  过滤器
    ├──|── local                    i18n翻译
    ├──|── plugin                   插件
    ├──|── router                   路由
    ├──|── store                    vuex 数据管理
    ├──|── utils                    工具文件
    ├──|── views                    页面文件
    ├──|── App.vue                  实例文件
    ├──|── main.js                  入口文件
    ├──|── permission.js            路由权限拦截
    ├──|── settings.js              组件配置文件
    ├── .browserslistrc             项目兼容浏览器版本
    ├── .eslintignore               eslint忽略文件
    ├── .eslintrc.js                eslint配置文件
    ├── .gitignore                  git忽略文件
    ├── babel.config.js             babel配置文件
    ├── package.json                项目配置文件
    ├── vue.config.js               config 配置文件


### vue.config.js配置功能

#### 本地代理
```
devServer: {
    port: 8080, // 端口号
    open: false, //配置自动启动浏览器
    overlay: {
        warnings: false,
        errors: false,
    },
    proxy: 'http://127.0.0.1:8080/'
},
```

#### configureWebpack开启Gzip压缩
```
configureWebpack: config => {
    config.plugins.push(
    new CompressionWebpackPlugin({
        algorithm: 'gzip',
        test: /\.(js|scss|css|vue)$/,  //匹配文件
        threshold: 10240,  //压缩大小超过10K的文件
        minRatio: 0.8, // 压缩比
    })
}
```

#### cdn配置
```
chainWebpack(config) {
    const cdn = {
        css: [
            '//unpkg.com/element-ui@2.10.1/lib/theme-chalk/index.css'
        ],
        js: [
            // vue must at first!
            'https://cdn.staticfile.org/vue/2.6.9/vue.min.js',
            // vue router
            'https://cdn.staticfile.org/vue-router/3.0.2/vue-router.min.js',
            // element-ui
            'https://unpkg.com/element-ui@2.10.1/lib/index.js'
        ],
    }
    config.plugin('html').tap(args => {
        args[0].cdn = cdn
        return args
    })
}

// html模板
<% for(var css of htmlWebpackPlugin.options.cdn.css) { %>
    <link rel="stylesheet" href="<%=css%>">
<% } %>
<% for(var js of htmlWebpackPlugin.options.cdn.js) { %>
    <script src="<%=js%>"></script>
<% } %>

// 如使用cdn加载，则需要配置externals避免两次引用
configureWebpack: config => {
    config.externals = {
        'vue': 'Vue',
        'vue-router': 'VueRouter',
        'element-ui': 'element-ui'
    }
}
```

#### 图片压缩
```
chainWebpack: config => {
	config.module
		.rule('images')
		.test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
		.use('image-webpack-loader')
		.loader('image-webpack-loader')
		.options({ bypassOnDebug: true })
}
```

#### gitHook配置，代码语法检测
```
"gitHooks": {
    "pre-commit": "lint-staged"
},
"lint-staged": {
    "*.{js,jsx,vue}": [
        "vue-cli-service lint",
        "git add"
    ]
}
```