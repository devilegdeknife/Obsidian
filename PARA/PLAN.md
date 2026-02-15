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
