---
title: '构建静态Tesseract可执行程序'
date: 2023-06-21T22:06:42+08:00
description: 构建静态tesseract，方便ocr程序通过pyinstaller打包
tags:
    - Tesseract
    - OCR
---

Tesseract-OCR 虽然很多人用，但是大部分都是安装程序在本地使用，而我在一个项目中使用了 OCR，并且通过 Pyinstaller 打包成 exe 可执行文件给其他人使用，这导致其他人使用也需要安装 Tesseract-OCR，并设置路径狠麻烦，这次找到了构建静态 tesseract 的方法，直接将 tesseract 打包进程序可以避免安装 Tesseract-OCR 方便许多，在这里分享给大家

1. 安装构建工具
   ![image](https://monster.aiur.site/20230621222303.png)

我们只需要在 Visual Studio 中安装 C++的桌面开发模块，并安装上图中右边的三个工具

2. 安装 vcpkg
   在你的终端上拉去 vcpkg 代码，并下载 vcpkg

```
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
./bootstrap-vcpkg.bat
```

上述代码执行完成后会在当前目录出现一个 vcpkg.exe，接下来执行以下命令将 vcpkg 与 Visual Studio 进行结合

```
./vcpkg.exe integrate install
```

成功后会出现 CMake projects should use: "-DCMAKE_TOOLCHAIN_FILE=XXXXXXXXXXXXXXXXXXXXXXXXXXX"

使用以下命令将内容写入到文件中，将命令中的内容替换为你电脑的输出，注意有一对单引号和双引号，不能省略

```
echo '"-DCMAKE_TOOLCHAIN_FILE=XXXXXXXXXXXXXXXXXXXXXXXXXXX"' > CMAKE.txt
```

3. 构建独立 tesseract.exe
   通过 vcpkg 安装 tesseract

```
vcpkg install tesseract:x64-windows-static  # 64位系统
vcpkg install tesseract:x64-windows-static  # 32位系统
```

安装成功后 exe 文件会在你的.\packages\tesseract_x64-windows-static\tools\tesseract 目录中，直接在命令行中使用 tesseract.exe 正常输出就是成功了，将你需要的字体在放在同级的 tessdata 中就可以使用了

如果要使用 Pyinstaller 打包，可以直接将这个 tesseract 目录复制到你的 python 项目根目录，直接修改 tesseract_cmd 路径为这个 tesseract.exe 的路径，并在 pyinstaller 命令中加入--add-data "tesseract;tesseract"即可
