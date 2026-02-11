---
aliases:
  - 未命名 3
tags:
  - coding
  - codex
  - ci
  - github
  - github-actions
para: area
created: 2026-02-03
updated: 2026-02-11
---
# GitHub Actions: CI 失败自动修复 (Codex CLI)

> [!summary]
> 当你的主 CI 工作流失败时，自动触发一个“修复工作流”。修复工作流会 checkout 失败的 commit, 安装依赖, 运行 Codex 生成最小修复，然后创建 PR 给人类审核。

> [!warning] 默认只开 PR, 不要直接改 main
> 最安全的落地方式是: 失败后只创建 PR，让分支保护和人类 review 来决定是否合并。

## 整体流程(文字版)

1. 主工作流 `CI` 跑完，结果是 `failure`
2. 触发 `workflow_run` 类型的 Codex 修复工作流
3. 工作流 checkout 到失败的 `head_sha`
4. Codex 读仓库并做最小修改
5. 复跑测试
6. 通过 `create-pull-request` 开一个 PR

## 前置条件

- 仓库已启用 GitHub Actions
- 已配置 `OPENAI_API_KEY` (Repo Secrets 或 Org Secrets)
- Actions 具备创建 PR 的权限(仓库和组织设置都要允许)
- 项目能在 `ubuntu-latest` 上跑起来(或你自己换 runner 镜像)

## GitHub Actions 示例(可直接改)

把下面保存为 `.github/workflows/codex-auto-fix.yml`。

```yaml
name: Codex Auto-Fix on Failure

on:
  workflow_run:
    # 监听主 CI 工作流的结束事件
    workflows: ["CI"]
    types: [completed]

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-fix:
    # 只有 CI 失败才触发
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      FAILED_WORKFLOW_NAME: ${{ github.event.workflow_run.name }}
      FAILED_RUN_URL: ${{ github.event.workflow_run.html_url }}
      FAILED_HEAD_BRANCH: ${{ github.event.workflow_run.head_branch }}
      FAILED_HEAD_SHA: ${{ github.event.workflow_run.head_sha }}
    steps:
      - name: Check OpenAI API Key Set
        run: |
          if [ -z "$OPENAI_API_KEY" ]; then
            echo "OPENAI_API_KEY secret is not set. Skipping auto-fix." >&2
            exit 1
          fi

      - name: Checkout failing ref
        uses: actions/checkout@v4
        with:
          ref: ${{ env.FAILED_HEAD_SHA }}
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: |
          if [ -f package-lock.json ]; then npm ci; else npm i; fi

      - name: Run Codex (generate minimal fix)
        uses: openai/codex-action@main
        id: codex
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          prompt: >
            You are working in a Node.js monorepo with Jest tests and GitHub Actions.
            Read the repository, run the test suite, identify the minimal change needed to make all tests pass,
            implement only that change, and stop. Do not refactor unrelated code or files. Keep changes small and surgical.
          codex_args: '["--config","sandbox_mode=\\"workspace-write\\""]'

      - name: Verify tests
        run: npm test --silent

      - name: Create pull request with fixes
        if: success()
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "fix(ci): auto-fix failing tests via Codex"
          branch: codex/auto-fix-${{ github.event.workflow_run.run_id }}
          base: ${{ env.FAILED_HEAD_BRANCH }}
          title: "Auto-fix failing CI via Codex"
          body: |
            Codex generated this PR in response to a CI failure.

            - Workflow: `${{ env.FAILED_WORKFLOW_NAME }}`
            - Failed run: ${{ env.FAILED_RUN_URL }}
            - Head branch: `${{ env.FAILED_HEAD_BRANCH }}`

            This PR contains minimal changes intended solely to make the CI pass.
```

## 实战建议(不写会后悔)

- 限制范围: prompt 里强调“最小改动，不做重构”。
- 固定验证: 强制跑 `npm test` 或最小相关测试集，避免只改了代码没验证。
- 保护 secrets: fork PR 不要跑(否则 secrets 不可用，也有安全风险)。
- 记录证据: 把 Codex 输出日志保存成 artifact，方便追溯这次修复是怎么来的。

## 参考

- 原文标题: Autofix CI failures on GitHub with Codex CLI

