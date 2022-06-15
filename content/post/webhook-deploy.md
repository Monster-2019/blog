---
title: "使用webhook自动部署hugo博客"
date: 2022-06-14T16:33:31+08:00
---

如今有很多静态博客框架，例如hexo、hugo、vuepress等，都是编译后生成纯静态文件的。但在部署的支持上并不是太优化，网上大部分都是部署到github page上，但作为IT人，肯定是想部署到自己的服务器上的，今天就给大家介绍通过github的webhook来实现静态博客的自动部署。

#### webhook自动部署原理

首先我们需要明白，webhook本身是并没有自动部署的功能的，他只是一个钩子，当我们在本地推送到远程仓库的时候，它会触发发出一个post请求，我们需要服务来接收这个请求，然后使用脚本来进行自动化部署。

#### webhook服务

可以用你熟悉的语言来注册服务，我这里使用node和koa2框架

###### 1. 创建项目
```
mkdir webhook

cd webhook

npm init

git init

touch.index.js
```
执行以上命令后，你会看到以下目录结构
```
wekhook
├── index.js
├── package.json
```

###### 2. 安装相关依赖
```
npm install child_process koa util pm2

npm install nodemon --save-dev
```
- child_process 可以让我们执行系统命令
- koa node框架库，提供一些方便使用的api
- util 工具库，用于弥补js功能上的不足
- pm2 进程管理库，可以在项目部署后管理项目
- nodemon 热重载库，避免文件修改需要重新启动

###### 3. webhook api

通过koa框架搭建一个简易的api服务

```
import Koa from 'koa'
import util from 'util'
import { exec as oexec } from 'child_process'
const exec = util.promisify(oexec)

const app = new Koa()
app.use(async (ctx) => {
    const execName = ctx.originalUrl.substring(1) || 'blog'
    console.log(`${new Date()} ${execName} webhook trigger! start deploy`);
    await exec(`sh ./sh/${execName}.sh`)
    console.log(`${new Date()} ${execName} webhook deploy successly`);
    ctx.response.status = 200
})

app.listen(4001)
```
api服务的代码并不多，主要操作就是启了一个node服务暴露在4001端口，为了减小项目体积，此处使用的是中间件来代替路由，通过解析url参数来判断是哪个webhook消息，在第十行我们会执行相应的脚本，因为相对于其他脚本语言，bash用的比较多点，此处就使用的是bash。

为了方便后续部署，我们添加script命令
```
// package.json
{
    ...
    scripts: {
        ...
        "start": "nodemon index.js",
        "pm2": "pm2 -n webhook start index.js --watch"
    }
}
```
start是我们在开发时热重载使用的
pm2是我们部署时执行的命令，-n参数命名进程名，start 启动入口文件名称，--wacth监听项目的文件变化，自动热更新


接下来我们看sh脚本部分代码

```
#!/bin/bash

HOME_PATH="/home/www"
DIR="blog"
GIT_URL="git@github.com:Monster-2019/blog.git"
cd $HOME_PATH

if [ ! -d $DIR ]; then
    git clone $GIT_URL --recursive && cd $DIR && hugo --minify
    
else
    cd $DIR
    git pull origin main && git submodule update --init --recursive && hugo --minify
fi
```
第一行声明此文件是bash脚本，3-5行定义变量，HOME_PATH是你的项目在服务器上的父级目录，DIR是项目名称，GIT_URL是blog的git克隆地址。

    1. 首先我们进入父级记录

    2. 判断是否存在相关项目，如果没有我们就在当前目录克隆项目仓库以及项目中相关的子仓库，克隆完后进入项目目录执行相关博客框架的打包命令

    3. 如果已经有相关项目，我们直接拉取最新的代码，并更新子仓库执行打包命令

    4. 在执行打包命令后，会生成public文件夹，这就是我们的最终访问的文件目录

接下来我们就需要在我们的服务器上部署api服务，让webhook来触发
```
cd /home/www

git clone xxx

npm install

npm run pm2
```


###### 4. 使用nginx反代
首先是api的反代，如下：
```
server {
    listen          80;
    server_name     xxx;

    add_header Access-Control-Allow-Methods *;
    add_header Access-Control-Allow-Credentials false;
    add_header Access-Control-Allow-Origin $http_origin;
    add_header Access-Control-Allow-Headers
    $http_access_control_request_headers;

    location / {
            proxy_pass  http://127.0.0.1:4001; # 转发规则
            proxy_set_header Host $proxy_host; # 修改转发请求头，让8080端口的应用可以受到真实的请求
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
server_name 修改为你想要webhook请求的域名，当访问该域名时会代理到服务器上的4001端口上，就是我们上面部署api服务的地址，触发相关hook


然后是blog的反代，如下：
```
server {
    listen          80;
    server_name     xxx;

    add_header Access-Control-Allow-Methods *;
    add_header Access-Control-Allow-Credentials false;
    add_header Access-Control-Allow-Origin $http_origin;
    add_header Access-Control-Allow-Headers
    $http_access_control_request_headers;

    location / {
            alias /home/www/blog/public/;
            index index.html index.htm;
    }
}
```
server_name 修改为你的博客域名，在访问博客时，他会显示/home/www/blog/public/目录下的index.html文件

###### 5. github配置webhook
![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220615090345.png)
Payload URL 配置刚才nginx配置的域名就行，配置好后每次提交都会在Recent Deliveries中看到历史Webhook触发时间，触发不同项目的webhook通过域名后面的目录控制，如xxx/blog、xxx/hook等

