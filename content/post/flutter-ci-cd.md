---
title: '分享我的Flutter APP CI/CD方案'
date: 2025-03-30T12:11:20+08:00
description: 使用Github Actions 自动化构建和部署Flutter App
categories:
    - Flutter
    - CI/CD
tags:
    - Flutter
    - CI/CD
---

给大家分享我自己基于 Github Actions 的 CI/CD 自动化构建 Flutter APP，同时发布 Release 或者部署到其他应用上

## 1. Build job 搭建环境构建 APK

#### 常规检出代码

```yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
        - name: Checkout
            uses: actions/checkout@v4
```

#### 设置 Java 环境

```yml
- name: Set Up Java
    uses: actions/setup-java@v4
    with:
        distribution: "oracle"
        java-version: "17"
```

#### 设置 Flutter 版本

```yml
- name: Set Up Flutter
    uses: subosito/flutter-action@v2
    with:
        flutter-version: "3.29.2"
        channel: "stable"
```

flutter-version 对应你电脑使用的版本即可，避免其他问题

#### 缓存 Flutter 包

```yml
- name: Cache Flutter dependencies
    uses: actions/cache@v3
    with:
        path: ~/.pub-cache
        key: ${{ runner.os }}-flutter-${{ hashFiles('**/pubspec.yaml', '**/pubspec.lock') }}
        restore-keys: |
        ${{ runner.os }}-flutter-
```

#### 缓存 Gradle 包

```yml
- name: Cache Gradle dependencies
    uses: actions/cache@v3
    with:
        path: |
        ~/.gradle/caches
        ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
        ${{ runner.os }}-gradle-
```

#### 安装 Flutter 包

```yml
- name: Install Dependencies
    run: flutter pub get --offline || flutter pub get
```

默认从缓存中获取

#### 配置 Keystore

```yml
- name: Decode Keystore
    run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/app/keystore.jks
```

配置 keystore.jks，使用 base64 -w 0 keystore.jks > keystore.jks.base64 命令即可得到 base64 的 jks，将他配置到项目的 actions secrets 中。

windows 系统建议在子 ubuntu 系统中转换然后复制。

#### 配置 key.properties

```yml
- name: Create key.properties
    run: |
        echo "storePassword=${{ secrets.KEYSTORE_PASSWORD }}" > android/key.properties
        echo "keyPassword=${{ secrets.KEY_PASSWORD }}" >> android/key.properties
        echo "keyAlias=${{ secrets.KEY_ALIAS }}" >> android/key.properties
        echo "storeFile=keystore.jks" >> android/key.properties
```

将本地 key.properties 中的变量配置在 Actions secrets 中

#### 配置 env 文件

```yml
- name: Create env
    run: |
        echo "BASE_URL=${{ secrets.ENV_BASE_URL }}" > .env.prod
        echo "BASE_URL=${{ secrets.ENV_BASE_URL }}" > .env.dev
```

如果没有使用.env 文件可以忽略这一步，即使.env.dev 没有在生产环境中使用，如果在 flutter assets 中配置了也需要。

#### 构建 APK

```yml
- name: Build APK
    run: flutter build apk --release --dart-define=ENV=.env.prod
```

没有使用 env 文件可以忽略--dart-define=ENV=.env.prod

#### 重命名 APK

```yml
- name: Rename APK file
    run: mv build/app/outputs/flutter-apk/app-release.apk build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk
```

将 APK 名称改为相关的应用名，并带上版本号，不需要可以忽略

#### 上传到 Artifact，供其他 job 调用

```yml
- name: Upload Build Artifact
    uses: actions/upload-artifact@v4
    with:
        name: built-apk
        path: |
        build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk
        pubspec.yaml
```

上传刚刚的 APK 文件，因为我后续 job 需要使用到 pubspec.yaml，因此上传了该文件，不需要可忽略

到这一步构建 APK 已经完成了，我们已经得到了输出的 APK，此处只有 Android 的，如果需要其他平台的，在构建 APK 那一步加上相关命令即可

## 2. 上传 Release

#### 从 Artifact 下载 APK

```yml
release:
    needs: build
    runs-on: ubuntu-latest
    steps:
        - name: Download Build Artifact # ✅ 下载 APK 文件
          uses: actions/download-artifact@v4
          with:
              name: built-apk
              path: .
```

需要等到 build job 打包好 APK，再执行，先下载 build job 上传到 Artifact 的文件

#### 上传 Release

```yml
- name: Upload Release Asset
    uses: softprops/action-gh-release@v2
    with:
        draft: false
        files: build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk
    env:
        GITHUB_TOKEN: ${{ secrets.ACCESS_TOKEN }}
```

