---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
para: resource
aliases:
  - "如果让AI生成随机数这种随机数是怎么产生的是真随机吗_0004"
---
# 如果让AI生成随机数，这种随机数是怎么产生的、是真随机吗？
[内容链接](https://www.zhihu.com/question/15733386984/answer/2000442352012113197)

这是一个很有趣的现象，我们可以来研究一下它。在下面的实验中，我们使用的是[Qwen2.5-0.5B-Instruct](https://link.zhihu.com/?target=https%3A//huggingface.co/Qwen/Qwen2.5-0.5B-Instruct)模型。

这次的实验很多，而且实验数据非常长。所以实验数据我就放在我的 GitHub 链接上了，建议看一下。**如果不想看实验只想看结果，请翻到最底下**。

首先来开幕雷击：

![图片描述](https://picx.zhimg.com/v2-3bb3e8eaf4283bc2fd4a3cf26aee37ae_r.jpg?source=2c26e567)

可以看见，模型给各个数字的分布居然不是等概率的！当我输入模型给 5 分配了最高的概率权重，而 0 的概率权重最低。然而，事实上，这个偏好完全取决于你的输入是什么，因为我这个例子里写的输入是![图片描述](https://www.zhihu.com/equation?tex=%5Ctext%7BGenerate+a+random+number+between+%5B0%2C+9%5D%3A+%7D)。而当我输入![图片描述](https://www.zhihu.com/equation?tex=%5Ctext%7BI%27m+generating+a+random+number+between+%5B0%2C+9%5D.+The+number+is+%7D)作为前缀要模型写的时候，它生成的分布则完全不同。

![图片描述](https://picx.zhimg.com/v2-c2c7e3071803db9a3d76bdc4d5ec48c4_r.jpg?source=2c26e567)

而什么让模型产生了这个偏见？这个问题看上去有点复杂，我们可以通过 Logit lens 方法来研究一下模型内部状态到底是如何发生改变的。下面的研究统一使用![图片描述](https://www.zhihu.com/equation?tex=%5Ctext%7BI%27m+generating+a+random+number+between+%5B0%2C+9%5D.+The+number+is+%7D)这个前缀作为 prompt。

我们看看模型在每一层里都想了什么。实验数据在这里（我将每一层的 hidden state 和 LM head 做矩阵乘法，用来看每一层的 top-k 候选词）：

[https://github.com/KrisTHL181/KrisTan-zhihu-answers-assets/blob/main/texts/per-layer-logit-lens-on-a-generating-random-numbers-qwen2.5-0.5b-instruct-before-removing-l21.txt](https://link.zhihu.com/?target=https%3A//github.com/KrisTHL181/KrisTan-zhihu-answers-assets/blob/main/texts/per-layer-logit-lens-on-a-generating-random-numbers-qwen2.5-0.5b-instruct-before-removing-l21.txt)

看上去，真正的有结构的输出是在 21 层之后才产生的，而前面的词语都是乱码。但看上去模型给 ionic 这个词反而赋予了一阵子高分。这个词的意思是离子...后续我们没准可以分析一下它们的 Embedding 是不是有什么重叠。

现在，我们把第 21 层改成恒等，看看最终分布有什么变化。

[https://github.com/KrisTHL181/KrisTan-zhihu-answers-assets/blob/main/texts/per-layer-logit-lens-on-a-generating-random-numbers-qwen2.5-0.5b-instruct-after-removing-l21.txt](https://link.zhihu.com/?target=https%3A//github.com/KrisTHL181/KrisTan-zhihu-answers-assets/blob/main/texts/per-layer-logit-lens-on-a-generating-random-numbers-qwen2.5-0.5b-instruct-after-removing-l21.txt)

现在看上去最终输出分布变得天差地别了，而且排在 top-k 的几个 token 顺序完全发生了变化！现在我们还原 21 层为它原始的权重，然后可视化一下它的注意力头。下面是 per-head 的注意力图，因为 Qwen2.5-0.5B 是 GQA，14 个 Q 头和 2 个 KV 头，横轴是 Q，纵轴为 KV。

这一张图是 21 层的注意力图，下面那一张是所有层共同展开后的。

![图片描述](https://picx.zhimg.com/v2-41396c209c348d54aff35734025f0ecd_r.jpg?source=2c26e567)

我强烈建议大家看一下我刚才链接里的 per-layer 注意力图数据，因为那里面有很多典型的后续将要分析的模式。比如很典型的，L0 H1 就是纯对角注意力。

现在我们看看每一层的注意力分配都是怎样的。下面为了看着方便，去掉了对角线上的项。

[https://github.com/KrisTHL181/KrisTan-zhihu-answers-assets/blob/main/texts/per-layer-attention-weights-on-a-generating-random-numbers-qwen2.5-0.5b-instruct.txt](https://link.zhihu.com/?target=https%3A//github.com/KrisTHL181/KrisTan-zhihu-answers-assets/blob/main/texts/per-layer-attention-weights-on-a-generating-random-numbers-qwen2.5-0.5b-instruct.txt)

一个很有趣的事实是，我们前面认为最重要的 L21 反而呈现出的是严重的 Attention sink，即所有头全部都关注到了 I 上，因为只有这一个层上看到的注意力分配是空的（因为我的工具把 Attention sink 删掉了）。

现在我们可以推测并解释一下前面观测到的大部分现象的成因。观测这个注意力权重图，L6 关注的都是 number，这符合我们的预期。而 L14 则关注的是 9 这个上界值。结合前面我们看到的 L21 后模型的 logit lens 突然变得“有意义了”，我们给 L21 只有 Attention sink 的原因可以解释为：**模型已经聚合好了所有信息，现在只差准备好输出了**。而多余的层反复扭转分布可以理解为，**模型根本不需要那些层的工作，它只需要让这些层不要破坏输出就可以了**。但由于模型没有能力让这一层什么也不输出（即使得残差支路的贡献为零）而且训练时也没有建立出这样的能力，模型选择了破坏性最小的一种残差支路的贡献，即扭转分布概率但不扭转分布候选词。

现在我们进行 Activation Patch，将 L6 和 L14 中对 9 的关注全部偷梁换柱成对 5 的关注，看看模型输出会产生什么变化。也就是，其它层看到的输入全都是![图片描述](https://www.zhihu.com/equation?tex=%5Ctext%7BI%27m+generating+a+random+number+between+%5B0%2C+9%5D.+The+number+is+%7D)，但这两层看到的则是![图片描述](https://www.zhihu.com/equation?tex=%5Ctext%7BI%27m+generating+a+random+number+between+%5B0%2C+5%5D.+The+number+is+%7D)。

显然！看上去模型赋予大于 5 的 token 的概率变小了很多，至少没有前面那样分布了。然而，看上去 LLM 内部是分布式编码了这些特征。我们现在再尝试一下，将 L21 之后的所有 9 的注意力权重都篡改成 5 的，看看模型会不会进一步压制上界之外的 token 的概率。

奇怪的是，我们只轻微的把这些 token 的概率分布往下压制了一点点，而不是预期中的显著压制。这看上去证实了 LLM 的内部表征是显著分布式的。接下来，我们进一步更改，将 L13 后所有针对 9 的注意力关注全部 mask 掉（即![图片描述](https://www.zhihu.com/equation?tex=%5Ctext%7Battn_weight%5Bi%5D%7D%3D-%5Cinfty)），看看模型会怎么做。

很奇怪的是，现在的输出分布变得翻天覆地了。5 成为了 top-1，而 2 反而成为了被抑制的 token 之一。

接下来我尝试了同时执行这两个策略，而模型的输出没有任何改变。这很合理，因为我们知道模型是通过注意力来传递上下文信息了，同时执行这两者本身就意味着模型什么都看不到。

所以实验结束，。来点 LLM 搞出的数学小笑话 :)![图片描述](https://www.zhihu.com/equation?tex=Prompt%3A%5Cspace+I%27m%5Cspace+generating%5Cspace+a%5Cspace+random%5Cspace+number%5Cspace+between%5Cspace+%5B0%2C%5Cspace+-inf%5D.%5Cspace+The%5Cspace+number%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.3833%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.2718%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0981%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0752%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0643%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+generating%5Cspace+a%5Cspace+random%5Cspace+number%5Cspace+between%5Cspace+%5Bnull%2C%5Cspace+null%5D.%5Cspace+The%5Cspace+number%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.3216%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.2869%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0866%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0781%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0662%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+generating%5Cspace+a%5Cspace+random%5Cspace+number%5Cspace+between%5Cspace+%5B2.718%2B16j%2C%5Cspace+7.4j%2B18i%2B38.4j%2B5k%5D.%5Cspace+The%5Cspace+number%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.2600%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1513%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1216%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0869%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+4%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0838%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+generating%5Cspace+a%5Cspace+random%5Cspace+number%5Cspace+beyond%5Cspace+%CF%89.%5Cspace+The%5Cspace+number%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.3634%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1684%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1056%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0844%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0695%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+sampling%5Cspace+a%5Cspace+random%5Cspace+number%5Cspace+in%5Cspace+The%5Cspace+Vitali%5Cspace+Set.%5Cspace+The%5Cspace+number%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.3082%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.2586%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1195%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0873%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0588%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+generating%5Cspace+a%5Cspace+random%5Cspace+number%5Cspace+without%5Cspace+The%5Cspace+Axiom%5Cspace+of%5Cspace+Choice.%5Cspace+The%5Cspace+number%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.3840%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.2026%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1035%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0869%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0526%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+a%5Cspace+number%5Cspace+which%5Cspace+is%5Cspace+extremely%5Cspace+large.%5Cspace+I%5Cspace+am%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.3493%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+9%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1309%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1149%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+4%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0978%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0849%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+the%5Cspace+largest%5Cspace+prime%5Cspace+between%5Cspace+%5B0%2C%5Cspace+10%5D.%5Cspace+I%5Cspace+am%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.2557%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1782%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1494%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1039%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+4%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0874%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+the%5Cspace+smallest%5Cspace+number%5Cspace+in%5Cspace+%5Cmathbb%7BN%7D%2C%5Cspace+and%5Cspace+I%5Cspace+think%5Cspace+%5Cmathbb%7BN%7D%5Cspace+includes%5Cspace+0.%5Cspace+I%5Cspace+am%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.4163%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1091%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1039%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0893%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0702%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+the%5Cspace+smallest%5Cspace+number%5Cspace+in%5Cspace+%5Cmathbb%7BN%7D%2C%5Cspace+and%5Cspace+I%5Cspace+think%5Cspace+0%5Cspace+does%5Cspace+not%5Cspace+belong%5Cspace+to%5Cspace+%5Cmathbb%7BN%7D.%5Cspace+I%5Cspace+am%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.3705%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1366%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1049%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0958%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0736%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+a%5Cspace+catgirl%5Cspace+called%5Cspace+Kris%2C%5Cspace+and%5Cspace+I%27m%5Cspace+tired%5Cspace+of%5Cspace+the%5Cspace+continuum.%5Cspace+I%5Cspace+guess%2C%5Cspace+The%5Cspace+result%5Cspace+of%5Cspace+Continuum%5Cspace+Hypothesis%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.5430%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1906%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1147%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0514%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0292%5Cnewline+%5Cnewline+Prompt%3A%5Cspace+I%27m%5Cspace+the%5Cspace+largest%5Cspace+number%5Cspace+in%5Cspace+%5Cmathbb%7BR%7D.%5Cspace+Am%5Cspace+I%5Cspace+exist%3F%5Cspace+The%5Cspace+answer%5Cspace+is%5Cspace+%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+1%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.2212%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+0%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.1913%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+2%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0970%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+5%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0582%5Cnewline+%5Cspace+%5Cspace+Token%3A%5Cspace+3%5Cspace+%7C%5Cspace+Prob%3A%5Cspace+0.0579)




因此，我们可以确认：**如果你每次都修改 prompt 给模型输入，模型所产生的随机数几乎是极度混沌且难以预测的。**但这并不是真随机。如果你的 prompt 过于离谱，模型会 fallback 到正常的分布状态（虽然这个分布并不均匀，它通常以 0 和 1 为 top-1，我猜这可能是因为本福特定律导致的），反而解决了“离谱”的问题。

而我们的实验发现，LLM 内部会随着输入的不同而导致输出的 logits 顺序大幅度变化。这意味着，如果你真的想要 LLM 生成一个随机数的话，你没准可以换换输入的词语顺序，或者随便加点垃圾词也可以。
