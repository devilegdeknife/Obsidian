---
创建时间: 2026-02-05
最后修改: 2026-02-15
状态:
  - Inbox
tags:
  - #开发框架
  - #开源项目
  - #ai编程
  - #claude-code
  - #trellis
---
# Trellis-AI编码框架介绍与开源分享

前天我的 CTO 在 l 站发布了一篇技术贴，没想到竟然小爆了一下。我们当时正在准备开源，原本规划几周后再发,但这次的反响让我们意识到大家对 AI coding 的需求远超想象，于是决定提前开源。

前天下午，我们正式发布了 Trellis ，在纯自然流的情况下首日收获了 100+ star ，次日收获了 800+ star ，收到了很多有价值的反馈和建议。我们正在开发对 Opencode 和 Windows 的支持，预计今天能完成，其余的大部分问题也我们都会在接下来的几天内解决。

在此，我准备开源使用 CC 8 个月以来我们的全部心路历程，以及为什么我们选择构建 Trellis ，希望能帮助到大家。

![discord 和 wx 的讨论](https://free-img.400040.xyz/4/2026/01/30/697c69e724123.png)

![Star History Chart](https://api.star-history.com/svg?repos=mindfold-ai/Trellis&type=Date)

### 我们踩过的坑

在说这一切之前必须从我们踩过的坑说起。从 8 个月前 Claude Code 发布开始，我们就在尝试各种开发流程：从最早的 OpenSpec ，到前段时间爆火的 plan-with-files ，再到最近霸榜 trending 的 Superpowers ，我们都有过使用，但可惜结果都是初看很惊艳，但实际效果不尽如人意

核心问题有两个：

1. OpenSpec 类框架：本质上是 PRD-driven ， 而不是 Coding-Spec-driven 。缺少了对代码质量的全局约束，每次开发新任务都需要新建关于项目的架构约束、代码风格、错误处理规则等文档。
2. Superpowers 类框架：开源的 skill 都是比较宽泛的，没法解决项目内各种特化的问题，但是即使我们定义了自己的项目规范 skill ，有时也因为幻觉或者上下文过长而没有调用，这带来了不可预测性。最后大部分时候 skill 必须手动使用，使用体感很差。

### 我们的思考

我们认为在未来的 AI Framework 里，Spec 和 Skill 必须同时存在：

- Spec 负责约束：确保 AI 始终遵循项目规范，提供可预测性
- Skill 负责能力：按需扩展 AI 的能力边界，保持灵活性

解决了这两个问题，才能真正提升 AI 的代码质量，再配合上自动上下文注入之后，并行调用、团队协作等能力也就成为可能了。

### Trellis：为 AI 编码提供结构化支撑

下面就要讲到我们的开源框架 Trellis： [https://github.com/mindfold-ai/Trellis](https://github.com/mindfold-ai/Trellis)

Trellis 的寓意是植物的爬架——我们希望它能像爬架一样，为 AI 编码提供结构化的支撑，让代码自然生长的同时保持方向可控。同时也希望它就像庭院里真实的爬架一样，是高度可自定义的。

1. 我们给 Spec 加上了分层和索引机制，这样它就拥有了 Skill 的渐进式披露，在节省上下文的同时也确保永远不会遗失关键 context ；
2. 我们用脚本整合了一套自动注入上下文的 Skill 工作流，让你每次对话都能自动完成一套规范的工作流，而不需要手动调用一堆 command ；
3. 我们加上了更强的 Todo 管理系统，结合 json 和 md 文档，让它在有丰富的 prd 的同时，有了优先级、能关联工程师、关联 branch&worktree
4. 最后我们结合上述功能并加上了 multi-agent && multi-session 功能，这样你的 AI 可以判断 Task 复杂度，自行开启一个或多个 worktree 开发任务甚至直接 PR

### 更多可能性

这套系统的玩法还非常多，比如 task 系统和任务管理系统比如 Linear 的双向同步；比如自动多模型 Review PR ；甚至像 ClawdBot 一样嵌入到 Slack 、discord 等任何地方…

最重要的是，没有学习成本：只需三行命令完成初始化，之后像平常一样用 Claude Code 就好了。(因为所有的复杂逻辑我们都已经原生做在了框架内部)

在过去的几天，我们内部搓了一个自动生成 Leads 的系统；一个每天帮我们刷各种社媒的 agent ；一个支持 ACP 、嵌入 Trellis 的 Cowork GUI…

### Roadmap

与此同时我们还在准备 Trellis 下两个版本的大更新，以及整理团队内部使用的 Skill 包，很快就全量会放出来。

容我再次插入一个 CTA ，感兴趣的朋友可以 star 一下，支持我们，关注后续进度 👉 [https://github.com/mindfold-ai/Trellis](https://github.com/mindfold-ai/Trellis)