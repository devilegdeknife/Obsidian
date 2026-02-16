---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
para: resource
aliases:
  - "如何快速低成本训练私有领域的_AIGC_模型_0350"
---
# 如何快速低成本训练私有领域的 AIGC 模型？
[内容链接](https://www.zhihu.com/question/591858021/answer/2957689587)

**分享几个目前开源的方案给你参考一下，整体看起来还是用Lora微调一个大的开源的语言模型(ChatGLM，Alpaca)比较靠谱。**

## 斯坦福的Alpaca

斯坦福的 Alpaca 模型基于 LLaMA-7B 和指令微调，仅使用约 5 万条训练数据，就能达到类似 GPT-3.5 的效果。坦福基于 Meta 的 LLaMA 7B 模型微调出一个新模型 Alpaca。该

研究让 OpenAI 的 text-davinci-003 模型以 self-instruct 方式生成 52K 指令遵循（instruction-following）样本，以此作为 Alpaca 的训练数据。研究团队已将训练数据、生成训练数据的代码和超参数开源，后续还将发布模型权重和训练代码。

![图片描述](https://pic1.zhimg.com/v2-cfa3ef2652b45132ed3c9ffd81578650_r.jpg?source=2c26e567)

**资源列表**

- 项目地址：https://github.com/tatsu-lab/stanford_alpaca
- 试用地址：https://alpaca-ai-custom6.ngrok.io/

## 清华的ChatGLM-6B

ChatGLM-6B是清华大学[知识工程](https://www.zhihu.com/search?q=%E7%9F%A5%E8%AF%86%E5%B7%A5%E7%A8%8B&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A%222938112182%22%7D)和[数据挖掘](https://www.zhihu.com/search?q=%E6%95%B0%E6%8D%AE%E6%8C%96%E6%8E%98&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A%222938112182%22%7D)小组（Knowledge Engineering Group (KEG) & Data Mining at Tsinghua University）发布的一个开源的对话机器人。根据官方介绍，这是一个千亿参数规模的中英文[语言模型](https://www.zhihu.com/search?q=%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A%222938112182%22%7D)。并且对中文做了优化。本次开源的版本是其60亿参数的小规模版本，约60亿参数，本地部署仅需要6GB显存（INT4量化级别）。

资源列表：

代码仓库：

![图片描述](https://pic1.zhimg.com/v2-cc305ab1ac8d48cdf5a31749de05f2c2_r.jpg?source=2c26e567)

## ChatGLM--lora方案

一种平价的chatgpt实现方案，基于清华的+ LoRA 进行finetune.

代码仓：

代码仓：

![图片描述](https://pic1.zhimg.com/v2-eae5d62cf6aba2c54d2760c056b21db4_r.jpg?source=2c26e567)

## Alpaca-lora

Alpaca-Lora (羊驼-Lora)，可以认为是 ChatGPT 轻量级的开源版本，它使用 Lora (Low-rank Adaptation) 技术在 Meta 的 LLaMA 7B 模型上微调，只需要训练很小一部分参数就可以获得媲美 Standford Alpaca 模型的效果；

**资源列表**

- Alpaca-Lora 地址：https://github.com/tloen/alpaca-lora
- Standford Alpaca 地址：https://github.com/tatsu-lab/stanford_alpaca
- Lora 的论文地址：https://arxiv.org/abs/2106.09685
- LLaMA-7B-HF 模型地址：https://huggingface.co/decapoda-research/llama-7b-hf
- Lora 参数地址：https://huggingface.co/tloen/alpaca-lora-7b
- 如何优雅的下载huggingface-transformers模型: https://zhuanlan.zhihu.com/p/47

## ChatRWKV




> 1.**算力。**我平时用上百张A100训练，有需要可以用上千张。其实如果有经验，一个人就可以炼100B模型。训练代码：[GitHub - BlinkDL/RWKV-LM](https://link.zhihu.com/?target=https%3A//github.com/BlinkDL/RWKV-LM)ChatRWKV是对标ChatGPT的开源项目，希望做“大规模语言模型的Stable Diffusion”。 2.**数据。**有国外国内多个团队收集整理数据，包括收集RLHF数据。 3.**模型。**ChatRWKV采用我设计的RWKV架构（魔改RNN，是迄今唯一看齐transformer性能的纯RNN，梯度可以无限走，也能并行化，拥有RNN和transformer的所有优点），效率高于GPT（运行快，省显存，适合在端侧离线运行），不仅适用于语言模型，也有潜力成为未来AI模型的基础。现已scale到14B验证，等大语料发布后再逐步scale到100B+【补充为何RWKV这样强：RWKV几乎不碰信息channel，它们就只是exponential decay而已，没有更多的非线性。其它RNN在上面的非线性太多，容易破坏信息】。

资源列表：

代码仓：

中文教程：[PENG Bo：参与 ChatRWKV 项目，做开源 ChatGPT（可以在每个人电脑和手机直接运行的）](https://zhuanlan.zhihu.com/p/603840957)

## 中文Alpaca训练：

本项目基于，Stanford Alpaca 的目标是构建和开源一个基于LLaMA的模型。 Stanford Alpaca 的种子任务都是英语，收集的数据也都是英文，因此训练出来的模型未对中文优化。

本项目目标是促进中文对话大模型开源社区的发展。本项目针对中文做了优化，模型调优仅使用由ChatGPT生产的数据（不包含任何其他数据）。项目包含以下内容:

- 175个中文种子任务
- 生成数据的代码
- 0.5M生成的数据
- 基于BLOOMZ-7B1-mt优化后的模型

资源列表：

代码仓库：https//[http://github.com/LianjiaTech/BELLE](https://link.zhihu.com/?target=http%3A//github.com/LianjiaTech/BELLE)模型基于Bloom：[https//github.com/NouamaneTazi/bloomz.cpp](https://link.zhihu.com/?target=https%3A//github.com/NouamaneTazi/bloomz.cpp)

## 中文Alpaca-lora训练

这个模型是在Meta开源的LLaMA基础上，参考Alpaca和Alpaca-LoRA两个项目，对中文进行了训练，并且取得了初步的效果。

![图片描述](https://picx.zhimg.com/v2-91be56ee07721774100335779ccf5734_r.jpg?source=2c26e567)




**引用**

[https://zhuanlan.zhihu.com/p/615646636](https://zhuanlan.zhihu.com/p/615646636)

[https://www.zhihu.com/question/587479829/answer/2947645368](https://www.zhihu.com/question/587479829/answer/2947645368)
