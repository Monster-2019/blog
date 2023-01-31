---
title: 'Ubuntu环境搭建脚本'
date: 2022-09-08T17:51:55+08:00
description: 快速搭建Ubuntu前端开发环境脚本
tags:
    - Ubuntu
    - Bash
---

{{< code language="bash" title="bash.sh" id="1" expand="Show" collapse="Hide" isCollapsed="false" >}}

#!/bin/sh

sudo sed -i "s@http://.*archive.ubuntu.com@https://mirrors.tuna.tsinghua.edu.cn@g" /etc/apt/sources.list
sudo sed -i "s@http://.*security.ubuntu.com@https://mirrors.tuna.tsinghua.edu.cn@g" /etc/apt/sources.list
sudo apt-get update
echo "start install development environment"

echo "start install git"
sudo apt-get install git
echo "end instasll git"

echo "start install node"
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "end install node"

echo "start install docker"
sudo apt-get install -y \
     ca-certificates \
     curl \
     gnupg \
     lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo apt-get install -y docker-compose-plugin
echo "end install docker"

echo "start install nginx"
sudo apt install -y nginx
echo "end install nginx"

{{< /code >}}
