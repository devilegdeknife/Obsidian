---
type: resource
source: zhihu
url: https://zhuanlan.zhihu.com/p/613538508
topics: [AI, 模型训练, 机器学习, 工程, 性能, 软件工程]
status: processed
para: resource
tags: []
created: 2026-02-02
updated: 2026-02-11
---
# 改变几行代码，PyTorch炼丹速度狂飙、模型优化时间大减
[内容链接](https://zhuanlan.zhihu.com/p/613538508)

> 关于 PyTorch 炼丹，本文作者表示：「如果你有 8 个 GPU，整个训练过程只需要 2 分钟，实现 11.5 倍的性能加速。」

选自Sebastian Raschka博客，**机器之心编译。**

如何提升 PyTorch「炼丹」速度？

最近，知名机器学习与 AI 研究者 Sebastian Raschka 向我们展示了他的绝招。据他表示，他的方法在不影响模型准确率的情况下，仅仅通过改变几行代码，将 BERT 优化时间从 22.63 分钟缩减到 3.15 分钟，训练速度足足提升了 7 倍。

![图片描述](https://pic4.zhimg.com/v2-78cf246b2ee0cf934d79c12fbf15c03d_r.jpg)

作者更是表示，如果你有 8 个 GPU 可用，整个训练过程只需要 2 分钟，实现 11.5 倍的性能加速。

![图片描述](https://pica.zhimg.com/v2-3c62ade86f9e198363a492124c3612b8_r.jpg)

下面我们来看看他到底是如何实现的。

**让 PyTorch 模型训练更快**

首先是模型，作者采用 DistilBERT 模型进行研究，它是 BERT 的精简版，与 BERT 相比规模缩小了 40%，但性能几乎没有损失。其次是数据集，训练数据集为大型电影评论数据集 IMDB Large Movie Review，该数据集总共包含 50000 条电影评论。作者将使用下图中的 c 方法来预测数据集中的影评情绪。

![图片描述](https://pic2.zhimg.com/v2-ac383c6ed9df13a3b2818f616d42046d_r.jpg)

基本任务交代清楚后，下面就是 PyTorch 的训练过程。为了让大家更好地理解这项任务，作者还贴心地介绍了一下热身练习，即如何在 IMDB 电影评论数据集上训练 DistilBERT 模型。如果你想自己运行代码，可以使用相关的 Python 库设置一个虚拟环境，如下所示：

![图片描述](https://pic1.zhimg.com/v2-84c1408ae6f7239047c1c2f560ecb0d6_r.jpg)

相关软件的版本如下：

****

现在省略掉枯燥的数据加载介绍，只需要了解本文将数据集划分为 35000 个训练示例、5000 个验证示例和 10000 个测试示例。需要的代码如下：

![图片描述](https://pica.zhimg.com/v2-ec0d21212c4e73d686421ec805659ef6_r.jpg)

完整代码地址：[https://github.com/rasbt/faster-pytorch-blog/blob/main/1_pytorch-distilbert.py](https://link.zhihu.com/?target=https%3A//github.com/rasbt/faster-pytorch-blog/blob/main/1_pytorch-distilbert.py)

然后在 A100 GPU 上运行代码，得到如下结果：

![图片描述](https://pic2.zhimg.com/v2-7c36b03e77e1a2f4e460a5b49172139d_r.jpg)

正如上述代码所示，模型从第 2 轮到第 3 轮开始有一点过拟合，验证准确率从 92.89% 下降到了 92.09%。在模型运行了 22.63 分钟后进行微调，最终的测试准确率为 91.43%。

**使用 Trainer 类**

接下来是改进上述代码，改进部分主要是把 PyTorch 模型包装在 LightningModule 中，这样就可以使用来自 Lightning 的 Trainer 类。部分代码截图如下：

![图片描述](https://pica.zhimg.com/v2-98b1f5896f1bb87e837254b4798a55bc_r.jpg)

完整代码地址：[https://github.com/rasbt/faster-pytorch-blog/blob/main/2_pytorch-with-trainer.py](https://link.zhihu.com/?target=https%3A//github.com/rasbt/faster-pytorch-blog/blob/main/2_pytorch-with-trainer.py)

上述代码建立了一个 LightningModule，它定义了如何执行训练、验证和测试。相比于前面给出的代码，主要变化是在第 5 部分（即 ### 5 Finetuning），即微调模型。与以前不同的是，微调部分在 LightningModel 类中包装了 PyTorch 模型，并使用 Trainer 类来拟合模型。

![图片描述](https://pic4.zhimg.com/v2-59c020d009e32942232368b6e32cddc7_r.jpg)

之前的代码显示验证准确率从第 2 轮到第 3 轮有所下降，但改进后的代码使用了 ModelCheckpoint 以加载最佳模型。在同一台机器上，这个模型在 23.09 分钟内达到了 92% 的测试准确率。

![图片描述](https://pica.zhimg.com/v2-18a0d9c2be3f18067660f673a1fd2d1e_r.jpg)

需要注意，如果禁用 checkpointing 并允许 PyTorch 以非确定性模式运行，本次运行最终将获得与普通 PyTorch 相同的运行时间（时间为 22.63 分而不是 23.09 分）。

**自动混合精度训练**

进一步，如果 GPU 支持混合精度训练，可以开启 GPU 以提高计算效率。作者使用自动混合精度训练，在 32 位和 16 位浮点之间切换而不会牺牲准确率。

![图片描述](https://pic2.zhimg.com/v2-d6fd5a6dcdb8f77603cc3d1a17cf4399_r.jpg)

在这一优化下，使用 Trainer 类，即能通过一行代码实现自动混合精度训练：

![图片描述](https://pic1.zhimg.com/v2-23cfaea755f2f2898cc78da561b9af14_r.jpg)

上述操作可以将训练时间从 23.09 分钟缩短到 8.75 分钟，这几乎快了 3 倍。测试集的准确率为 92.2%，甚至比之前的 92.0% 还略有提高。

![图片描述](https://picx.zhimg.com/v2-ba955bdd3c91c27a56b2e4e614effb51_r.jpg)

**使用 Torch.Compile 静态图**

最近 PyTorch 2.0 公告显示，PyTorch 团队引入了新的 toch.compile 函数。该函数可以通过生成优化的静态图来加速 PyTorch 代码执行，而不是使用动态图运行 PyTorch 代码。

![图片描述](https://pica.zhimg.com/v2-9c9ba548c2621e59dda3cbff00f02074_r.jpg)

由于 PyTorch 2.0 尚未正式发布，因而必须先要安装 torchtriton，并更新到 PyTorch 最新版本才能使用此功能。

![图片描述](https://pica.zhimg.com/v2-56cc4a3cc3723bb5434fab5275e1c4f2_r.jpg)

然后通过添加这一行对代码进行修改：

![图片描述](https://pic4.zhimg.com/v2-10124e9bddff450878b2b8e7dbde229f_r.jpg)

**在 4 块 GPU 上进行分布式数据并行**

上文介绍了在单 GPU 上加速代码的混合精度训练，接下来介绍多 GPU 训练策略。下图总结了几种不同的多 GPU 训练技术。

![图片描述](https://pic3.zhimg.com/v2-a09975272e825c69681980f50fab5358_r.jpg)

想要实现分布式数据并行，可以通过 DistributedDataParallel 来实现，只需修改一行代码就能使用 Trainer。

![图片描述](https://pic4.zhimg.com/v2-adc2a43d91023aa3681358dcc0b935e5_r.jpg)

经过这一步优化，在 4 个 A100 GPU 上，这段代码运行了 3.52 分钟就达到了 93.1% 的测试准确率。

![图片描述](https://pic1.zhimg.com/v2-dd67d99fd048c9bd010eaf1075afbdea_r.jpg)

![图片描述](https://picx.zhimg.com/v2-8c422a9bcda78ce865879e2e77a7f523_r.jpg)

**DeepSpeed**

最后，作者探索了在 Trainer 中使用深度学习优化库 DeepSpeed 以及多 GPU 策略的结果。首先必须安装 DeepSpeed 库：

![图片描述](https://pic2.zhimg.com/v2-3d0a3ef8c777a9fe59e85cf6ffa980c5_r.jpg)

接着只需更改一行代码即可启用该库：

![图片描述](https://pic2.zhimg.com/v2-4c53a1eb9417eaae98abb6ce30242bd1_r.jpg)

这一波下来，用时 3.15 分钟就达到了 92.6% 的测试准确率。不过 PyTorch 也有 DeepSpeed 的替代方案：fully-sharded DataParallel，通过 strategy="fsdp" 调用，最后花费 3.62 分钟完成。

![图片描述](https://pic4.zhimg.com/v2-a14eefb0bbc00c841dcd2882d1408085_r.jpg)

以上就是作者提高 PyTorch 模型训练速度的方法，感兴趣的小伙伴可以跟着原博客尝试一下，相信你会得到想要的结果。