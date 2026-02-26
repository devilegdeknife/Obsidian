---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - Codex
para: areas
aliases:
  - 00_目录 - Codex CLI 学习路径
---
# Codex CLI 学习路径 (给程序员)

> [!summary] 你会在这里学到什么
> 这组笔记把 Codex CLI 的常见用法整理成一条“能上手, 能复用, 能落地到 CI”的学习路径。重点不是背概念，而是把 AI 变成可控的工程流程: 范围可控, 行为可控, 验证可控。

## 先读两篇 (入门必看)

- [[Codex 快速开始]]
- [[Codex 提示词指南]]

## Cookbook 按场景选读 (推荐顺序)

### 1) 把 Codex 接到工具 (先打通能力)

1. [[01 MCP 模型上下文协议]]
2. [[02 Codex CLI 与 Agents SDK, 构建一致工作流]]

### 2) 把 Codex 放进 CI (自动化落地)

3. [[03 GitHub Actions, CI 失败自动修复 Codex CLI]]
4. [[04 GitLab CI, 代码质量与安全修复 Codex CLI]]
5. [[05 CI 中的代码审查, Codex 结构化输出]]
6. [[08 Jira 与 GitHub 自动化, 用 Codex CLI 从工单开 PR]]

### 3) 处理长任务 (规划与现代化)

7. [[06 ExecPlan, 用 PLANS.md 拆解多小时任务]]
8. [[07 代码库现代化, 用 Codex 迁移遗留系统]]

## 先记住这几件事 (新手常踩坑)

> [!warning] 密钥不要写进仓库
> `OPENAI_API_KEY` 只能放在 CI 的 Secrets 或环境变量里，不要写进 `.env` 然后提交, 也不要写进 `config.toml`。

> [!tip] 先让输出结构化
> 让 Codex 输出 JSON, 再做校验, 再交给 GitHub 或 GitLab 的 API, 比让它直接输出一大段自然语言稳定得多。

> [!note] 这些文档是“配方”，不是“法规”
> 不同团队的 CI 环境不同。照抄 YAML 之前先理解每一步在做什么, 然后把路径, 权限, 以及 runner 镜像调整到你自己的项目上。

## 术语速查

- Codex CLI: OpenAI 的命令行工具，用于在终端里调用推理模型，做代码阅读, 生成, 修改, 以及自动化任务。
- MCP (Model Context Protocol): 让模型通过“工具”访问外部上下文（例如文档, 浏览器, Figma）的协议。
- CI/CD: 持续集成/持续交付，简单理解就是“每次提交都跑一遍自动检查和发布流程”。
- SAST: 静态应用安全测试（不运行程序，通过扫描代码找漏洞）。
- Code Quality / CodeClimate JSON: GitLab 用来在 MR 页面里展示“代码质量问题”的报告格式。
- Structured Output: 让模型输出满足某个 JSON Schema 的结果，方便机器解析并做后续动作。
- ExecPlan: 一份可以直接执行的计划文档，用来把多小时, 多步骤的任务拆成可验证的小里程碑。

## 来源与版权说明

这些笔记主要整理自 OpenAI Developers Cookbook, 并按 Obsidian 阅读习惯做了排版和“新手补充说明”。原文中的图片和链接保留在各个笔记中，便于回溯。
