---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - #编程
  - #codex
  - #vibe-coding
  - #workflow
para: areas
aliases: []
---
> [!summary]
> 把 Codex 当作“会读代码, 会跑命令, 会改文件, 还能根据反馈自我迭代”的队友。你负责目标, 约束, 验证路径, 以及最终审阅和合并。

## 0. 适用读者与学习目标

适合人群：
- 大学生程序员, 有基本的 Git 与命令行经验
- 想把 AI 变成稳定可控的工程生产力, 而不是“碰碰运气写代码”

你将学会：
- 选对入口（IDE / CLI / Cloud）并把任务讲清楚
- 用“可验证”的提示词驱动 Codex 交付高质量改动
- 用接近 Google 软件工程实践的方式组织需求, 设计, 测试, 评审, 文档

## 1. 先把任务讲清楚：Done, 约束, 验证

这是 Codex 能否靠谱的分水岭。

> [!check] 提示词最小三件套
> - Done：你要交付的东西是什么（文件, 功能, PR, 脚本, 文档）
> - 约束：哪些不能改（API 形状, 数据库 schema, 性能上限, 依赖, 目录边界）
> - 验证：怎么证明它真的对（复现步骤, 测试命令, 手动检查清单）

示例（可直接改成你的项目版本）：

```text
目标（Done）：
- 修复设置页“保存成功但不落盘”的问题
- 增加回归测试（最小相关测试集即可）

约束（Constraints）：
- 不改变 API 形状
- 只做最小修复，不重构

验证（Verify）：
- 复现步骤：...（把每一步写出来）
- 运行：lint + 最小相关测试
```

## 2. 选对入口：IDE / CLI / Cloud

### 2.1 IDE 扩展（本地探索最快）

适用：理解代码, 小步改动, 边看边改。

要点：
- IDE 会自动把你打开的文件带入上下文
- 适合“选中一段代码，然后问它这段在干嘛/怎么改最安全”

### 2.2 CLI（最适合可复现, 可记录, 能跑命令的工作）

适用：修 bug, 写测试, 批量改动, 需要 shell 输出作为反馈闭环的任务。

常用姿势：
- 启动交互：`codex`
- 提示里用 `@path/to/file` 明确附加文件（比“你去找一下”稳定）

### 2.3 Cloud（把耗时实现外包并行跑）

适用：你先在本地把计划与边界想清楚, 再把实现分里程碑交给云端跑。

要点：
- 先“设计清楚”，再“让它实现里程碑 1”
- 云端更像一个可并行的执行器, 你要更严格地做 diff 审阅

## 3. Codex 提示词方法论（工程化版本）

### 3.1 把“工作”拆成 CL 级别的小步

接近 Google 的经验法则：
- 小步可回滚（一次只做一件事）
- 先让改动可验证，再扩大改动范围
- 先改最靠近问题的地方，不要顺手重构一大片

> [!tip]
> 当你发现提示词里出现“顺便”“同时”“把所有相关地方都优化一下”，质量通常会掉。

### 3.2 提供上下文的优先级

从强到弱：
1) 具体文件 + 具体行/函数 + 现象/堆栈
2) 具体文件 + 复现步骤
3) 只有自然语言描述（最不稳定）

### 3.3 明确它应该怎么做“验证”

你可以把验证写成它必须执行的 checklist：

```text
完成后必须：
1) 重新跑复现步骤并说明结果
2) 运行 lint + 最小相关测试并报告命令与结果
3) 总结改动点（按文件列出）
```

## 4. 常用工作流配方（可复制）

下面每个配方都包含：何时用, 适合入口, 推荐提示词, 验证方式。

### 4.1 解释代码库/请求流

适用：接手项目, 读协议/数据模型, 搞清楚“请求从哪来, 到哪去”。

推荐入口：IDE（最快），或 CLI（想留文字记录时）。

提示词模板：

```text
Read @foo.ts @schema.ts and explain:
- request/response flow (step-by-step)
- required vs optional fields
- where validation happens
- 1-2 gotchas when modifying this
Then list the files involved.
```

验证：
- 让它输出编号步骤清单
- 让它标出关键入口点（路由, handler, service, db）

### 4.2 修复一个可复现的 bug（闭环最快）

推荐入口：CLI（可以跑命令 + 记录输出）。

提示词模板：

```text
Bug: <一句话描述现象>

Repro:
1) ...
2) ...
3) ...

Constraints:
- <不改什么>
- <改动范围>

Start by reproducing locally, then propose a minimal patch.
After the fix, rerun the repro steps and run lint + the smallest relevant tests.
Report commands and results.
```

验证：
- 它必须能复现, 才能说“修了”
- 修复后重跑复现步骤, 并用测试把行为钉住

### 4.3 编写测试（从规格到可验证）

适用：你已经知道“应该怎么表现”，想把它变成测试。

提示词模板：

```text
Add tests for <function/feature> in @path/to/file.
Cover:
- happy path
- boundary conditions
- invalid inputs / error paths
Follow existing test conventions in this repo.
```

验证：
- 先让新增测试在“未修复/未实现”时失败（如果适用）
- 再实现/修复, 让测试通过

### 4.4 根据截图做 UI 原型

推荐入口：CLI（把图片拖进终端附加）。

提示词模板：

```text
Create a new dashboard based on the attached image.

Constraints:
- React + Vite + Tailwind
- TypeScript, no any

Deliverables:
- new route/page
- any small components
- README with local run steps
```

