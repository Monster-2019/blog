---
title: "使用cloudflare 域名ssl认证"
date: 2022-06-16T13:51:46+08:00
description: 首先我们看下HTTP和HTTPS协议的区别
tags:
- HTTPS
- Cloudflare
---

首先我们看下HTTP和HTTPS协议的区别
- HTTP（超文本传输协议） 采用分布式、协作式和超媒体信息系统的应用层协议，与服务器端通信通常采用TCP协议，默认端口是80
- HTTPS（超文本传输安全协议） 在HTTP的基础上使用了SSL/TLS进行加密进行身份认证，提高了传输的安全性，默认端口是443
为什么推荐使用HTTPS，因为HTTP的数据传输是明文的，在交易、支付、隐私等方面都不安全，隐私容易泄露，而且SSL本身就能防止一些攻击手段，因此更推荐大家使用HTTPS协议。

##### 配置SSL
首先我们从Cloudflare官网注册登录[https://www.cloudflare.com/zh-cn/](https://www.cloudflare.com/zh-cn/)，登录后在主页上添加你的域名

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220616144057.png)

添加后就可以在网站上看到你的域名，点进去

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220616144207.png)

我们可以在侧边栏DNS菜单中看到Cloudflare提供的解析服务器地址，在你的域名服务商的控制面板里把DNS替换掉，他并不是立即生效的，所以配置后需要过一段时间后再来验证。

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220616144712.png)
![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220616145014.png)

接下来就是开启HTTPS了

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220616145635.png)

需要注意的是，你使用Cloudflare的DNS时，域名的解析也需要在Cloudflare里进行配置，原域名服务商的解析就失效了。

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220616150127.png)

配置完成后，我们访问http协议的域名时，Cloudflare会帮我们重定向到HTTPS协议。如果服务器使用了nginx，我们也只需要监听80端口。