直接以生产版本将 APK 上传到 Release，此处 ACCESS_TOKEN 的值是账号 Developer settings - Personal access tokens - Tokens，需要 repo、workflow、packages 权限。

## 3. 上传到 minio

我的应用通过图片扫码下载 minio 的 APK。此处是我自己需求，可以替换成其他上传到应用商店或其他地方等。

#### 从 Artifact 下载 APK

```yml
upload:
    needs: build
    runs-on: ubuntu-latest
    steps:
        - name: Download Build Artifact # ✅ 下载 APK 文件
          uses: actions/download-artifact@v4
          with:
              name: built-apk
              path: .
```

#### 下载 minio 客户端

```yml
- name: Download mc
    run: |
        wget https://dl.min.io/client/mc/release/linux-amd64/mc
        chmod +x mc
```

#### 连接到 minio 客户端

```yml
- name: Configure mc
    env:
        MINIO_ACCESS: ${{ secrets.MINIO_ACCESS_KEY }}
        MINIO_SECRET: ${{ secrets.MINIO_SECRET_KEY }}
        MINIO_ENDPOINT: ${{ secrets.MINIO_ENDPOINT }}
    run: |
        ./mc alias set myminio $MINIO_ENDPOINT $MINIO_ACCESS $MINIO_SECRET
```

MINIO_ENDPOINT 为你的 minio 连接地址，MINIO_ACCESS_KEY 和 MINIO_SECRET_KEY 则在 minio 控制台创建即可

#### 获取 APK 版本

```yml
- name: Get version
    id: yq
    uses: mikefarah/yq@master
    with:
        cmd: yq -r '.version | split("+") | .[0]' 'pubspec.yaml'
```

使用 yq 库读取 pubspec.yaml 的 version 值取版本号

#### 生成相关的版本文件

```yml
- name: generate version.json
    run: |
        BUILD_TIME=$(TZ='Asia/Shanghai' date +'%Y-%m-%dT%H:%M:%SZ')
        BASE_VERSION=${{ steps.yq.outputs.result }}
        echo "{
            \"version\": \"$BASE_VERSION\",
            \"build_time\": \"$BUILD_TIME\",
            \"download_url\": \"${{ secrets.MINIO_ENDPOINT }}/${{ secrets.MINIO_BUCKET }}/XXX_${{ github.ref_name }}.apk\"
        }" > version.json
```

生成相关的 version json，可以供 APP 检查更新使用。可以扩展使用提交信息作为描述字段放在 version.json 中

#### 生成下载二维码

```yml
- name: generate qrcode
    run: |
        sudo apt update && sudo apt install -y qrencode imagemagick
        qrencode -o qrcode.png -s 10 -m 2 -l H "${{ secrets.MINIO_ENDPOINT }}/${{ secrets.MINIO_BUCKET }}/XXX_${{ github.ref_name }}.apk"
        wget https://xxx.xxx.com/logo.png
        convert logo.png -resize 80x80 -bordercolor white -border 8x8 logo_with_border.png
        convert qrcode.png logo_with_border.png -gravity center -composite download_qr.png
```

使用 qrencode 和 imagemagick 库生成二维码，并使用 imagemagick 添加 logo。

#### 上传到 minio

```yml
- name: Upload using mc
    run: |
        ./mc cp build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk "myminio/${{ secrets.MINIO_BUCKET }}/"
        ./mc cp version.json "myminio/${{ secrets.MINIO_BUCKET }}/"
        ./mc cp download_qr.png "myminio/${{ secrets.MINIO_BUCKET }}/"
```

将 APK、version.json、download_qr.png 上传到 minio，至此，打包部署全部完成。web 端因为二维码图片地址是不变的，只是二维码不一样，web 可以不动。APP 端也可以通过获取 version.json 判断是否需要更新。

## 4. 完整文件

