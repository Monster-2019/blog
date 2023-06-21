---
title: "Build Static Tesseract"
date: 2023-06-21T22:06:42+08:00
description: 构建静态tesseract，方便ocr程序通过pyinstaller打包
tags:
    - tesseract
---

Tesseract-OCR虽然很多人用，但是大部分都是安装程序在本地使用，而我在一个项目中使用了OCR，并且通过Pyinstaller打包成exe可执行文件给其他人使用，这导致其他人使用也需要安装Tesseract-OCR，并设置路径狠麻烦，这次找到了构建静态tesseract的方法，直接将tesseract打包进程序可以避免安装Tesseract-OCR方便许多，在这里分享给大家


1. 安装构建工具
![image](https://monster.aiur.site/20230621222303.png)

我们只需要在Visual Studio中安装C++的桌面开发模块，并安装上图中右边的三个工具

2. 安装vcpkg
在你的终端上拉去vcpkg代码，并下载vcpkg
```
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
./bootstrap-vcpkg.bat
```

上述代码执行完成后会在当前目录出现一个vcpkg.exe，接下来执行以下命令将vcpkg与Visual Studio进行结合

```
./vcpkg.exe integrate install
```

成功后会出现CMake projects should use: "-DCMAKE_TOOLCHAIN_FILE=XXXXXXXXXXXXXXXXXXXXXXXXXXX"

使用以下命令将内容写入到文件中，将命令中的内容替换为你电脑的输出，注意有一对单引号和双引号，不能省略
```
echo '"-DCMAKE_TOOLCHAIN_FILE=XXXXXXXXXXXXXXXXXXXXXXXXXXX"' > CMAKE.txt
```

3. 构建独立tesseract.exe
通过vcpkg安装tesseract
```
vcpkg install tesseract:x64-windows-static  # 64位系统
vcpkg install tesseract:x64-windows-static  # 32位系统
```

安装成功后exe文件会在你的.\packages\tesseract_x64-windows-static\tools\tesseract目录中，直接在命令行中使用tesseract.exe正常输出就是成功了，将你需要的字体在放在同级的tessdata中就可以使用了

如果要使用Pyinstaller打包，可以直接将这个tesseract目录复制到你的python项目根目录，直接修改tesseract_cmd路径为这个tesseract.exe的路径，并在pyinstaller命令中加入--add-data "tesseract;tesseract"即可