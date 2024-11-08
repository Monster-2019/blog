---
title: 'Flutter 实现 Deeplink'
date: 2024-09-17T14:03:55+08:00
description: 'Flutter实现Deeplink，在用户点击时跳转App'
categories:
    - 前端开发
    - Flutter
tags:
    - Flutter
    - Deeplink
    - go_router
    - 移动开发
---

如今各大厂商的 App 都实现了 Deeplink，Deeplink 带来的好处有很多，比如提高用户体验，提高转化率，跨平台体验，提高曝光度等。接下来通过 go_router 实现 Flutter 的 Deeplink。

## 1. 安装 go_router 定义路由

```bash
flutter pub add go_router
```

```dart
// main.dart

...
return MaterialApp.router(
    routerConfig: GoRouter(
        initialLocation: "/",
        routes: [
            GoRoute(
                path: "/",
                builder: (context, state) => const HomeScreen(),
            ),
            GoRoute(
                path: "/detail/:detailId",
                builder: (context, state) => const DetailScreen(detailId: state.pathParameters["detailId"] ?? ""),
            ),
            GoRoute(
                path: "/login",
                builder: (context, state) => const LoginScreen(),
            ),
        ]
    )
)
...

```

使用 go_router，需要将 MaterialApp 改为 MaterialApp.router，他接受一个 routerConfig，这里 GoRouter 定义较简单，仅定义路由和初始路由。go_router 会在触发 Deeplink 时自动帮我们处理 Deeplink 跳转问题。

## 2. 添加配置支持 Deeplink

Android 修改 android/app/src/main/AndroidManifest.xml 文件

```dart
<activity
    ...
    <meta-data
        android:name="flutter_deeplinking_enabled"
        android:value="true"
    />
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="example.com" />
    </intent-filter>
    ...
</activity>
```

配置完成后，我们可以在应用设置中添加支持连接来进行测试，分别使用以下两条命令：

```dart
adb shell am start -a android.intent.action.VIEW -d "https://example.com" com.example.flutter_deeplink
adb shell am start -a android.intent.action.VIEW -d "https://example.com/detail/1" com.example.flutter_deeplink
```

效果如下

{{< image src="https://s2.loli.net/2024/09/17/HgcduBlUPZ4D3Mf.gif" style="width: 370px;">}}
{{< image src="https://s2.loli.net/2024/09/17/93nJKXCZpuFHNEQ.gif" style="width: 370px;">}}

IOS 修改配置参考[https://docs.flutter.dev/cookbook/navigation/set-up-universal-links](https://docs.flutter.dev/cookbook/navigation/set-up-universal-links)

## 3. 验证链接，自动添加支持链接

Android 配置如下：

我们需要使用以下命令通过应用签名得到 SHA256 指纹

```bash
keytool -list -v -keystore <your_keystore_file> -alias <your_alias_name> -storepass <your_keystore_password>
```

-   your_keystore_file；应用签名得到的 jks 文件
-   your_alias_name：与生成 jks 文件时填写的一致
-   your_keystore_password：与生成 jks 文件时输入的密码的一致

你将会得到类似下面这样的输出

```bash
Certificate fingerprints:
         SHA1: 63:D3:DF:22:98:33:5E:3E:DF:63:B9:92:02:19:B7:DA:F0:34:87:D4
         SHA256: F6:6F:2A:7D:82:2E:9B:2F:51:72:25:2A:FC:33:FE:8E:AB:26:44:3B:2B:3F:64:87:1E:24:92:B3:50:ED:73:1F
Signature algorithm name: SHA256withRSA
Subject Public Key Algorithm: 2048-bit RSA key
Version: 3
```

创建 assetlinks.json 文件，放在你的服务器上，并且可以通过https://example.com/.well-known/assetlinks.json访问

```json
// assetlinks.json
[
	{
		"relation": ["delegate_permission/common.handle_all_urls"],
		"target": {
			"namespace": "android_app",
			"package_name": "com.example.yourapp",
			"sha256_cert_fingerprints": [
				"F6:6F:2A:7D:82:2E:9B:2F:51:72:25:2A:FC:33:FE:8E:AB:26:44:3B:2B:3F:64:87:1E:24:92:B3:50:ED:73:1F"
			]
		}
	}
]
```

修改 package_name 为你的包名，sha256_cert_fingerprints 就写上面的得到的 SHA256 指纹

你可以使用下面的命令来验证你的应用和配置的网址关联状态

```bash
adb shell pm get-app-links com.example.your_package_name
```

```bash
# 输出消息
com.example.pkg:
    ID: 01234567-89ab-cdef-0123-456789abcdef
    Signatures: [***]
    Domain verification state:
      example.com: verified
      sub.example.com: legacy_failure
      example.net: verified
      example.org: 1026
```

如果网址后面是 verified，则表示该网站和你的应用已经关联，但它有更新延迟，不一定不是 verified 就无法跳转。

verified 状态在安装 App 后，它会自动将支持的网址添加到应用的支持链接中。

IOS 配置参考[https://docs.flutter.dev/cookbook/navigation/set-up-universal-links](https://docs.flutter.dev/cookbook/navigation/set-up-universal-links)

## 4. 最终效果展示

![https://s2.loli.net/2024/09/17/X6klsjO3qRtIabN.gif](https://s2.loli.net/2024/09/17/X6klsjO3qRtIabN.gif)
