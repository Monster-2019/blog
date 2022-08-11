---
title: "移动端自适应适配"
date: 2022-05-25T18:16:27+08:00
categories: 移动端
description: 移动端的spa应用越来越多，不同手机的分辨率和系统差异，移动端适配一直是移动端开发必须思考的一个问题，如今浏览器的特性支持也更好，适配方案也越来越多，今天给大家分享我自己的移动端vw适配。
tags:
- 移动端
- Vue
---

移动端的spa应用越来越多，不同手机的分辨率和系统差异，移动端适配一直是移动端开发必须思考的一个问题，如今浏览器的特性支持也更好，适配方案也越来越多，今天给大家分享我自己的移动端vw适配。

postcss-px-to-viewport插件是基于Postcss扩展的style转换插件，它可以将我们style里的px绝对单位转换成视口单位，视口单位有以下几个：
- vw(视口宽度)
- vh(视口高度)
- vmin(视口最小值)
- vmax(视口最大值)

我们将px转换成vw后，就可以根据设备宽度自适应模块宽度和文字大小等。这样在不同DPI的手机也有较好的用户体验。

#### 安装插件
```
$ npm install postcss-px-to-viewport --save-dev
```

#### 配置插件
我们需要在项目根目录下创建postcss.config.js文件，下面我在项目中使用的配置。
```
// postcss.config.js
module.exports = {
    plugins: {
        'postcss-px-to-viewport': {
            unitToConvert: 'px', //需要转换的单位，默认为"px"
            viewportWidth: 1125, // 视窗的宽度，对应的是我们设计稿的宽度
            unitPrecision: 3, // 指定`px`转换为视窗单位值的小数位数（很多时候无法整除）
            propList: ['*'], // 能转化为vw的属性列表
            viewportUnit: 'vw', // 指定需要转换成的视窗单位，建议使用vw
            fontViewportUnit: 'vw', //字体使用的视口单位
            selectorBlackList: ['.ignore-', '.hairlines'], //指定不转换为视窗单位的类，可以自定义，可以无限添加,建议定义一至两个通用的类名
            minPixelValue: 1, // 小于或等于`1px`不转换为视窗单位，你也可以设置为你想要的值
            mediaQuery: false, // 允许在媒体查询中转换`px`
            replace: true, //是否直接更换属性值，而不添加备用属性
            exclude: [/node_modules/], //忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
        }
    }
}
```

完成以上步骤后，我们在打包部署项目后，就可以在页面上看到所有的px单位被替换成vw等视口单位。