---
title: "jsdelivr + github 做CDN加速"
date: 2022-06-28T15:00:31+08:00
description: 前端为了减小项目体积，通常会采用CDN的方式引用资源来达到这个目的，提高加载速度的同时也减小项目体积。现在很多云服务也提供了CDN服务，我们在这里通过jsdelive这个开源CDN服务来制作自己的CDN库
tags:
- Github
---

前端为了减小项目体积，通常会采用CDN的方式引用资源来达到这个目的，提高加载速度的同时也减小项目体积。现在很多云服务也提供了CDN服务，我们在这里通过jsdelive这个开源CDN服务来制作自己的CDN库

首先我们要先创建一个github仓库

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220628151229.png)

然后我们可以把资源文件上传到这个仓库上，我们上传一个头像上去

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220628153325.png)

接下来我们可以用[https://cdn.jsdelivr.net/gh/Monster-2019/cdn/avatar.jfif](https://cdn.jsdelivr.net/gh/Monster-2019/cdn/avatar.jfif)访问这个头像

引用方式为 https://cdn.jsdelivr.net/gh/x1/x2/x3。其中x1是你的github名称，x2为项目名称，x3为资源路径

如果你发布了版本，还可以在项目名称后面加版本号引用指定版本资源，没有则默认最新的。如https://cdn.jsdelivr.net/gh/Monster-2019/cdn@1.0/avatar.jfif