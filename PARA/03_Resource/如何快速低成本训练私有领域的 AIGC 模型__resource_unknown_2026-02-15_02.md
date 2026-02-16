---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
para: resource
aliases:
  - "如何快速低成本训练私有领域的_AIGC_模型_0351"
---
# 如何快速低成本训练私有领域的 AIGC 模型？
[内容链接](https://www.zhihu.com/question/591858021/answer/2957160875)

可以试试用 LLaMA 做 fine-tuning 来构建自己的模型。开源社区已有的是 Stanford 基于 LLaMA 的[Alpaca](https://link.zhihu.com/?target=https%3A//github.com/tatsu-lab/stanford_alpaca)和随后出现的 LoRA 版本[Alpaca-LoRA](https://link.zhihu.com/?target=https%3A//github.com/tloen/alpaca-lora)。

[https://github.com/tloen/alpaca-lora​github.com/tloen/alpaca-lora](https://link.zhihu.com/?target=https%3A//github.com/tloen/alpaca-lora)

[Alpaca](https://link.zhihu.com/?target=https%3A//github.com/tatsu-lab/stanford_alpaca)宣称只需要**600$**不到的成本（包括创建数据集），便可以让 LLaMA 7B 达到近似 text-davinci-003 的效果。而[Alpaca-LoRA](https://link.zhihu.com/?target=https%3A//github.com/tloen/alpaca-lora)则在此基础上，让我们能够以一块**消费级显卡**，在**几小时内**完成 7B 模型的 fine-turning。

下面是开源社区成员分享的可以跑通的硬件规格及所需时间：




根据大家分享的信息，fine-tune 7B 模型**仅需要 8-10 GB vram。**因此我们很有可能可以在 Google Colab 上完成你所需要的 fine-tune！

那么，说干就干！

![图片描述](https://picx.zhimg.com/50/v2-ed8110cefbd7b766dc0ee14cbdfc9fd6_720w.jpg?source=2c26e567)

## 计划

那么，为了训练自己的 Chat我们需要做那些事儿呢? 理论上需要如下步骤：

## 第一步：准备数据集

fine-tune 的目标通常有两种：

- 像 Alpaca 一样，收集 input/output 生成 prompt 用于训练，让模型完成特定任务
- 语言填充，收集文本用于训练，让模型补全 prompt。

以第一种目标为例，假设我们的目标是让模型讲中文，那么，我们可以通过其他 LLM （如 text-davinci-003）把一个现有数据集（如[Alpaca](https://link.zhihu.com/?target=https%3A//github.com/tatsu-lab/stanford_alpaca/blob/main/alpaca_data.json)）翻译为中文来做 fine-tune。实际上这个想法已经在开源社区已经有人[实现](https://link.zhihu.com/?target=https%3A//github.com/LC1332/Chinese-alpaca-lora)了。

## 第二步：训练并 apply LoRA

在第一步准备的数据集上进行 fine-tune。

## 第三步：合并模型（可选）

合并 LoRA 与 base 可以加速推理，并帮助我们后续 Quantization 模型。

## 第四步：quantization（可选）

最后，Quantization 可以帮助我们加速模型推理，并减少推理所需内存。这方面也有开源的工具可以直接使用。

[https://github.com/megvii-research/Sparsebit/blob/main/large_language_models/llama/quantization/README.md​github.com/megvii-research/Sparsebit/blob/main/large_language_models/llama/quantization/README.md](https://link.zhihu.com/?target=https%3A//github.com/megvii-research/Sparsebit/blob/main/large_language_models/llama/quantization/README.md)

## 实践

柿子挑软的捏，我们从简单的目标开始：让模型讲中文。

为了达成这个目标，我使用的数据集是[Luotuo](https://link.zhihu.com/?target=https%3A//github.com/LC1332/Chinese-alpaca-lora)作者翻译的 Alpaca 数据集，训练代码主要来自[Alpaca-LoRA](https://link.zhihu.com/?target=https%3A//github.com/tloen/alpaca-lora/blob/main/generate.py)。

## 准备

由于我打算直接使用 Alpaca-LoRA 的代码，我们先 clone Alpaca-LoRA：

下载数据集：

创建虚拟环境并安装依赖（需要根据不同环境的 cuda 版本调整）：

## 训练

单卡选手很简单，可以直接执行：

双卡选手相对比较麻烦，需要执行：

在我的环境下（2 * RTX 3090 Ti 24GB），需要额外配置 micro_batch_size 避免 OOM。

推荐的其他额外参数：

训练的过程比较稳定，我在训练过程中一直在用[nvitop](https://link.zhihu.com/?target=https%3A//pypi.org/project/nvitop/)查看显存和显卡的用量：

![图片描述](https://picx.zhimg.com/v2-44175df41ebae8a1c081f49513ffd9fc_r.jpg?source=2c26e567)

下面是我训练时模型收敛的情况，可以看到差不多 2 epochs 模型就收敛的差不多了：







## 推理

单卡选手可以直接执行：

双卡选手还是会麻烦点，由于现在还不支持双卡推理，我手动修改了 generate.py，添加了第 47 行：

![图片描述](https://pic1.zhimg.com/v2-caed9fee0c6bb9ec8f091c2f3db0a079_r.jpg?source=2c26e567)

而后，执行上面的命令即可。

如果你的推理运行在服务器上，想要通过其他终端访问，可以给[launch](https://link.zhihu.com/?target=https%3A//gradio.app/docs/%23interface-launch-header)方法添加参数：

此时打开浏览器，享受你的工作成果吧 :D

## 加速推理

Alpaca-LoRA 提供了一些脚本，如 export_hf_checkpoint.py 来合并模型。合并后的模型可以通过[llamap.cpp](https://link.zhihu.com/?target=https%3A//github.com/ggerganov/llama.cpp)等项目达到更好的推理性能。

## 测试

最后，让我们对比下原生 Alpaca 与自己 fine-tune 的 Alpaca，看看 fine-tune 到底有没有让模型学会讲中文吧！

## Good Examples







## Bad Examples







可以看出模型确实在讲中文，也能依据中文的指令和输入完成一些工作。但是由于 LLaMA 本身训练数据大部分为英文以及 Alpaca 数据集翻译后的质量不足，我们的模型有些时候效果不如原生 Alpaca。此时不得不感叹**高质量数据对 LLM 的重要性**。

## 总结

作为一个分布式系统方向的工程师，fine-tune 一个 LLM 的过程遇到了不少问题，也有很多乐趣。虽然 LLaMA 7B 展现出的能力还比较有限，我还是很期待后面开源社区进一步的工作。
