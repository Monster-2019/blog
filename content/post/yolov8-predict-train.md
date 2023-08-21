---
title: 'Yolov8 自定义检测模型训练'
date: 2023-08-21T20:39:08+08:00
description: Yolov8 训练自己的检测模型教程
tags:
    - Yolov8
---

Yolo 检测已经在很多领域得到了广泛应用，如今已经更新到了 Yolov8 版本。针对某些小众领域的检测不准确，接下来我们训练自己的模型。

### 训练准备工作

-   待检测图片
-   电脑已经安装 python，并且已经安装了 ultralytics 库
-   检测模型，从[https://docs.ultralytics.com/tasks/detect/](https://docs.ultralytics.com/tasks/detect/)下载

### 训练流程

#### 手动标签

打标签工具有很多，我们使用线上的工具[https://app.cvat.ai/](https://app.cvat.ai/)，依此创建 Projects、Tasks。

![image](https://cdn.jsdelivr.net/gh/Monster-2019/cdn/Snipaste_2023-08-21_21-02-06.jpg)

在创建项目的同时创建相关的标签。

![image](https://cdn.jsdelivr.net/gh/Monster-2019/cdn/Snipaste_2023-08-21_21-04-02.jpg)

在创建任务时，选择刚刚创建的项目，将会使用项目标签。选择训练图片。

![image](https://cdn.jsdelivr.net/gh/Monster-2019/cdn/Snipaste_2023-08-21_21-08-36.jpg)

我们将在 Jobs 中看到我们刚刚创建的任务，并且状态是 new，点击这个 Job。

然后我们按照下图进行打标签。

![image](https://cdn.jsdelivr.net/gh/Monster-2019/cdn/Snipaste_2023-08-21_21-16-36.jpg)

打完标签后我们回到 Jobs，通过右下角的三点将状态更新为完成并导出标签数据。

![image](https://cdn.jsdelivr.net/gh/Monster-2019/cdn/Snipaste_2023-08-21_21-19-46.jpg)

导出数据的时候我们需要选择导出格式为 YOLO 1.1。免费账户无法和图片一起导出，所以我们只导出标签数据。

将导出的压缩文件解压后，有一个以你项目名称命名的文件夹，文件夹中每个文件对应相应名称的图片标签，数据如下：

```python
0 0.089157 0.613272 0.178314 0.383210
1 0.461991 0.320741 0.177587 0.373086
1 0.688067 0.606142 0.178576 0.373025
```

-   值 0 和 1 表示 项目中标签的，按索引对应
-   后面四位数分别是 x 坐标，y 坐标，宽度，高度相对于图片宽和高的比例

#### 开始训练

我们将得到的标签和图片进行整理。得到如下结构

```
yolov8_train
│  config.yaml
│  predict.py
│  train.py
│  yolov8m.pt
│
├─images
│  ├─train
│  │      132450_1.jpg
│  │      132458_1.jpg
│  │      132620_1.jpg
│  │      66520_1.jpg
│  │      66628_1.jpg
│  │      66696_1.jpg
│  │      68998_1.jpg
│  │
│  └─val
│          264850_1.jpg
│
└─labels
    ├─train
    │      132450_1.txt
    │      132458_1.txt
    │      132620_1.txt
    │      66520_1.txt
    │      66628_1.txt
    │      66696_1.txt
    │      68998_1.txt
    │
    └─val
            264850_1.txt
```

将我们训练的图片分为两部分，一部分用于检测训练，一部分用于验证，将它们分别存放在 images 文件夹中的 train 文件夹和 val 文件夹中。将我们的标签数据分别存放在 label 文件夹中的 train 文件夹和 val 文件夹中。train 文件夹中的文件名和 val 文件夹中的文件名要对应。

##### 配置训练文件

```yaml
# config.yaml

ptah:
train: images/train
val: images/val
test:

names:
    0: slider
    1: target
```

-   path: 表示数据路径
-   train: 训练数据路径
-   val: 验证数据路径
-   test: 测试数据路径
-   names: 标签，跟导出的文件索引和标签名称相对应。

##### 训练脚本

执行以下脚本进行训练

```python
# train.py

from ultralytics import YOLO

model = YOLO("yolov8m.pt")

model.train(data="/path/to/config.yaml", epochs=100, imgsz=640)

```

导入 YOLO 加载检测模型，使用 train 方法进行训练，data 表示训练配置的文件路径（使用绝对路径，相对路径会找不到文件），epochs 表示循环次数，也就理解为进行多少次训练，imgsz 指定训练图片尺寸为 640×640。

训练完成后，最终的模型就是 runs/detect/train/weights/best.pt 文件。

我们使用使用这个模型进行检测得到如下图所示：

![image](https://cdn.jsdelivr.net/gh/Monster-2019/cdn/Snipaste_2023-08-21_22-44-19.jpg)

box 数据：

```python
tensor([[  0.6179,  67.3884,  61.3139, 130.2415,   0.9999,   0.0000],
        [128.6514,  20.2602, 189.6595,  82.2866,   0.9950,   1.0000],
        [207.0595,  67.8416, 267.1595, 129.5847,   0.9709,   1.0000]])
```

我们得到了检测对象的坐标和标签相关信息，这个检测模型的准确性还是很高的。
