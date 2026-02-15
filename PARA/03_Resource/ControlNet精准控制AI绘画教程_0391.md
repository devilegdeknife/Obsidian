---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
---
# ControlNet精准控制AI绘画教程
[内容链接](https://zhuanlan.zhihu.com/p/608499305)

ControlNet精准控制AI绘画教程

AI绘画相信大家都已经不陌生了，虽然AI绘画出图很方便，但是要让其生成一副自己满意的图，还是需要费一番心思，有时候多次调整关键词就是生成不了自己想要的画面，这些一直以来都是AI绘画的痛点但就在最近，一款名为“ControlNet”AI绘画插件的出现，几乎可以说是完美解决了AI绘画的痛点，它可以几乎做到完美控制画面。

ControlNet的绘画模式是：先让用户输入一张参考图，然后程序根据此图按一定的模式预处理一张新图，之后再由AI根据这两幅图绘制出成品；当然，用户可以关闭程序的预处理功能，直接输入一张用户自己处理好的图片当作预处理图，之后AI仅根据这副图生成成品。

例如下面四位美少女，原本是一张四个闺蜜在沙滩边上的普通合影照，在新魔法的加持下，"啪的一下"画风两极反转，瞬间进入唯美动漫风，还有效果截然不同的。不仅是动漫画风效果上的惊艳，就连人物的pose也是保持得"原汁原味"，美女们这下子算是分分钟实现了动漫自由。

![图片描述](https://pic2.zhimg.com/v2-6f9b98c668ae9b11bb7f3762c29d5127_r.jpg)

## 一.骨骼绑定-OpenPose

用户可以输入一张姿势图片（推荐使用真人图片）作为AI绘画的参考图，输入prompt后，之后AI就可以依据此生成一副相同姿势的图片；当然了，用户可以直接输入一张姿势图，如下图：

![图片描述](https://pic3.zhimg.com/v2-edf3a200aeaaf870c12691f4c9ee1e12_r.jpg)

注意：OpenPose模型已经更新手部骨骼了，手指的问题和多人问题将很快被解决

![图片描述](https://pic4.zhimg.com/v2-01c3a4858065d9fb13ec186956a53847_r.jpg)

![图片描述](https://pic4.zhimg.com/v2-a73fb73f5076b763ec8b7208cac8c907_r.jpg)

![图片描述](https://pic2.zhimg.com/v2-0e1c4733d20a4014cb192d3ce101de69_r.jpg)

## 二.精准控线

## 2.1 Canny模型

用户输入一张动漫图片作为参考，程序会对这个图片预加载出线稿图，之后再由AI对线稿进行精准绘制（细节复原能力强）

![图片描述](https://pic4.zhimg.com/v2-17730e54772012997cee28f18258cead_r.jpg)

## 2.2 Hed模型

相比Canny自由发挥程度更高

![图片描述](https://pic4.zhimg.com/v2-fa28f3f816269aa1d0b88563aaaae795_r.jpg)

## 2.3 Scribble模型

涂鸦成图，比Canny自由发挥程度更高，以下为低权重成图

![图片描述](https://pica.zhimg.com/v2-424769a86b2bd3c35b5c311bb911402c_r.jpg)

## 2.4 Seg模型

区块标注，适合潦草草图上色

![图片描述](https://pic3.zhimg.com/v2-dbdf1930884abd2451e8d823a036ea68_r.jpg)




## 2.5 Mlsd模型

建筑物线段识别

![图片描述](https://pic2.zhimg.com/v2-7f150b7a862eaf452d745602c79fe101_r.jpg)

## 三.三维制图

## 3.1 Normal模型

适用于3维制图，用于法线贴图，立体效果

AI会提取用户输入的图片中3D物体的法线向量，以法线为参考绘制出一副新图，此图与原图的光影效果完全相同

![图片描述](https://pica.zhimg.com/v2-c927afb85cbb152b6946db1048c29aa6_r.jpg)

## 3.2 Depth模型

该模型可以较好的掌握图片内的复杂3维结构层次，并将其复现

它会从用户输入的参考图中提取深度图，再依据此重现画面的结构层次

这也就说明了我们可以直接通过3D建模软件直接搭建出一个简单的场景，再将其抛给AI绘画"Depth"模型去"渲染"

![图片描述](https://pic3.zhimg.com/v2-b225f215ff0734cf48fbc1337f63f818_r.jpg)

![图片描述](https://pic3.zhimg.com/v2-8994aa95d8e9467057b18d2aaa465618_r.jpg)

## AI绘画ControlNet在线使用教程

AI在线创作24小时体验码，3090显卡，动力强劲,包括AI绘图，AI三维模型，ChatGPT试用等，体验地址：

[AI绘画在线体验](https://link.zhihu.com/?target=https%3A//ittutorial.top/buy/10000)

流程和正常文生图一致，区别在于在底下这里选择这个controlnet的选项。

这里以人体动作为例，以Preprocessor就选openpose，模型就选control_openpose。

![图片描述](https://pic3.zhimg.com/v2-adaf7c5d5d7a00805d78321eafe2c0a2_r.jpg)

效果如下：

![图片描述](https://pica.zhimg.com/v2-2c480a22378a8dcb3c4a747c637488e0_r.jpg)

![图片描述](https://picx.zhimg.com/v2-ac77506aa35326d86cdca9c5296a7ad7_r.jpg)

在选择Preprocessor和模型时，这里就涉及到一个概念。

Preprocessor是什么呢，是个预处理器的意思。放进去的图会先经过这个东西

比如 canny 预处理器，就是这样子的：中间的就是经过 canny预处理的效果。

canny预处理 + control_canny 模型

![图片描述](https://pic4.zhimg.com/v2-6dd2f4f6826696a2223ecd80347af51b_r.jpg)