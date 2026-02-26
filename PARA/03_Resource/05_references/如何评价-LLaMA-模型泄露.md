---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags:
  - #7
para: resource
aliases:
  - "如何评价_LLaMA_模型泄露_0389"
---
# 如何评价 LLaMA 模型泄露？
[内容链接](https://www.zhihu.com/question/587479829/answer/2933245441)

最近跟风测试了几个开源的类似于ChatGPT的大语言模型（LLM）。
主要看了下Mete半开源的**llama**，顺便也看了下国人大佬开源的**RWKV**，主要是想测试下能不能帮我写一些代码啥的。
首先看llama，模型本来需要申请，但是目前不需要了，下载地址：

- magnet:?xt=urn:btih:ZXXDAUWYLRUXXBHUYEMS6Q5CE5WA3LVA&dn=LLaMA

![图片描述](https://picx.zhimg.com/v2-3cb4c36b7a1c9a4afb78399c9b021f96_r.jpg?source=2c26e567)


不过这个格式的支持的现成库不多，大家一般都是使用Hugging Face转换好特定格式的权重，举个例子：

- https://huggingface.co/decapoda-research/llama-13b-hf
- https://huggingface.co/decapoda-research   模型汇总
- 或者磁力 magnet:?xt=urn:btih:dc73d45db45f540aeb6711bdc0eb3b35d939dcb4&dn=LLaMA-HFv2&tr=http%3a%2f%2fbt2.archive.org%3a6969%2fannounce&tr=http%3a%2f%2fbt1.archive.org%3a6969%2fannounce

还有很多自己到hf上搜就可以了：

![图片描述](https://picx.zhimg.com/v2-0f0de14a8039b34b635698d7208da44d_r.jpg?source=2c26e567)


除了直接在上述网站下载，也可以通过git-lfs的方式直接clone下载，因为权重比较大，需要耐心一点：

> 要注意的的是，这个权重刚更新过一版，现在是V2，如果你发现模型跑不了，可能又更新了。可以参考这里获取最新的**https://rentry.org/llama-tard-v2#3-updated-hfv2-converted-llama-weights**

![图片描述](https://picx.zhimg.com/v2-cc134f8c9d361d28ac527f4c3edc96da_r.jpg?source=2c26e567)


跑的话用这个仓库：

- https://github.com/oobabooga/text-generation-webui

这个仓库类似于Stable Diffusion，整合了很多NLP的开源模型，最近也支持了llama。运行教程看这个：

- https://github.com/oobabooga/text-generation-webui/wiki/LLaMA-model#4-bit-mode

说完LLAMA，要玩RWKV这个的话，直接参考官方github就行了， readme上怎么运行、模型怎么获取，写的一清二楚，好评：

- https://github.com/BlinkDL/ChatRWKV

废话不多说看下效果。

## LLAMA

## 先看看最小模型7B的效果。

默认参数简单写个快排。

上述代码看起来挺像样，但实际跑不了。
再试一个简单的C++代码：

代码没问题，但是不能直接跑（复制粘贴直接跑，还需要调整下），可能是prompt没写对。

## 然后看下13B-INT8的效果

> True. 13B MP is 2 and required 27GB VRAM. So it can run in a single A100 80GB or 40GB, but after modying the model. 13B默认FP16的话需要27G的显存，但是如果INT8的话，14G就够了。

生成的代码是可以跑得，还不错。不过需要简单辨别一下，生成的代码比较多，需要挑选能用的。

对比了下chatgpt，没法比，chatgpt相比会给很多的解释，代码也任何问题，能跑：

换成带WebUI的测试一下，同样是13B-INT8：
这个不能跑。

![图片描述](https://pica.zhimg.com/v2-ca6024f2d7004f7ad855b9f83b2bf849_r.jpg?source=2c26e567)


试着调了下参数，回答比较鬼畜：

![图片描述](https://pic1.zhimg.com/v2-da84c42decce04a125eeff87895b87bd_r.jpg?source=2c26e567)


又调了下参数，这下生成的代码可以跑，试了下结果没问题：

![图片描述](https://pic1.zhimg.com/v2-e5a0405dfa14514afd1a740eefe29edf_r.jpg?source=2c26e567)


试了下C++生成代码，看起来能跑能编译通过，但是一跑就core了。

![图片描述](https://picx.zhimg.com/v2-515aa57f74c9521f1686a5fd246d4ee5_r.jpg?source=2c26e567)


相对比较简单的C++代码可以生成，也能跑：

![图片描述](https://pica.zhimg.com/v2-8e4782143b3ec3c19b00716b80198058_r.jpg?source=2c26e567)


试了下简单的python代码生成，给出markdown的形式，也可以接上，代码没问题。

调整参数很重要，试了多个例子，temperature设为0.95，top_q设为0.65感觉效果好些。

## RWKV

RWKV简单试了几个。
用的HF上已经搭好的**https://huggingface.co/spaces/Hazzzardous/RWKV-Instruct**。
也可以看ModelScope上的：

- 在线玩 7B 网文模型：https://modelscope.cn/studios/BlinkDL/RWKV-CHN/summary
- 在线玩 14B 英文模型：https://modelscope.cn/studios/Blink_DL/RWKV/summary

## 7B的效果

![图片描述](https://picx.zhimg.com/v2-77a63e7b70d2e56d271c39c606bb6775_r.jpg?source=2c26e567)


代码也能跑。

## 14B的效果

**https://huggingface.co/spaces/yahma/rwkv-14b**用的这个space，大家也可以试试。


![图片描述](https://picx.zhimg.com/v2-48baf212bfb48f3a1e9fc4df64cbbc64_r.jpg?source=2c26e567)




![图片描述](https://pic1.zhimg.com/v2-0c57c3182d98c2d7b9c51e2b378929ec_r.jpg?source=2c26e567)


感觉也没问题，如果prompt写的比较好的话，同样可以生成正常运行的代码。

## 量化

因为是大模型，如果不量化，在个人消费级显卡上大概只能跑7B的，还是INT8的模式：

![图片描述](https://pic1.zhimg.com/v2-a6dc751eda0848b708b1a6ce11ebdd3d_r.jpg?source=2c26e567)


实际有人测试INT8的性能和未量化的相差不大，因为数据集太大了，我这边无法做benchmark和校准，只能看别人的了。

![图片描述](https://pica.zhimg.com/v2-31cc8b8116c178ef9ad6bb4830b98be9_r.jpg?source=2c26e567)


以下是一些性能参考：
**https://github.com/facebookresearch/llama/issues/79**

- M2 Max + 96GB unified memory == 7B @ 10 token/s ( https://github.com/facebookresearch/llama/issues/79#issuecomment-1460500315)
- 12700k + 128GB RAM + 8GB 3070Ti == 65B @ 0.01 token/s ( https://github.com/facebookresearch/llama/issues/79#issuecomment-1460464011)
- Ryzen 5800X + 32GB RAM + 16GB 2070 == 7B @ 1 token/s ( https://github.com/facebookresearch/llama/issues/79#issuecomment-1457172578)
- 2x 8GB 3060 == 7B @ 3 token/s ( https://github.com/facebookresearch/llama/issues/79#issuecomment-1457437793)
- 8x 24GB 3090 == 65GB @ 500 token/s ( https://github.com/facebookresearch/llama/issues/79#issuecomment-1455284428)

在我机器上的性能：

## 尝试一下30B的llama

30B的llama的INT4模型下载地址：

- https://huggingface.co/decapoda-research/llama-smallint-pt/tree/main
- https://drive.google.com/file/d/1SZXF3BZ7e2r-tJpSpCJrk8pTukuKTvTS/view llama-30b-4bit.pt

**INT4的30B模型可以在20G显存的显卡上跑**，相比INT8显存又少了一半，而且精度相差不大。


![图片描述](https://picx.zhimg.com/v2-4888b4b2a3a9124d2c13e62c60161007_r.jpg?source=2c26e567)


具体可以参考：

- https://rentry.org/llama-tard-v2#3-updated-hfv2-converted-llama-weights

如果显存不够20G，也可以通过平摊GPU显存到内存上跑INT8的30B模型，大概需要70-80G的内存（或者32G内存+50G的swap空间），但是如果内存不够，把权重放到swap上，能跑，会很慢很慢...

- https://github.com/oobabooga/text-generation-webui/issues/190

![图片描述](https://pic1.zhimg.com/v2-19111fadb24a01def88bd20b9fb45ee0_r.jpg?source=2c26e567)


我自己测试了下跑起来太慢了，手头目前只有一张16G的A4000，哪天再找机会在云服务器上跑下，测测30B和64B的模型效果咋样...

## 能做什么以及，一些prompt

因为之前已经体会到了ChatGPT的很多，先不说聊天和问答吧，就说写代码，尤其是写一些你能看得懂，但是需要查API，调试才能写出来的代码。这种代码写起来虽然不难，但是确实会费一点时间，有些API接口你忘记了，或者不知道怎么用，这时候用ChatGPT帮助很大，因为在网上查的话，不一定就能查到你想要的。
对于ChatGPT的更多种用法，相比网上说法更多了，我也就不赘述了。
对于开源的llama，其潜力如下：

- Confirming that 30B model is able to generate code and fix errors in code: #7
- Confirming that 30B model is able to generate prompts for Stable Diffusion: #7 (comment)
- Confirming that 7B and 30B model support Arduino IDE: #7 (comment)

> **As the model was trained on a "scientific-looks" data and wiki, we need to be "more scientific" when prompting.As the model was trained on a "scientific-looks" data and wiki, we need to be "more scientific" when prompting.**

一些prompt分享，可以测测模型：

- I will show you how to use C++ to write a file:
- I will tell you in python, how to do a quicksort:
- Write the Python3 code with detailed comments to generate 256 random integers in the range from -128 to 512, inclusive.

一些技巧：**https://github.com/randaller/llama-chat/issues/7**
总结下，如果这些模型确实可以提升我的工作开发效率，那么对于我来说，就是值得研究的，你们呢？

## 参考链接

- https://github.com/facebookresearch/llama/issues/69
- https://github.com/oobabooga/text-generation-webui/issues/193
- https://github.com/oobabooga/text-generation-webui/wiki/LLaMA-model#4-bit-mode
- https://rentry.org/llama-tard-v2
- https://github.com/oobabooga/text-generation-webui/pull/206
- https://github.com/randaller/llama-chat
- https://github.com/oobabooga/text-generation-webui/issues/177
- https://github.com/tloen/llama-int8
- https://github.com/juncongmoo/pyllama
- https://rentry.org/llama-tard-v2#so-you-got-the-right-weights-now-what
- https://www.reddit.com/r/MachineLearning/comments/11h3p2x/d_facebooks_llama_leaks_via_torrent_file_in_pr/