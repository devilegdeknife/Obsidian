# PARA 目录统一与全量标记计划

## 目标
- 顶层业务目录固定为：`00_Inbox`、`01_Project`、`02_Areas`、`03_Resource`、`Daily`、`04_Archives`
- 保留隐藏目录：`.obsidian`、`.agent`、`.smart-env`
- 按 `03_Resource/Templates/PARA.md` 统一所有 Markdown frontmatter
- 计划文档由本文件承载并持续更新

## 统一 Frontmatter 规范
```yaml
---
创建时间: YYYY-MM-DD
最后修改: YYYY-MM-DD
状态:
  - Inbox|Project|Areas|Resource|Daily|Archives
tags:
  - #tag
---
```

目录与状态映射：
- `00_Inbox` -> `Inbox`
- `01_Project` -> `Project`
- `02_Areas` -> `Areas`
- `03_Resource` -> `Resource`
- `Daily` -> `Daily`
- `04_Archives` -> `Archives`

## 执行步骤
1. 基线检查
   - 确认顶层目录结构
   - 统计 6 个目录下 Markdown 文件数量
2. 批量重写
   - 范围：6 个目录下全部 `.md`
   - 排除：`03_Resource/Templates`
   - 规则：完全重写 frontmatter，正文不变
   - 标签来源：旧 frontmatter `tags` + 正文 `#tag`，合并去重规范化
   - 日期规则：`创建时间` 优先沿用旧值，否则使用文件创建时间；`最后修改` 写执行日
3. 一致性校验
   - 校验字段完整性、日期格式、状态映射、tags 数组格式
4. 结果归档
   - 输出 dry-run 与 apply 日志到 `.agent/outputs/`

## 当前执行结果（2026-02-15）
- ✅ 顶层业务目录已符合要求（6 个目录均存在）
- ✅ 已完成批量改写：
  - 扫描总量：`735` 个 Markdown 文件
  - 实际改写：`735` 个
  - 跳过：`0`
- ✅ 一致性校验通过：
  - `total=735`
  - `bad=0`
  - `missingFm=0`
  - `badDate=0`
  - `badKeys=0`
  - `badStatus=0`

## 产物
- 脚本：`.agent/scripts/para-frontmatter-rewrite.mjs`
- 日志：`.agent/outputs/para-rewrite-dryrun.log`
- 日志：`.agent/outputs/para-rewrite-apply.log`

## ExecPlan: 00_Inbox 摘要与标签整理（2026-02-24）

### 目标
- 在不修改 `00_Inbox/*.md` 原始内容的前提下，基于 `ripgrep` 检索生成可执行整理报告。
- 结果统一输出到 `01_Project/00_Inbox_Processing/`。
- 输出内容必须可直接用于后续人工迁移与归档。

### 范围与排除
- 范围：`00_Inbox` 下全部 `.md`。
- 排除：
  - `00_Inbox/INDEX.md`
  - `00_Inbox/文档格式.md`
  - 空文件（仅记录，不做正文摘要）
- 处理清单来源：`rg --files 00_Inbox -g "*.md"`。

### 固定标签体系
- 一级标签（1-2 个）：`社会文化`、`科技AI`、`编程工程`、`经济金融`、`历史政治`、`个人成长`、`健康生活`、`杂项素材`。
- 二级标签（3-8 个，固定词表）：
  - `知乎讨论`、`舆情事件`、`日本社会`、`性别议题`、`国际关系`、`社会结构`
  - `AI工具链`、`学习路线`、`系统设计`、`软件工程`、`网络安全`
  - `投资策略`、`A股`、`量化交易`、`宏观经济`、`产业分析`
  - `历史复盘`、`政治制度`、`方法论`、`职业发展`、`自我管理`
  - `健康认知`、`医学科普`、`素材摘录`

### 执行步骤（严格顺序）
1. 生成处理清单并记录总量。
2. 用 `rg` 抽取 frontmatter 元数据（创建时间、最后修改、tags、para、aliases）。
3. 用 `rg` 抽取标题层级与关键词行（`#` / `##` / 分隔线）。
4. 逐文件生成：
   - `summary_short`（1-2 句）
   - `summary_detailed`（3-6 条）
   - `tags_primary`（1-2 个）
   - `tags_secondary`（3-8 个）
   - `confidence`（high/medium/low）
   - `next_action`（建议迁移方向）
5. 生成三份产物：
   - `01_Project/00_Inbox_Processing/summary_report.md`
   - `01_Project/00_Inbox_Processing/tag_index.md`
   - `01_Project/00_Inbox_Processing/processing_log.md`
6. 质量校验：
   - 覆盖率 >= 95%
   - 所有标签命中固定词表
   - `00_Inbox/*.md` 文件内容未被修改

### 失败后果与应对分支（二次规划）
1. 失败类型：处理范围误选（漏文/错文）
   - 后果：后续归档遗漏关键笔记，检索覆盖率失真。
   - 应对：执行“清单双重校验”（`rg --files` 清单 + `para: inbox` 交叉检查），不一致项写入 `processing_log.md`。
2. 失败类型：长文摘要偏题或截断
   - 后果：迁移决策失真，后续主题重组出错。
   - 应对：强制“章节摘要 -> 全文摘要”两段式流程；`>500` 行文档标记 `confidence=medium` 进入人工复核清单。
3. 失败类型：标签漂移（自由标签混入）
   - 后果：后续检索噪声上升，批处理成本增加。
   - 应对：标签白名单校验，非词表标签一律拒绝写入并记日志。
4. 失败类型：误改原始文件
   - 后果：Inbox 原始材料被污染，追溯链断裂。
   - 应对：执行前后对 `00_Inbox/*.md` 做数量与抽样哈希比对，异常立即停止并报告。
5. 失败类型：产物落错目录
   - 后果：工作流入口分散，后续自动化失效。
   - 应对：所有写入路径强制前缀 `01_Project/00_Inbox_Processing/`，路径校验失败即终止。

### 执行结果（2026-02-24）
- ✅ 已使用 `rg` 生成索引：
  - `01_Project/00_Inbox_Processing/rg_metadata_index.txt`
  - `01_Project/00_Inbox_Processing/rg_heading_index.txt`
- ✅ 已生成产物：
  - `01_Project/00_Inbox_Processing/summary_report.md`
  - `01_Project/00_Inbox_Processing/tag_index.md`
  - `01_Project/00_Inbox_Processing/processing_log.md`
- ✅ 统计结果：
  - 总文件：`100`
  - 实际处理：`98`
  - 排除：`2`（`INDEX.md`、`文档格式.md`）
  - 低置信度：`7`
- ✅ 原文不变性校验：
  - `source_hash_before.tsv` vs `source_hash_after.tsv` 对比差异：`0`
