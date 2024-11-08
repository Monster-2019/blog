---
title: '部署MinIO构建自己的对象存储服务'
date: 2024-11-08T13:18:32+08:00
description: 使用Docker部署单机版MinIO，并通过presignedPutObject接口上传图片
categories:
    - 云存储
tags:
    - 对象存储
    - MinIO
    - Docker
    - Nginx
---

目前有很多免费的图床服务可以提供给个人使用，但文件类型局限于图片。下面为大家介绍单机版 MinIO 服务部署，适用于个人应用使用。

## 1. 部署 MinIO

```yaml
# docker-compose.yaml
version: '3'

services:
    minio:
        image: minio/minio:latest
        container_name: minio
        restart: always
        ports:
            - '9000:9000'
            - '9001:9001' # MinIO 控制台
        environment:
            MINIO_ROOT_USER: xxxx # 更改为你自己的用户名
            MINIO_ROOT_PASSWORD: xxxx # 更改为你自己的密码
            MINIO_SERVER_URL: https://xxx.xxx.com
            MINIO_BROWSER_REDIRECT_URL: https://xxx-console.xxx.com
        volumes:
            - ./data:/data # 数据存储目录
        command: server /data --console-address ":9001" # 启动命令
        healthcheck:
            test: ['CMD', 'mc', 'ready', 'local']
            interval: 5s
            timeout: 5s
            retries: 5
```

-   Docker 容器要暴露两个接口，9000 提供给 API 使用，9001 提供给控制台使用
-   MINIO_ROOT_USER 和 MINIO_ROOT_PASSWORD 是登录控制台的用户名和密码
-   MINIO_SERVER_URL 和 MINIO_BROWSER_REDIRECT_URL 是 API 和控制台的访问域名，后续还要配置 nginx
-   healthcheck 检查 MinIO 容器的健康状态

## 2. 配置宿主机 nginx

这一步很简单，直接复制然后修改为 docker-compose.yaml 中的域名即可。

```conf
server {
    server_name xxx-console.xxx.com;
    ignore_invalid_headers off;
    client_max_body_size 200m;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass http://127.0.0.1:9001; # MinIO 控制台默认端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;
        real_ip_header X-Real-IP;
        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        chunked_transfer_encoding off;
    }
}

server {
    server_name xxx.xxx.com;
    ignore_invalid_headers off;
    client_max_body_size 200m;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass http://127.0.0.1:9000; # MinIO API默认端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;
    }
}
```

> **注意:** http 还是 https 需要视自己情况调整，我这里 nginx 使用了插件配置证书，所以没有 listen 443;

## 3. 配置 MinIO

#### 创建存储桶

到这一步，我们已经可以通过上面的https://xxx-console.xxx.com域名访问到控制台了。如下：

![image](https://s2.loli.net/2024/11/08/CTdIbZWf5LmNGY1.jpg)

在登录后，我们可以通过菜单栏 Buckets -> Create Bucket 创建一个存储桶。

![image](https://s2.loli.net/2024/11/08/SXW6ydBVb4Y8tmi.png)

#### 公共访问权限

然后我们配置访问权限，Buckets -> 刚刚创建的存储桶 -> Anonymous

![image](https://s2.loli.net/2024/11/08/HDTidw4oR6WzB32.jpg)

该规则表示任何人都可以访问这个存储桶的文件，仅可以上传带有 upload 前缀的文件，如果你不想匿名人上传可以删除 upload 这条规则。

#### API 上传 Token

创建 Access Key

![image](https://s2.loli.net/2024/11/08/eXgbBY3O5NUiGyu.jpg)

你需要记住 Access Key 和 Secret Key，后续不能再查看了，忘记只能重新创建

## 4.后端通过 Access Key 创建预上传 URL，提供给客户端上传

通过 MinIO 提供的 SDK，使用生成的 Access Key 和 Secret Key 调用接口即可。这里使用 Node SDK 做示范。

```javascript
const dotenv = require('dotenv')
const Minio = require('minio')

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env'
dotenv.config({ path: envFile })

const minioClient = new Minio.Client({
	endPoint: 'xxx.xxx.co', // 之前配置的api域名
	port: 443, // https 443  http 80
	useSSL: true, // 是否使用HTTPS
	accessKey: process.env.MINIO_ACCESS_KEY, // 上一步生成的Access Key
	secretKey: process.env.MINIO_SECRET_KEY // 上一步生成的Secret Key
})

const presignedUrl = await minioClient.presignedPutObject('bucketName', `objectName`, expiry)
```

presignedPutObject 接受三个参数

-   bucketName：存储桶名称，就是上面创建的存储桶
-   objectName：存储对象的名称，这个名字代表上传后的文件名称，不受后面选择的文件名称影响。如果要指定存储的路径则带上路径。
-   expiry：presignedUrl 过期时间，默认为 7 天，单位秒。

## 5. 使用 presignedUrl 上传文件

推荐使用 Postman 测试，然后用 Postman 转换为相关的代码。如下所示：

![image](https://s2.loli.net/2024/11/08/o8LC5cpaTf9z6Uq.jpg)

需要注意的一点是 body 必须是 binary 类型，否则可能响应码为 200，但文件并不在存储桶中。
