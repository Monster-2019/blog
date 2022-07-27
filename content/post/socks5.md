---
title: 'Socks5搭建'
date: 2022-07-01T14:17:09+08:00
tag:
- Socks5
- Linux
---

Socks5 脚本有很多，我目前使用的是 [danted](https://github.com/Lozy/danted.git)，快速上手，简单易懂

1. 连接到 ssh 并进入到你想要的脚本安装目录

```
[root@monster-cone ~]# cd /usr/local/src
```

2. 下载安装脚本

```
[root@monster-cone src]# wget --no-check-certificate https://raw.github.com/Lozy/danted/master/install.sh -O install.sh
[root@monster-cone src]# sh ./install.sh
```

3. 安装后默认就是开启状态，我们加上软链接方便命令操作

```
[root@monster-cone src]# ln -s /etc/init.d/sockd /usr/bin/sockd
```

4. 查看相关配置按自己需求修改

```
[root@monster-cone src]# sockd conf
==> /etc/danted/sockd.conf <==
# Generate by sockd.info
# Generate interface 172.17.0.6
internal: 172.17.0.6  port = 915
external: 172.17.0.6

# Generate interface 172.17.0.12
internal: 172.17.0.12  port = 915
external: 172.17.0.12

# Generate interface 172.18.0.1
internal: 172.18.0.1  port = 915
external: 172.18.0.1

external.rotation: same-same
method: pam none
clientmethod: none
user.privileged: root
user.notprivileged: sockd
logoutput: /var/log/sockd.log

client pass {
        from: 0.0.0.0/0  to: 0.0.0.0/0
}
client block {
        from: 0.0.0.0/0 to: 0.0.0.0/0
}
pass {
        from: 0.0.0.0/0 to: 0.0.0.0/0
        protocol: tcp udp
        method: pam
        log: connect disconnect
}
block {
        from: 0.0.0.0/0 to: 0.0.0.0/0
        log: connect error
}
```

第一行是配置文件是目录
安装后默认会识别网卡中的所有内网地址自动配置，因为我有多个内网，sockd 配置文件中也会有多个配置，默认端口都是 2016，可以自己修改，修改后需要使用 sockd restart 命令重启

5. 添加用户

```
[root@monster-cone src]# sockd adduser username password
```

username 和 password 是用 socks 代理的凭证，如果 username 已经存在会更新密码。可以添加多个用户给不同的人使用，删除用户使用 deluser 参数

6. 开放端口

进入实例的相关安全组添加入站规则，TCP端口为sockd配置的端口
![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220701150952.png)

7. socks5 连接验证

可以使用 socks5 代理软件来验证，为了方便这里就使用 TIM 来验证

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220701145218.png)

选择 Socks5 代理，填上公网 ip 地址、端口、用户名、密码，点击测试

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20220701145401.png)

出现以上图片就表示成功了，还有一些其他命令，可以通过 sockd 查看

```
[root@monster-cone src]# sockd
 Usage: /etc/init.d/sockd {start|stop|restart|reload|status|state|adduser|deluser|tail|conf|update}
```
