---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags:
  - #37
---
# 【Stable Diffusion】AI绘画大魔导书组成原理（二）
[内容链接](https://zhuanlan.zhihu.com/p/611835772)

在上一篇中我们对AI绘画大魔导书——Stable Diffusion的原理、结构作了简要介绍：

[糖葫芦喵喵：【Stable Diffusion】AI绘画大魔导书组成原理（一）](https://zhuanlan.zhihu.com/p/611832619?)

在理解了AI绘画魔法原理的基础上，我们希望能够依据个人喜好使用魔法，生成**定制化的绘画作品**。为了达到这样的目的，我们需要对原始版大魔导书进行修改。原始版大魔导书的训练是十分耗费数据与计算资源的，有没有简单快捷的方法能让我们达到这个目的？当然有！下面主要对Stable Diffusion的主流**定制化组件**进行介绍。

## 一、Hypernetwork

主要目的为通过**增加小网络使用少量图片实现对Stable Diffusion的微调（不改变原模型权重）**。注意，这里Hypernetwork不是超网络（输出另一网络权重的网络）：

> 值得注意的是，这个概念与Ha等人在2016年提出的HyperNetworks完全不同，后者通过修改或生成模型的权重来工作，而我们的Hypernetworks在更大的网络中的多个点上应用一个小型神经网络（**线性层或多层感知器**），修改隐藏状态。（感谢new bing同学的翻译）

具体见[NovelAI Blog](https://link.zhihu.com/?target=https%3A//blog.novelai.net/novelai-improvements-on-stable-diffusion-e10d38db82ac)。 其主要思路为在CorssAttn的K、V部分加上一个小型的一两层**线性层**（加在原始线性层前），然后和K、V输入相加，类似于残差的实现方式。**训练时冻结其他部分，只训练这一部分，因此训练得到的Hypernetwork参数量很小。**

具体实现在[AUTOMATIC1111项目](https://link.zhihu.com/?target=https%3A//github.com/AUTOMATIC1111/stable-diffusion-webui/blob/master/modules/hypernetworks/)中，主要过程如下：

所谓网络结构[1,2,1]指这几个线性层的参数大小（为输入隐藏层的倍数），具体可见[stable-diffusion-webui/hypernetwork.py at master · AUTOMATIC1111/stable-diffusion-webui (github.com)](https://link.zhihu.com/?target=https%3A//github.com/AUTOMATIC1111/stable-diffusion-webui/blob/master/modules/hypernetworks/hypernetwork.py%23L27)。

## 二、LoRA

Paper：[[2106.09685] LoRA: Low-Rank Adaptation of Large Language Models (arxiv.org)](https://link.zhihu.com/?target=https%3A//arxiv.org/abs/2106.09685)

低秩分解，原用于大模型的微调。与Hypernetwork类似，主要目的为通过**增加小网络使用少量图片实现对Stable Diffusion的微调（不改变原模型权重）**。其主要思路如下：

![图片描述](https://pic2.zhimg.com/v2-73e1d476c2df538ab36878158b8ce2db_1440w.jpg)

将![图片描述](https://www.zhihu.com/equation?tex=W%5Cin%5Cmathbb%7BR%7D%5E%7Bd%2Ak%7D)用低秩分解表示为![图片描述](https://www.zhihu.com/equation?tex=W+%2BB%2AA%2CB%5Cin%5Cmathbb%7BR%7D%5E%7Bd%2Ar%7D%2CA%5Cin%5Cmathbb%7BR%7D%5E%7Br%2Ak%7D)，其维度![图片描述](https://www.zhihu.com/equation?tex=r%5Cll+min%28d%2Ck%29)。将![图片描述](https://www.zhihu.com/equation?tex=B%2AA)这一部分作为旁路，其输出与原始输出相加。**训练时冻结其他部分只训练旁路部分，因此训练得到的LoRA Layer参数量很小**，可插拔，并支持多个LoRA同时使用。

[diffusers](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers)项目中，实现为LoRACrossAttnProcessor类，作用于CrossAttn中的K、Q、V、O(output)线性层，并与原始线性层输出相加。主要过程如下：

LoRA也可作用于Text Encoder中的Attn，见github讨论：[What does the R in LoRA mean? And why tweaking it is cool! · cloneofsimo/lora · Discussion #37 (github.com)](https://link.zhihu.com/?target=https%3A//github.com/cloneofsimo/lora/discussions/37)

## 三、Textual Inversion

Paper：[[2208.01618] An Image is Worth One Word: Personalizing Text-to-Image Generation using Textual Inversion (arxiv.org)](https://link.zhihu.com/?target=https%3A//arxiv.org/abs/2208.01618)

主要目的为**使用少量图片学习新词<V>的Embedding**（即对词表进行扩展，多用于如定义角色名）。其主要思路为对Clip Text Encoder词表进行扩展，并初始化（<V-Class>可以用Class初始化），**训练时冻结除embedding之外的其他权重**。

[diffusers](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers)项目中，实现为[diffusers/textual_inversion.py at main · huggingface/diffusers · GitHub](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers/blob/main/examples/textual_inversion/textual_inversion.py)，

## 四、Aethetic Gradients

Paper：[[2209.12330] Personalizing Text-to-Image Generation via Aesthetic Gradients (arxiv.org)](https://link.zhihu.com/?target=https%3A//arxiv.org/abs/2209.12330)

主要目的为**使用少量图片对Stable Diffusion（Clip Text Encoder部分）进行微调，学习生成定制化画风（不限于某一物体）**。其主要思路为用一组风格一致的图片进入Clip Vis Encoder后进行平均，然后和Prompt进行Clip Model训练（详见上一篇中Clip模型）。训练过程中只训练几个迭代步的Clip Text Encoder，其余部分参数冻结。然后使用新训练的Clip Text Model输出Prompt Embedding。

具体实现在[stable-diffusion-aesthetic-gradients](https://link.zhihu.com/?target=https%3A//github.com/vicgalle/stable-diffusion-aesthetic-gradients)项目[PersonalizedCLIPEmbedder](https://link.zhihu.com/?target=https%3A//github.com/vicgalle/stable-diffusion-aesthetic-gradients/blob/main/ldm/modules/encoders/modules.py)类，主要过程如下：

## 五、DreamBooth

Paper：[[2208.12242] DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation (arxiv.org)](https://link.zhihu.com/?target=https%3A//arxiv.org/abs/2208.12242)

主要目的为使用**少量图片对Stable Diffusion（Unet部分）进行微调**（Clip Text Encoder部分可选）**，学习生成定制化物体**。与Hypernetwork、LoRA不同，微调时不冻结原模型参数。因此，若不加处理则会导致语义漂移问题： 原模型的某类型都将生成为微调后的类型，模型失去了多样性。为了保持原模型的多样性，DreamBooth采用如下方式训练：

- loss_1: a [V] [class]（e.g. a photo of sks dog）图片噪声的MSE损失。（与原训练过程一致）
- loss_2: a [class]（e.g. a photo of dog）图片噪声的MSE损失（实际上a [class]对应的图片也可以没有，直接通过原模型生成,默认200张）。loss_2主要防止直接微调造成的语义漂移。

两个loss相加进行Unet整体微调。[diffusers](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers)项目中，实现为[diffusers/train_dreambooth.py at main · huggingface/diffusers · GitHub](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers/blob/main/examples/dreambooth/train_dreambooth.py)，训练部分主要过程如下：

## 六、ControlNet

Paper：[[2302.05543] Adding Conditional Control to Text-to-Image Diffusion Models (arxiv.org)](https://link.zhihu.com/?target=https%3A//arxiv.org/abs/2302.05543)

Stable Diffusion模型主要特点在于使用了CrossAttn的Prompt Text控制，ControlNet为其进一步增加了**Img控制**。 其主要结构如下图所示：

![图片描述](https://pic2.zhimg.com/v2-c98e06273462fee07d360b3286810747_r.jpg)

左侧为**冻结参数的Unet模型**，右侧为**可训练的ControlNet**。其中，ControlNet蓝色部分与Unet的down_block和mid_block结构一致。它们产生的输出分别通过一个ZeroConv（初始置零的1*1卷积，本质还是对通道的线性变换 ），最终输入到冻结参数的Unet模型的mid_block、up_block中（**即上图从右至左的蓝色线条**）。

[diffusers](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers)项目中，实现为[ControlNetModel类](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers/blob/main/src/diffusers/models/controlnet.py)（上图右侧部分）。具体实现如下所示：

主要为down_block以及mid_block每一层（12+1）输出增加一个ZeroConv（初始置零的1*1卷积 ）。（12,1）数字的来源详见上一篇2.3 Unet中对信息交互数量的分析。这(12,1)个零卷积输出将添加在原始冻结的Unet模型的信息交互部分，相当于为原始冻结的Unet模型up_block部分增加了控制信息。在[UNet2DConditionModel类](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers/blob/main/src/diffusers/models/unet_2d_condition.py)中实现如下：

训练过程中多训练了一个Unet的downblock+midblock+对应层数零卷积。预测[Pipeline](https://link.zhihu.com/?target=https%3A//github.com/huggingface/diffusers/blob/main/src/diffusers/pipelines/stable_diffusion/pipeline_stable_diffusion_controlnet.py)主要过程如下：

ControlNet可以实现人体姿势、深度图、边缘图等多种图像条件控制下的图像生成，效果非常棒。

以上介绍了6种AI绘画大魔导书——Stable Diffusion定制化组建的原理与实现过程。为了更好地满足定制化需求，可以同时使用上述部分组件。当然，魔法探索之路还远远未停止，让我们期待下未来的魔法发展!
