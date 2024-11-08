---
title: 'OpenCV破解滑块验证码'
date: 2024-02-02T19:34:25+08:00
description: 使用OpenCV模板匹配破解滑块验证码
categories:
    - OpenCV
    - Python
tags:
    - OpenCV 模板匹配
    - 图像处理
    - 计算机视觉
---

验证码是阻止自动化程序很常见的手段，滑块验证码就是其中一种，之前介绍过的 YOLO 也可以通过训练识别出滑块和验证位置，但相关程序依赖很大，不适合当前这种场景，今天给大家介绍通过 OpenCV 模板匹配的方式找到识别出滑块和验证位置，给大家提供一些思路。

![image](https://s2.loli.net/2024/02/02/QFevkHSDKdR1cxP.jpg)

我们先来分析下面一张滑块验证码图片，滑块是从图片中随机截取的，形状不变，位置总是在最左边，y 轴随机，验证位置则有两个，都使用某种算法进行暗化处理。

#### 处理图像

因为图像中有很多元素，颜色也很丰富，所以我们直接通过提高图片亮度，让图片尽可能的接近原图。

```python
import cv2 as cv
origin_image = cv.imread("origin.jpg")
hsv = cv.cvtColor(origin_image, cv.COLOR_BGR2HSV)
hsv[:,:,2] = 255
process_image = cv.cvtColor(hsv, cv.COLOR_HSV2BGR)
```

我们以 HSV 模式读取图片，将图片上每个点的亮度都改为 255 最亮，再转换为 BGR 模式，我们会得到如下图片。

![image](https://s2.loli.net/2024/02/02/jHAMgUcRosbFfm2.jpg)

#### 使用模板匹配找出滑块和验证位置

从上一步的处理图片中我们可以看出，处理后的图片验证位置和滑块差异已经很小了。因为只有一个滑块，并且它一定和正确的验证位置处于同一个 Y 轴，所以我们根据滑块一定是在左边这个条件，只需要从上到下截取一小块对比图片，进行模板匹配，只要找到匹配对象就一定是正确的验证位置。

```python
def template_matching(original_image, template):
    result = cv.matchTemplate(original_image, template, cv.TM_CCOEFF_NORMED)
    min_val, max_val, min_loc, max_loc = cv.minMaxLoc(result)
    x, y = max_loc
    if max_val > 0.9:
        return (x, y)

    return ()

def find_target(img):
    h, w, _ = img.shape

    right_x = 50

    target = img[:, right_x:]
    start_x = 18
    end_x = 45
    width = 25
    height = 25

    for i in range(h - height):
        y1 = i
        y2 = i + height
        tem = img[y1:y2, start_x:end_x]
        res = template_matching(target, tem)
        if res:
            result = (start_x + 12, y1 + 12, res[0] + right_x + 12, y1 + 12)
            return result

    return ()
```

1. 首先获取图片高度，并且获取目标匹配图片，为什么要获取从 x=50 处获取图片，因为我们处理后的图片应该有两个微小差异的两个区间，如果从 0 开始我们还需要做多目标匹配较麻烦，如果如果裁剪 x=50 为起点的右边部分，我们匹配到的就是正确验证位置，在最后结果加上 x 即可。
2. 上述代码中我选择的匹配模板是从较大的正方形区域，这样可以提高匹配的精准度。
3. 因为即使我们看来毫不匹配的两个图片进行模板匹配，最终得到的相似性结果也不会是 0，所以我们要控制阈值来提高匹配准确性，我选择的是 0.9。

#### 获取验证结果

![image](https://s2.loli.net/2024/02/02/mQx9MKZa4GPVhjy.jpg)
![image](https://s2.loli.net/2024/02/02/WbpGBOoIAw76fXM.jpg)

我将匹配结果画在了处理后的图片和原图上，如上所示，find_target 返回的结果则是(30, 49, 124, 49)，它返回的是图中画出的区域中心点 x,y 坐标。

该方法无法适用于所有滑块验证码，如果有效但匹配不稳定，则需要你去优化匹配模板和阈值。该方法只是为大家提供一种思路，希望不要通过它进行违法行为。
