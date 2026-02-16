---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - #ci
  - #code-review
  - #codex
  - #coding
  - #github
para: areas
aliases:
  - "05_CI 中的代码审查, Codex 结构化输出"
---
# CI 中的代码审查: 用 Codex 结构化输出生成可发布的 Review 结果

> [!summary]
> 目标不是“让模型写一段评语”，而是让它输出**结构化 JSON**，CI 负责校验 JSON，然后调用 GitHub/GitLab API 把结果发布成可读的 review 评论(汇总 + 可选行内)。

## 为什么要结构化输出

自然语言最大的问题是: 你很难稳定解析，也很难保证字段齐全(文件路径, 行号, 优先级等)。结构化输出的好处:

- **可解析**: CI 能稳定读取并转成 API 调用
- **可校验**: 能用 JSON Schema/类型校验挡掉胡输出
- **可排序/去重**: 可以按 priority, confidence 排序，也能合并重复问题
- **可审计**: 你能把原始输出保存为 artifact，方便追溯

## 最小实现流程(新手版)

1. 在 CI 里拿到 PR 的 diff 和变更文件列表
2. 构造 prompt，只允许评论“本次变更引入的问题”
3. 运行 Codex，产出 `codex-output.json`
4. 校验 JSON(用 JSON Schema 或 `jq`/`node` 简单校验)
5. 把 JSON 转成 API 调用，发布 review 评论

> [!warning] 行号是硬门槛
> 行内评论要严格对齐 PR diff 的行号和 side，否则 GitHub/GitLab 会拒绝创建评论。新手建议先做“汇总评论”，行内评论作为第二步。

## 推荐的输出结构(JSON Schema)

> [!tip]
> 这个 schema 是“够用且好实现”的版本，你可以按团队习惯调整字段，但建议保留 `path` 和 `line_range`。

```json
{
  "type": "object",
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string", "maxLength": 80 },
          "body": { "type": "string", "minLength": 1 },
          "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 },
          "priority": { "type": "integer", "minimum": 0, "maximum": 3 },
          "code_location": {
            "type": "object",
            "properties": {
              "path": { "type": "string", "minLength": 1 },
              "line_range": {
                "type": "object",
                "properties": {
                  "start": { "type": "integer", "minimum": 1 },
                  "end": { "type": "integer", "minimum": 1 }
                },
                "required": ["start", "end"],
                "additionalProperties": false
              }
            },
            "required": ["path", "line_range"],
            "additionalProperties": false
          }
        },
        "required": ["title", "body", "confidence_score", "priority", "code_location"],
        "additionalProperties": false
      }
    },
    "overall_correctness": { "type": "string", "enum": ["patch_correct", "patch_incorrect"] },
    "overall_explanation": { "type": "string", "minLength": 1 },
    "overall_confidence_score": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "required": ["findings", "overall_correctness", "overall_explanation", "overall_confidence_score"],
  "additionalProperties": false
}
```

## 推荐的 Review Prompt(只评论可操作问题)

把下面这段作为“审查提示词”，然后把 diff 和变更文件列表拼到后面。

```text
你正在对另一个工程师提交的代码变更做 code review。
重点关注影响正确性, 性能, 安全性, 可维护性, 或开发者体验的问题。
只标记由本次 PR 引入的、可操作的问题。
当你报告问题时，必须提供:
- 简短标题(title)
- 可执行的修复建议(body)
- 受影响的文件路径(path, 仓库相对路径)
- 行号范围(line_range)

避免吹毛求疵的风格意见，除非它会影响理解或导致真实 bug。
请确保文件路径和行号完全正确，否则评论会被 SCM API 拒绝。
```

## GitHub Actions 最小示例: 只发“汇总评论”(推荐先做这个)

这个版本不做行内评论，只把 Codex 的总体结论发到 PR 下方，最稳。

你需要的 secrets:

- `OPENAI_API_KEY`
- `GITHUB_TOKEN`(Actions 默认提供)

核心步骤:

1) 生成 `codex-output-schema.json`  
2) 生成 `codex-prompt.md`(包含 diff)  
3) 运行 Codex，输出 `codex-output.json`  
4) 解析 JSON，把汇总发布为 PR comment

> [!example] GitHub Actions 片段(只展示关键 steps)
> 你可以把它合并进自己的 workflow。

```yaml
- name: Generate schema
  run: |
    cat > codex-output-schema.json <<'JSON'
    {
      "type": "object",
      "properties": {
        "findings": { "type": "array" },
        "overall_correctness": { "type": "string" },
        "overall_explanation": { "type": "string" },
        "overall_confidence_score": { "type": "number" }
      },
      "required": ["findings","overall_correctness","overall_explanation","overall_confidence_score"],
      "additionalProperties": true
    }
    JSON

- name: Build prompt (include diff)
  env:
    BASE_SHA: ${{ github.event.pull_request.base.sha }}
    HEAD_SHA: ${{ github.event.pull_request.head.sha }}
  run: |
    set -euo pipefail
    {
      echo "你正在对另一个工程师提交的代码变更做 code review。"
      echo "只评论本次 PR 引入的可操作问题。"
      echo ""
      echo "Changed files:"
      git --no-pager diff --name-status "$BASE_SHA" "$HEAD_SHA"
      echo ""
      echo "Unified diff (context=5):"
      git --no-pager diff --unified=5 "$BASE_SHA" "$HEAD_SHA"
    } > codex-prompt.md

- name: Run Codex (structured output)
  uses: openai/codex-action@main
  with:
    openai_api_key: ${{ secrets.OPENAI_API_KEY }}
    prompt_file: codex-prompt.md
    output_schema_file: codex-output-schema.json
    output_file: codex-output.json

- name: Post summary comment
  env:
    GITHUB_TOKEN: ${{ github.token }}
    PR_NUMBER: ${{ github.event.pull_request.number }}
    REPOSITORY: ${{ github.repository }}
  run: |
    set -euo pipefail
    overall_state=$(jq -r '.overall_correctness' codex-output.json)
    overall_body=$(jq -r '.overall_explanation' codex-output.json)
    confidence=$(jq -r '.overall_confidence_score' codex-output.json)

    body=$(jq -n --arg t "Codex 自动审查" --arg s "$overall_state" --arg c "$confidence" --arg b "$overall_body" \
      '{body: ("**" + $t + "**\n\n结论: " + $s + "\n置信度: " + $c + "\n\n" + $b)}')

    curl -sS \
      -X POST \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      "https://api.github.com/repos/${REPOSITORY}/issues/${PR_NUMBER}/comments" \
      -d "$body"
```

## 行内评论(进阶提醒)

要做行内评论，除了 `path` 和行号之外，GitHub/GitLab 还需要你提供 diff side、position 或 commit 等信息，而且不同 SCM API 规则不同。

建议路线:

1) 先做“汇总评论”跑通链路  
2) 再做“行内评论”，并限制只发 top N 条(例如 N=10)  
3) 最后再做“自动去重 + 合并重复 findings”

## 参考

- Codex CLI: https://github.com/openai/codex
- Structured outputs: https://platform.openai.com/docs/guides/structured-outputs