验证：
- 让它启动 dev server 并告诉你本地 URL/路由
- 你按截图逐项对齐（间距, 字体, 组件状态）

### 4.5 UI 迭代（设计, 调整, 刷新, 再调整）

推荐入口：CLI + 另开终端跑 dev server。

提示词模板：

```text
Propose 2-3 styling improvements for the landing page.
Then wait for me to pick one option.
```

选方向后：

```text
Go with option 2.
Change only the header:
- make typography more editorial
- increase whitespace
- keep mobile looking good
```

验证：
- 每次只改一块（例如 header），避免“全局改坏”
- 不喜欢就明确告诉它“撤销/保留哪些改动”，避免覆盖

### 4.6 重构：本地规划, 云端实现（分里程碑）

思路：你在本地把边界和风险讲清楚，然后把实现拆成 Milestone 交给 Cloud。

本地规划提示词模板：

```text
We need to refactor <subsystem> to:
- split responsibilities (A vs B vs C)
- reduce circular imports
- improve testability

Constraints:
- no user-visible behavior changes
- keep public APIs stable

Deliver:
- step-by-step migration plan (milestones)
- rollback strategy
```

云端实现提示词模板：

```text
Implement Milestone 1 from the plan.
Keep changes minimal, and add/adjust tests if needed.
```

验证：
- 每个里程碑都要有可验证产出（编译, 测试, 行为检查）
- diff 审阅重点看：接口变化, 删除/新增路径, 错误处理, 性能风险

### 4.7 本地代码审查（自查用）

推荐入口：CLI。

做法：
- 在 CLI 里用 `/review`
- 需要更聚焦时加一句：`Focus on edge cases and security issues`

### 4.8 审核 GitHub PR（评论驱动）

适用：你不想拉分支到本地也想要审查意见。

做法：
- 在 PR 评论里：`@codex review`
- 或者更具体：`@codex review for security vulnerabilities and security concerns`

### 4.9 更新文档（让改动可被后来者理解）

提示词模板：

```text
Update documentation in @docs/xxx.md to include:
- troubleshooting steps for <topic>
- verification steps
Verify that all links are valid.
```

验证：
- 渲染后通读一遍（标题层级, 示例可复制, 链接可点）

## 5. 模型选择（只讲决策，不背参数）

（以下命名来自原始资料，未来可能会更新。你只需要记住如何选。）

推荐策略：
- 默认用“推荐模型”（更稳，适合工程任务）
- 成本敏感或短任务用 mini
- 长任务/大重构用 max（如果你确实需要更长的推理与更强的执行力）

配置要点（本地 CLI 与 IDE 通常共用同一份配置文件，例如 `config.toml`）：

```toml
model = "gpt-5.2-codex"
```

临时切换模型（在当前线程内）：
- CLI：用 `/model`（在交互里切换）
- 或者启动新线程时指定：`codex -m <model>`

CLI 里显式指定模型（示例）：

```bash
codex -m gpt-5.2-codex
```

> [!note]
> Codex Cloud 任务的默认模型通常不可手动切换。如果你强依赖某个模型，请优先在本地跑或调整任务拆分粒度。

## 6. 安全与隐私（把“风险”也工程化）

基本原则：
- 不要把密钥, Token, 私钥, 生产环境数据库凭证粘进对话
- 需要贴日志时，先做脱敏（把用户数据, 订单号, 邮箱等替换成占位符）
- 对“会执行命令/会写文件”的能力保持敬畏：要求它只在仓库内操作，并让它在每一步前说明将改哪些文件

> [!check] 安全提示词（可复制）
> - 不要打印或写入任何 secrets
> - 不要把敏感数据写入日志
> - 只修改我明确点名的文件

## 7. 线程与上下文（让它别“猜”）

### 7.1 线程（Thread）是什么

同一线程里：
- 你前面说的约束和目标会被它记住
- 但“记住”不等于“不会犯错”，关键约束建议反复强调

### 7.2 上下文（Context）怎么给

实用规则：
- 在 CLI 里尽量用 `@文件路径` 明确提供关键文件
- 在 IDE 里打开你希望它重点关注的文件
- 复杂问题优先给：入口点 + 数据结构定义 + 最近的调用者

## 8. 把 Codex 纳入你的工程流程（接近 Google 的做法）

把它当成“自动化执行器”，而不是“权威”。

> [!note]
> Google 风格的核心不是流程多，而是：小步可验证, 强调可读性, 用测试和评审兜底。

建议你按下面顺序用 Codex：
1) Plan：让它把任务拆成小步（你审阅并改成你认可的版本）
2) Design：让它写出设计说明（边界, 失败模式, 迁移方案）
3) Build：让它实现里程碑（每步都可验证）
4) Test：让它补齐测试，覆盖边界与错误路径
5) Review：让它做自审，但你做最终审阅（尤其是安全与性能）
6) Document：让它更新文档，但你保证文档可用
7) Deploy/Maintain：让它补运行手册与排障步骤

## 9. 常见坑（以及怎么躲）

- 没有复现步骤：它只能猜，你也没法验证
- 没有约束：它会“顺手重构”，并引入不必要风险
- 没有验证命令：它说“完成了”，你还得自己擦屁股
- 一次要太多：把任务拆小，质量会明显上升
- 不审 diff：任何自动化改动都可能引入隐藏回归

## 10. 参考与延伸

- 原始素材：[[codex docs]]
- 建议你为每个项目维护一份 `AGENTS.md`，把“怎么跑测试/怎么验证/不允许做什么”写死，让 Codex 更像一个可控的团队成员