```yml
name: CI/CD Build Flutter APP

on:
    push:
        tags:
            - 'v*'

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout
              uses: actions/checkout@v4

            - name: Set Up Java
              uses: actions/setup-java@v4
              with:
                  distribution: 'oracle'
                  java-version: '17'

            - name: Set Up Flutter
              uses: subosito/flutter-action@v2
              with:
                  flutter-version: '3.29.2'
                  channel: 'stable'

            # 缓存 Flutter 依赖
            - name: Cache Flutter dependencies
              uses: actions/cache@v3
              with:
                  path: ~/.pub-cache
                  key: ${{ runner.os }}-flutter-${{ hashFiles('**/pubspec.yaml', '**/pubspec.lock') }}
                  restore-keys: |
                      ${{ runner.os }}-flutter-

            # 缓存 Gradle 依赖
            - name: Cache Gradle dependencies
              uses: actions/cache@v3
              with:
                  path: |
                      ~/.gradle/caches
                      ~/.gradle/wrapper
                  key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
                  restore-keys: |
                      ${{ runner.os }}-gradle-

            - name: Install Dependencies
              run: flutter pub get --offline || flutter pub get

            - name: Decode Keystore
              run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/app/keystore.jks

            - name: Create key.properties
              run: |
                  echo "storePassword=${{ secrets.KEYSTORE_PASSWORD }}" > android/key.properties
                  echo "keyPassword=${{ secrets.KEY_PASSWORD }}" >> android/key.properties
                  echo "keyAlias=${{ secrets.KEY_ALIAS }}" >> android/key.properties
                  echo "storeFile=keystore.jks" >> android/key.properties

            # 创建env文件
            - name: Create env
              run: |
                  echo "BASE_URL=${{ secrets.ENV_BASE_URL }}" > .env.prod
                  echo "BASE_URL=${{ secrets.ENV_BASE_URL }}" > .env.dev

            # 启用 Gradle 并行编译 & 构建 APK
            - name: Build APK
              run: flutter build apk --release --dart-define=ENV=.env.prod

            # 重命名 APK 文件
            - name: Rename APK file
              run: mv build/app/outputs/flutter-apk/app-release.apk build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk

            - name: Upload Build Artifact # ✅ 上传 APK 文件
              uses: actions/upload-artifact@v4
              with:
                  name: built-apk
                  path: |
                      build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk
                      pubspec.yaml

    release:
        needs: build
        runs-on: ubuntu-latest
        steps:
            - name: Download Build Artifact # ✅ 下载 APK 文件
              uses: actions/download-artifact@v4
              with:
                  name: built-apk
                  path: .

            - name: Upload Release Asset
              uses: softprops/action-gh-release@v2
              with:
                  draft: false
                  files: build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk
              env:
                  GITHUB_TOKEN: ${{ secrets.ACCESS_TOKEN }}

    upload:
        needs: build
        runs-on: ubuntu-latest
        steps:
            - name: Download Build Artifact # ✅ 下载 APK 文件
              uses: actions/download-artifact@v4
              with:
                  name: built-apk
                  path: .

            - name: Download mc
              run: |
                  wget https://dl.min.io/client/mc/release/linux-amd64/mc
                  chmod +x mc

            - name: Configure mc
              env:
                  MINIO_ACCESS: ${{ secrets.MINIO_ACCESS_KEY }}
                  MINIO_SECRET: ${{ secrets.MINIO_SECRET_KEY }}
                  MINIO_ENDPOINT: ${{ secrets.MINIO_ENDPOINT }}
              run: |
                  ./mc alias set myminio $MINIO_ENDPOINT $MINIO_ACCESS $MINIO_SECRET

            - name: Get version
              id: yq
              uses: mikefarah/yq@master
              with:
                  cmd: yq -r '.version | split("+") | .[0]' 'pubspec.yaml'

            - name: generate version.json
              run: |
                  BUILD_TIME=$(TZ='Asia/Shanghai' date +'%Y-%m-%dT%H:%M:%SZ')
                  BASE_VERSION=${{ steps.yq.outputs.result }}
                  echo "{
                    \"version\": \"$BASE_VERSION\",
                    \"build_time\": \"$BUILD_TIME\",
                    \"download_url\": \"${{ secrets.MINIO_ENDPOINT }}/${{ secrets.MINIO_BUCKET }}/XXX_${{ github.ref_name }}.apk\"
                  }" > version.json

            - name: generate qrcode
              run: |
                  sudo apt update && sudo apt install -y qrencode imagemagick
                  qrencode -o qrcode.png -s 10 -m 2 -l H "${{ secrets.MINIO_ENDPOINT }}/${{ secrets.MINIO_BUCKET }}/XXX_${{ github.ref_name }}.apk"
                  wget https://xxx.xxx.com/logo.png
                  convert logo.png -resize 80x80 -bordercolor white -border 8x8 logo_with_border.png
                  convert qrcode.png logo_with_border.png -gravity center -composite download_qr.png

            - name: Upload using mc
              run: |
                  ./mc cp build/app/outputs/flutter-apk/XXX_${{ github.ref_name }}.apk "myminio/${{ secrets.MINIO_BUCKET }}/"
                  ./mc cp version.json "myminio/${{ secrets.MINIO_BUCKET }}/"
                  ./mc cp download_qr.png "myminio/${{ secrets.MINIO_BUCKET }}/"
```
