---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
para: resource
aliases:
  - "现在Agent_Skills_那么火有什么强烈推荐的Agent_Skills吗_0012"
---
# 现在Agent Skills 那么火，有什么强烈推荐的Agent Skills吗？
[内容链接](https://www.zhihu.com/question/1992605969721616211/answer/1997000627688056297)

skills就是prompt统一规范的docker。

本文不光是告诉你有哪些Skill，并告诉你怎样做，并如何设计自己的skill。

授以码，不如授以敲。

经常写代码的都知道一点。

就是LLM会失忆，到了LLM Agent还是会失忆。

用这个SKILL就能解决。

Project-memory，是能把自动化保持Claude Code的项目上下文（从CLAUDE.md链接小型markdown文件，追踪决策、bug、关键事实）的Skill。

这是我刚找到的SKILL，相当好用。

这个Skill专门解决LLM失忆的问题。

因为Skills很火，但是Skills真正有用的，会用的很少。

在讲project-memory之前，得先说清楚skill是什么。

说白了，skill就是给AI装的"专业技能包"。

![图片描述](https://picx.zhimg.com/v2-7c22d2000b26a8f84465b9ad3b4e9028_r.jpg?source=2c26e567)

技术上讲，它就是一个包含SKILL.md文件的文件夹，加上一些可选的支持资源。

你说"帮我设置项目记忆"，Claude不用猜——直接加载经过测试的专用指令，知道该干嘛。

一句话激活专家模式。

SKILL.md分两部分：

![图片描述](https://pic1.zhimg.com/v2-b5603417d89564d4c34f209535a26b29_r.jpg?source=2c26e567)

![图片描述](https://pic1.zhimg.com/v2-369e3c176057d7c21fe19db29a04bd58_r.jpg?source=2c26e567)

Skill如何神奇？

是放在什么地方？

可以放在不同位置：

![图片描述](https://picx.zhimg.com/v2-3889357c8b3eccc9a84b2d7cc14fce0b_r.jpg?source=2c26e567)

这玩意儿的关键在于渐进式披露，只在需要时加载需要的内容。

![图片描述](https://pic1.zhimg.com/v2-968527aeb3ab1642e4aef14404f31de7_r.jpg?source=2c26e567)

等于你在家搞了一个图书馆，先看目录，匹配到了才去书架拿书。

所以你装几十个skill也不会拖慢正常交互。

你知道Skill是什么了，接下来进入正题！

project-memory怎么设计的？

![图片描述](https://pica.zhimg.com/v2-f972da2ad27bf5b73e2a3ffb02be7878_r.jpg?source=2c26e567)

在创建四个专用文件：

![图片描述](https://pic1.zhimg.com/v2-97de6da9c2f477ba25fce9dfb4b47480_r.jpg?source=2c26e567)

这里有人提过问的！

为什么用而不是或？

你把文件放！

放？

主要是命名策略，要用正式的你命名，才能一眼就知道是什么文件。

SKILL.md的description字段是最关键的一行：

![图片描述](https://picx.zhimg.com/v2-e1a0d949deae18d1f2c0cb373bb09143_r.jpg?source=2c26e567)

注意看，description里嵌入了触发短语：

- “set up project memory”
- “track our decisions”
- “log a bug fix”
- “update project memory”
- “initialize memory system”

就像设置手机快捷指令，说"记账"自动打开记账App。

用description来激活。

![图片描述](https://pic1.zhimg.com/v2-b4fd10bdb037a0f704ef72396a352a2b_r.jpg?source=2c26e567)

Prevention字段把坑变路标。多写一行Prevention，省未来一小时。

![图片描述](https://picx.zhimg.com/v2-68ace18686b96644d760af6f1b2250f3_r.jpg?source=2c26e567)

架构决策用ADR格式（ADR格式）：

![图片描述](https://picx.zhimg.com/v2-140864e9ffd9c91fc3e916b37496ee21_r.jpg?source=2c26e567)

一致格式让Claude数月后仍可可靠解析。

在CLAUDE.md里配置Memory-Aware Protocols，是最关键的。

![图片描述](https://picx.zhimg.com/v2-661e7fbcb967110a1ecbfccd7a355172_r.jpg?source=2c26e567)

以前你得说"先查查bug记录"，，。

给AI装了"下意识"，不用你提醒，它自己就会先查记忆。

写进协议，Claude自动长记性。

使用流程为：

- 安装并设置project memory
- 添加一条key_facts记录（常忘的URL或端口）
- 修bug时记录到bugs.md
- 记录一个架构决策到decisions.md
- 问Claude之前记录的内容

说了这么多，到底管不管用？

例如，在Pulumi部署报错"update failed"，错误信息不知道怎搞。

正常是要这样做的。

花费45分钟：

- 检查IAM权限
- 审查最近变更
- 尝试各种部署策略
- 最终发现：pulumi refresh --yes同步状态文件

![图片描述](https://pic1.zhimg.com/v2-cd9b5e4a2a781bbc279ed80d1fa7bda8_r.jpg?source=2c26e567)

再次出现问题，只要让Claude Code检查Bugs.md。

就能找到BUG，并建议，五分钟解决。

![图片描述](https://pic1.zhimg.com/v2-32eac6f3e350faa6af95d1ce044698ca_r.jpg?source=2c26e567)

效果很明显：

![图片描述](https://picx.zhimg.com/v2-398ad253955d51682b1e98bd931b156e_r.jpg?source=2c26e567)

直接就是Claude不只是修bug，它开始预防bug。

一个Skill还可以多平台多工具使用：

project-memory遵循Agent Skill Standard（），同一skill可跨14+种AI编程助手工作。

团队里有人用Claude Code，有人用Cursor，有人用Gemini？

没关系，所有人共享同一份项目记忆。

![图片描述](https://picx.zhimg.com/v2-3ca740b2a2aa516bd7fabd9b776d8d1c_r.jpg?source=2c26e567)

项目会越做越顺，不是越做越累。

但用这个skill，要注意的安全性。

key_facts.md是版本控制的markdown，任何能clone的人都能看到里面的内容。

禁止的存储项：

![图片描述](https://picx.zhimg.com/v2-50ce33d694c4f24301a198f935d856fb_r.jpg?source=2c26e567)

不能把API密钥写进key_facts.md来图方便……

只能放在这些地方：

![图片描述](https://picx.zhimg.com/v2-fe7a46dc4187ec3bc128e57760668d4e_r.jpg?source=2c26e567)

最后，就是如何自建Skill？

什么时候才要写Skill？

当你发现自己反复向Claude解释同一件事时，就要写了。

## 原则1：解决真实存在的问题

建skill的信号：

- 反复向Claude解释同一件事
- 重复查找相同信息
- 手动执行相同多步流程
- 希望Claude"直接知道"项目某些事

不要为假设问题构建skill。

没被Bug坑过，是设计不出正确方案。

## 原则2：一个Skill=一个任务

正确做法：project-memory处理记忆，code-review处理审查。

错误做法：project-everything试图管理记忆、审查、部署和咖啡订单。

可组合、聚焦的skill更可复用、更易维护。

## 原则3：自然语言触发

好用的触发短语：

- “set up project memory”
- “log this bug”

没用的触发短语：

- “initialize documentation subsystem”

问自己：“我会自然地这样说吗？”

## 原则4：标准目录命名

中的文件会被维护，中的文件会被忽略。

用你团队已有的惯例命名。

## 原则5：提供精确模板

低效：

![图片描述](https://pic1.zhimg.com/v2-0199b9e3720150156432483129b81555_r.jpg?source=2c26e567)

高效：

![图片描述](https://pica.zhimg.com/v2-d2e35f7e9db1ab05d642edcec7d8c9cf_r.jpg?source=2c26e567)

后续会出份详细的Skill教程，闲了搞搞……

教程来了，狠狠地点下面：

[Skills从0到1教程以及skills集合](https://www.zhihu.com/question/1998417930208188232/answer/2000628871737929799?share_code=1n4L8FLmZ5m80&utm_psn=2001011983055619465)

## 参考链接

- Project Memory Agent Skill on GitHub
- Agent Skill Standard
- SkillzWave Marketplace
- skilz CLI GitHub Repo
- Anthropic Support
- Anthropic API Documentation
- Notion Uploader/Downloader Agent Skill
- Confluence Agent Skill
- JIRA Integration Agent Skill
- Architect Agent Skill
- Design Doc Mermaid Agent Skill
- PlantUML Agent Skill
- Image Generation Agent Skill
- SDD Agent Skill
- PR Reviewer Agent Skill
- Gemini Agent Skill
