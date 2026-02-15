---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - #编程
  - #codex
  - #prompting
  - #vibe-coding
  - #workflow
---
> [!summary]
> 写提示词的目标不是“让 AI 聪明”，而是让工程产出**可控**：范围可控，行为可控，验证可控。你把 Done, 约束, 验证路径讲清楚，Codex 才会稳定发挥。

## 0. 这篇写给谁

适合：
- 初级程序员，希望把 Codex 用成“能交付改动的队友”
- 已经会跑命令，但不知道怎么把需求讲到不跑偏
- 需要把 bug 修复, 重构, 写测试, 写文档这类任务做成稳定流程

不适合：
- 只想要“灵感式写代码”，不关心验证与回归

## 1. Codex 的核心规律：少即是多

Codex 系列模型的很多工程习惯是“内置”的，**过度提示**反而会降低质量。

> [!tip]
> 你越像在写“规章制度大全”，它越容易漏掉真正关键的约束。

初级最容易踩的坑：
- 提示词里要求它“先输出详细计划/长篇过程播报/每一步都解释”，结果模型更容易中途停下，或者把时间花在写“看起来很努力”的文字上
- 同时要求“重构 + 写新功能 + 提升性能 + 顺便清理代码风格”，范围过大，导致难以验证

建议做法：
- 提示词尽量短，但包含**最关键的三件事**：Done, Constraints, Verify
- 复杂任务拆成多个小步，每步都能验证

## 2. 初级程序员的“提示词三件套”

> [!check] 三件套（必写）
> - Done：交付物是什么（修复了什么，新增了什么文件/接口/脚本）
> - Constraints：哪些不能改（API 形状，行为不变，目录边界，依赖限制）
> - Verify：怎么证明对（复现步骤，测试命令，手动检查清单）

模板：

```text
目标（Done）：
- ...

约束（Constraints）：
- ...

验证（Verify）：
- 复现步骤：
  1) ...
  2) ...
- 运行命令：
  - ...
```

## 3. “让它不猜”的上下文给法

优先级从高到低：
1) 直接 `@` 关键文件（入口点 + 数据结构 + 关键调用者）
2) 给最小可复现步骤（UI 操作步骤，CLI 命令，输入输出样例）
3) 只有自然语言描述（尽量避免）

> [!tip]
> 在 CLI 里，与其说“去看看哪里有问题”，不如说“先读 @a.ts @b.ts，告诉我请求流和校验点”。

## 4. 常用提示词配方（可直接照抄）

### 4.1 修复 bug（要求它先复现，再修，再验证）

```text
Bug: 点击“保存”有时显示 Saved，但刷新后设置没有保存。

Repro:
1) 启动：npm run dev
2) 打开 /settings
3) 打开 Enable alerts
4) 点击 Save
5) 刷新页面，开关复位

Constraints:
- 不改变 API 形状
- 最小修复，不做大重构

Verify:
- 修复后重跑 Repro
- 跑 lint + 最小相关测试，并报告命令和结果
```

### 4.2 解释代码库（把“调用链”讲成编号步骤）

```text
Read @foo.ts @schema.ts and explain:
- request/response flow (step-by-step)
- required vs optional fields
- where validation happens
- 1-2 gotchas when modifying this
Then list the files involved.
```

### 4.3 写测试（覆盖 happy path + 边界 + 错误路径）

```text
Add tests for <function/feature> in @path/to/file.
Cover:
- happy path
- boundary conditions
- invalid inputs / error paths
Follow existing test conventions in this repo.
```

### 4.4 文档更新（要求可验证）

```text
Update @docs/xxx.md:
- add troubleshooting steps for <topic>
- add verification steps
Verify that all links are valid.
```

## 5. 中途“进度播报”这件事：别强行提示

Codex 在执行过程中会自动产生一些“工作中摘要/小标题式更新”，但这类更新通常来自单独的总结机制，不是你能可靠控制的。

建议：
- 不要在提示词里要求它“每一步都输出计划/状态/解释”
- 更稳的方式是：你在提示词里把**验证标准**写清楚，让它把时间花在“做到”而不是“讲过程”

## 6. 工具输出太长怎么办（Tool Response Truncation）

当工具输出（例如 `ripgrep` 结果, `git diff`, 大日志）太长时，模型会因为上下文预算被挤爆而变笨，或者你这边的工具层会截断输出。

官方推荐的一种截断策略（适合你在“自建 agent harness/工具层”时使用）：
- 工具输出预算大约 10k tokens，可以用 `num_bytes/4` 粗略估算
- 超过上限时，不要只保留开头，建议“前半 + 后半”，中间用类似 `…3 tokens truncated…` 的标记截断

> [!example]
> 当你贴日志时，不要只贴开头 200 行。优先贴“报错前后关键片段”，并说明你截断了哪些部分。

对日常使用者（不自建工具）来说，更实用的做法：
- 让 Codex 自己用 `head/tail` 或更窄的过滤条件缩小输出
- 让它改用更小范围的搜索（例如只搜某个目录，或限定 `--max-count`）

## 7. 并行读信息（Parallel Tool Calling，进阶）

如果你在做“自建 Codex agent”或写工具层，官方建议：
- 在一次行动前先想清楚要读哪些文件/资源
- 能并行就并行读（而不是一个一个读）
- 工具调用与输出的顺序也尽量保持稳定（例如先列出多个 tool call，再依次给出各自输出）

对日常使用者来说，对应的提示词习惯是：
- 一次性 `@` 2-5 个关键文件，而不是一个文件问一次
- 明确“先读这些，再回答这些问题”，减少来回

## 8. 参考（原始资料）

- Codex Prompting Guide（Cookbook 网页版）：https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide
- Codex Prompting Guide（对应 ipynb）：https://github.com/openai/openai-cookbook/blob/main/examples/gpt-5/codex_prompting_guide.ipynb
- Tool Response Truncation 小节（网页锚点）：https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide#tool-response-truncation

