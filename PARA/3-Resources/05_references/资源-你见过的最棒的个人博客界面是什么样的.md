---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
para: resource
aliases:
  - "你见过的最棒的个人博客界面是什么样的_0344"
---
# 你见过的最棒的个人博客界面是什么样的？
[内容链接](https://www.zhihu.com/question/29755481/answer/2972485583)

最近刚好在折腾，然后结合GitHub上的大佬的框架 ，将**个人笔记**和个人博客整合到了一起。

实现**笔记写文**->**博客自动更新**

**我的小站（建设中）：**

[Polaris的小站 | Polaris的相知识栈，介绍互联网上的各种效率提升工具，行业开发经验等等](https://link.zhihu.com/?target=https%3A//www.lpolaris.com/)

无需服务器，全程花费仅仅只需一个域名的费用，就能获得良好的体验

让你将更多的精力更集中在内容生产上面，并且该博客还支持：

- 谷歌广告
- 多主题切换
- 文章加密访问

以下为我的文章内容：

[PolarisAspire：Notion无需服务器快速建站](https://zhuanlan.zhihu.com/p/619994811)

[PolarisAspire：NotionNext博客添加评论插件](https://zhuanlan.zhihu.com/p/620872848)

上一期给大家推荐了，如何获取**Notion Plus**

[PolarisAspire：小白级稳定的Notion Plus获取指南](https://zhuanlan.zhihu.com/p/619068383)

这一期的话，再来分享一下，如何将你的**Notion笔记**直接转化为**个人博客网站**

将自己的笔记与网站打通

（这下感觉终于有了一个能够在互联网上顺畅输出内容的地盘了）

虽然我能够折腾出n种其他建站方式，但是现在如果主力采用**Notion**写作与做知识管理的话，其他方式对我来说过于笨重了。

如果能够打通Notion笔记本与网站的话，那还是能让我更好将精力集中在写作本身之上。

我这里采用的是**NotionNext**建站的方式

[https://github.com/tangly1024/NotionNext](https://link.zhihu.com/?target=https%3A//github.com/tangly1024/NotionNext)

懒人的话采用 Vercel托管部署，用免费的套餐就可以了

后续**如果资金充裕**的话，还是建议将网站部署在服务器上

以下教程参考：

[NotionNext部署-Vercel版本 | TANGLY’s BLOG](https://link.zhihu.com/?target=https%3A//tangly1024.com/article/vercel-deploy-notion-next)

## 1.准备好Notion页面

这里默认已经注册好了**Notion**账号

## 1.1 将建站模板数据复制到你的Notion

[https://tanghh.notion.site/02ab3b8678004aa69e9e415905ef32a5?v=b7eb215720224ca5827bfaa5ef82cf2d](https://link.zhihu.com/?target=https%3A//www.notion.so/02ab3b8678004aa69e9e415905ef32a5)

打开模板页面

点击**Duplicate**

![图片描述](https://pic1.zhimg.com/v2-8bc5fbc20680cd04a32f4ca75fd49beb_r.jpg?source=2c26e567)

## 1.2开启页面分享权限

![图片描述](https://picx.zhimg.com/v2-34e3a3ed066c24e22707b1d6cdd19e4f_r.jpg?source=2c26e567)

## 1.3记住页面ID

后面建站的数据都将从该页面进行获取，相当于你的数据库

**选择将页面连接Copy出来**

![图片描述](https://pic1.zhimg.com/v2-f4f0a466d2566af4813ae2ccb62ef626_r.jpg?source=2c26e567)

**链接中间的一段就是你的ID**

![图片描述](https://picx.zhimg.com/v2-b7978ebdf7a244ba34b01f41e4a46e21_r.jpg?source=2c26e567)

## 2.从GitHub上Fork项目仓库

[https://github.com/transitive-bullshit/nextjs-notion-starter-kit](https://link.zhihu.com/?target=https%3A//github.com/transitive-bullshit/nextjs-notion-starter-kit)

就是将这个开源作者的仓库，复制一份到你的GitHub账号里

![图片描述](https://picx.zhimg.com/v2-ffcf9c6d9a516780b39628ac80d41f5a_r.jpg?source=2c26e567)

## 3.将项目导入Vercel

## 3.1 注册Vercel

[Vercel: Develop. Preview. Ship. For the best frontend teams](https://link.zhihu.com/?target=https%3A//vercel.com/)

![图片描述](https://picx.zhimg.com/v2-2e19c68b51eb69b610519d30a0243510_r.jpg?source=2c26e567)

选择个人身份

![图片描述](https://pica.zhimg.com/v2-bbfd5e0b2298923ca137e62fcd86e775_r.jpg?source=2c26e567)

选择GitHub进行连接

![图片描述](https://picx.zhimg.com/v2-8a0492d1912cef3e47f1e339433acf8f_r.jpg?source=2c26e567)

## 3.2导入你的GitHub仓库

[Dashboard – Vercel](https://link.zhihu.com/?target=https%3A//vercel.com/dashboard)

![图片描述](https://picx.zhimg.com/v2-985b25be239c4149c7539d2941bf8dcf_r.jpg?source=2c26e567)

![图片描述](https://picx.zhimg.com/v2-9a07837bd51a56a5b64759f498fae07e_r.jpg?source=2c26e567)

注意，需要在环境变量里添加：

**NOTION_PAGE_ID****：****第一步里你的模板页面的Notion页面ID**

![图片描述](https://picx.zhimg.com/v2-6477bd91fcc46eb8422bbba5ab0c3693_r.jpg?source=2c26e567)

最后按下部署即可

![图片描述](https://picx.zhimg.com/v2-1b941c305832d609f46858552cc3ae79_r.jpg?source=2c26e567)

## 4.部署完成

点击Visit可前往查看你的网站

![图片描述](https://pica.zhimg.com/v2-0fded69e4ad42ffeb0584c0c606917f2_r.jpg?source=2c26e567)

## 5.配置自己的域名

因为vercel的ip被DNS污染，所以建议使用自己的域名进行解析

我这里直接设置根域名

![图片描述](https://picx.zhimg.com/v2-8c83133a2f626a477e1069d3acb25169_r.jpg?source=2c26e567)

![图片描述](https://picx.zhimg.com/v2-97d7bb17354aaade4fbcff104b232501_r.jpg?source=2c26e567)

这里需要配置**[http://lpolaris.com]****的A解析**，以及**[http://www.lpolaris.com]**的**CNAME 解**析

![图片描述](https://picx.zhimg.com/v2-7cacbee066e46ec9c3715f9477a50f8b_r.jpg?source=2c26e567)

我的域名是放在**cloudflare**的，如果购买的是其他平台域名，操作都是类似的

![图片描述](https://picx.zhimg.com/v2-3bb8329bf03a3295194c531ab9e26c6b_r.jpg?source=2c26e567)

![图片描述](https://pic1.zhimg.com/v2-4f0673afa7e1206049edd54c1c9033a0_r.jpg?source=2c26e567)

现在就可以愉快的访问：

[Notion无需服务器快速建站 | Polaris的小站](https://link.zhihu.com/?target=https%3A//www.lpolaris.com/article/notionweb)

## 6.简单的修改你的网站

## 6.1 修改 blog.config.js

![图片描述](https://pic1.zhimg.com/v2-3cefe09109346af65390befddc3d5226_r.jpg?source=2c26e567)

建议仔细阅读以下相关配置的内容

![图片描述](https://picx.zhimg.com/v2-bc2cbafbaf2eba1766e679ce818146c3_r.jpg?source=2c26e567)

## 6.2在Notin上填充网站内容

实际上，此时的Notion就相当于是你的数据库了，上面的博客网站会根据这个DataBase进行加载内容

当你在 Notion上进行了修改后，网站也会自动同步过去

![图片描述](https://pic1.zhimg.com/v2-b526904fbec859f7fa715796fbd513f5_r.jpg?source=2c26e567)

## 7.尾语

题主本人，网站也还在建设中，需要学习的还有很多，就先介绍这么多啦！

知乎上的文章，晚点我也会慢慢同步过去，这下不用担心，**知识的荒原**

后面本人网站也会持续更新的，如果想了解更多，可以关注我哦~

![图片描述](https://picx.zhimg.com/v2-759d7f05641e86391e146ea71fdfd0b1_r.jpg?source=2c26e567)
