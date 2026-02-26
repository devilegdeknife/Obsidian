---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - #codex
  - #coding
  - #execplan
  - #planning
para: areas
aliases:
  - "06_ExecPlan, 用 PLANS.md 拆解多小时任务"
---
# ExecPlan: 用 PLANS.md 拆解多小时任务

> [!summary]
> ExecPlan 是一份“可执行的计划文档”。它的目标不是写漂亮的方案，而是把**范围**、**里程碑**、**验证方式**写清楚，让你(或 Codex)可以按步骤推进，并且每一步都能证明“确实更接近完成”。

> [!tip] 什么时候一定要用 ExecPlan
> - 预计超过 1 小时的改动
> - 涉及多模块/多文件的大重构
> - 需要留痕、可审计(为什么这么改, 风险是什么)
> - 你希望 Codex 能连续工作，但不跑偏

## ExecPlan 的两个配套文件

> [!note]
> 这套模式通常用两份“规则文件”约束 agent，再用一份“计划文件”执行。

1. `AGENTS.md`: 告诉 agent 你的仓库习惯和约束(例如测试命令, 不要随意加依赖)。
2. `PLANS.md`: 定义“ExecPlan 必须包含哪些章节，格式要怎样，怎么写才算可执行”。

## 最小 AGENTS.md 约定(示例)

把这段加到你的 `AGENTS.md` 里，让 agent 知道什么时候必须用 ExecPlan:

```md
# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.
```

## 一个够用的 ExecPlan 模板(中文版, 简化版)

> [!tip]
> 模板越长越容易不更新。先用短的，真遇到复杂点再加章节。

```md
# <主题>: ExecPlan

## Overview

用 3-8 句话说明:
我们要做什么, 为什么要做, 做完以后用户能获得什么能力。

## Scope

明确写:
包含什么, 不包含什么(尤其是不做的事情)。

## Success Criteria (可验证)

用“人能验证”的语言写验收标准，例如:

1. 运行 `...`，输出包含 `...`
2. 访问 `...` 返回 HTTP 200
3. 跑测试 `...` 全绿

## Architecture (可选)

用 1-2 段话说明:
改动会影响哪些模块/文件，它们如何协作。

## Step-by-step Execution

1. 第 1 步: ...
   - 要改哪些文件
   - 怎么验证
2. 第 2 步: ...
   - ...

## Risks & Unknowns

- 哪些地方可能踩坑
- 有哪些你不确定的点，需要先做 spike/小验证

## Progress (必须维护)

- [ ] Step 1 ...
- [ ] Step 2 ...

## Decision Log (必须维护)

- YYYY-MM-DD: 做了什么决策, 为什么

## Outcomes & Retrospective (收尾写)

完成后写:
做成了什么, 还剩什么, 下次怎么更快。
```

## 用 ExecPlan 驱动 Codex 的提示词(可直接用)

> [!example] 让 Codex 先出 ExecPlan, 再执行
> 先让它写计划，确认没跑偏，再让它按里程碑执行。

```text
请在仓库内创建一个 ExecPlan 文件: docs/plans/<YYYY-MM-DD>-<topic>-execplan.md
要求:
- 范围要小，优先可验证
- 每个里程碑都必须写“怎么验证”
- 列出风险点和待确认问题
然后停止，等待我确认计划。
```

> [!example] 让 Codex 按 ExecPlan 执行(逐里程碑)

```text
请严格按 docs/plans/<YYYY-MM-DD>-<topic>-execplan.md 执行第 1 个里程碑:
- 只做里程碑 1 的工作
- 完成后运行里程碑要求的验证
- 更新 ExecPlan 的 Progress 和 Decision Log
```

## 参考

- 原文标题: Using PLANS.md for multi-hour problem solving

