# Knowledge Base YAML Tagging Plan

**Mode:** Plan (输出 Markdown 计划文档)
**Progress:** 100%

## Progress Legend
- ⬜ To Do
- 🟨 In Progress
- ✅ Done

## Tasks
- ✅ Step 0: 基线与目录准备
  - ✅ 创建 .agent 目录
  - ✅ 写入 .agent/AGENTS.md（含 ExecPlans 规则）
  - ✅ 写入 .agent/PLANS.md（ExecPlan 入口）
- ✅ Step 1: 扫描笔记与标签抽取（NLP-based）
  - ✅ 选择 20 篇样本（覆盖 PARA 目录）
  - ✅ 抽取正文 #tag 与 YAML tags
  - ✅ 归并同义标签（大小写、全半角、前缀）
  - ✅ 生成分层词表草案（如 #para/area/健康）
  - ✅ 输出样本与词表到 .agent/outputs/tag-sample.md
- ✅ Step 2: YAML Schema（最小字段）
  - ✅ 定义字段：para、tags、created、updated
  - ✅ 定义 para 枚举值（inbox/project/area/resource/archive/daily）
  - ✅ 定义目录映射（如 02_Areas -> area，Daily -> daily）
  - ✅ 规范日期格式为 YYYY-MM-DD
  - ✅ 标注 Obsidian Properties 兼容性注意事项 {{FACT_TAG}}
  - ✅ 提示：spin up subagent to review YAML schema
- ✅ Step 3: YAML 注入器（脚本）
  - ✅ 区分已有 YAML 与无 YAML 的处理策略
  - ✅ 设定字段优先级（保留已有字段）
  - ✅ 输出 dry-run 变更清单
  - ✅ 日期生成用 Node 等效 tp.date.now
  - ✅ 脚本落地：.agent/scripts/yaml-injector.mjs
- ✅ Step 4: 一致性检查（self-checking）
  - ✅ 校验 tags 是否符合词表层级
  - ✅ 校验 para 与目录映射一致性
  - ✅ 校验 created/updated 格式
  - ✅ 输出缺失/冲突/修复建议报告：.agent/outputs/tag-consistency-report.md
- ✅ Step 5: 自动化与测试
  - ✅ 集成为 Codex skill（复用任务）{{FACT_TAG}}
  - ✅ 在样本 vault 上试运行（tag-sample, consistency-check）
  - ✅ 汇总修正并更新词表

## Step 1 Output (Samples + Vocabulary)
- Full output: .agent/outputs/tag-sample.md
- Highlights:
  - 02_Areas/21_coding/Claude Code 快速开始.md -> #claude-code, #vibe-coding, #workflow, #编程
  - 02_Areas/21_coding/Codex/00_目录 - Codex CLI 学习路径.md -> #agents, #ci, #codex, #coding, #mcp
  - 03_Resource/Software Engineering at Google/_coverpage.md -> #software-engineering-at-google
  - 04_Archives/2022-09-30.md -> #二次元, #激励, #魅魔
  - Daily/2026-02-02.md -> #daily
- Area vocabulary (from 02_Areas):
  - 21_coding -> #para/area/21_coding
  - 22_Philosophy -> #para/area/22_philosophy
  - 23_society -> #para/area/23_society

## Step 2 Schema Draft (Obsidian Properties compatible)
    para: area
    tags:
      - #para/area/21_coding
      - #coding
    created: 2026-02-11
    updated: 2026-02-11

Notes:
- Properties keys are lowercase, values are plain strings or string arrays.
- tags is always a list, even when empty.
- Date format is YYYY-MM-DD only. {{FACT_TAG}}
- Daily notes use para: daily.
- Compatibility check: spin up subagent to review YAML schema.

## Artifacts
- Scripts
  - .agent/scripts/tag-sample.mjs
  - .agent/scripts/yaml-injector.mjs
  - .agent/scripts/created-normalizer.mjs
  - .agent/scripts/tag-consistency-check.mjs
- Outputs
  - .agent/outputs/tag-sample.md
  - .agent/outputs/tag-consistency-report.md
- Config
  - .agent/tagging-config.json
- Skill
  - .agent/skills/yaml-tagging/SKILL.md

## Source Notes & Tradeoffs
- 基于 X post:3 的 Skills/Automations 与 Reddit web:13 的 CLI 控制 Obsidian {{FACT_TAG}}
- YAML as database（X post:0）与标签元数据（web:10） {{FACT_TAG}}
- 纯 Markdown + wikilinks 优于 Obsidian 依赖，但 Codex CLI 使标签可标签 {{INFERENCE_TAG}}
- 文件夹 vs 标签：YAML 打标降低迁移成本（post:7, web:19） {{FACT_TAG}}

## Failure Scenarios & Plan Adjustments
1) 标签爆炸：词表过多或层级漂移  
   - 调整：引入白名单、限制最大层级深度、合并同义词
2) YAML 覆盖误伤：破坏已有字段或时间格式混乱  
   - 调整：仅写最小字段，先 dry-run + 变更清单，统一 YYYY-MM-DD
3) Properties 不兼容：Obsidian/Dataview 报错或字段不识别  
   - 调整：schema 审核 + 示例字段集，必要时回滚到最小字段
