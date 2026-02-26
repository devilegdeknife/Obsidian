---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - codex
para: areas
aliases:
  - 02_Codex CLI 与 Agents SDK, 构建一致工作流
---
# Codex CLI 与 Agents SDK: 构建一致, 可追踪的 Agent 工作流

> [!summary]
> 当任务变复杂(多步骤, 多角色, 需要留痕)时，不要把 Codex 当成“一个会说话的聊天框”。把 Codex CLI 作为 MCP 工具接入 Agents SDK，再用清晰的角色分工 + 门控交接(gating)来做流程编排，会稳定很多。

> [!tip] 先补背景
> 如果你还没用过 MCP，先读: [[AI编程能力-Codex-MCP模型上下文协议]]。

## 你会搭出什么

- 在 Python 里运行一个 agent 系统(单 agent 或多 agent)
- 通过 `MCPServerStdio` 把 Codex CLI 暴露为可调用的工具
- 用“交付物存在才允许 handoff”的方式，把流程做成可追踪, 可审计的流水线
- 通过 trace/日志把每次 handoff, 工具调用, 耗时定位清楚

## 核心概念(新手版)

- Agents SDK: 一个用来编排 agent 的框架，你可以把任务拆给不同角色，并控制交接顺序。
- MCP Server: 一个“工具服务器”，把外部能力包装成可调用的 tool。这里我们把 Codex CLI 变成 tool。
- Tool(工具): agent 可以调用的能力，例如“运行 Codex”, “读文件”, “生成代码”。
- Handoff(交接): 一个 agent 把任务转交给另一个 agent。
- Gating(门控): 在交接前先检查“该有的文件/输出是否存在”，不满足就不交接，避免跑偏。

## 环境准备

> [!warning] 不要提交 `.env`
> 本地可以用 `.env`，但要加入 `.gitignore`。CI 必须用 Secrets/变量注入 `OPENAI_API_KEY`。

1. 准备 `OPENAI_API_KEY` 环境变量
2. 安装依赖(二选一)

Notebook:

```python
%pip install openai-agents openai
```

普通 Python 环境:

```bash
pip install openai-agents openai
```

## 用 MCPServerStdio 启动 Codex CLI MCP Server

下面代码会在 Python 进程里启动一个 MCP server 子进程(`npx -y codex mcp-server`)，并把它挂到 Agents SDK 里。

```python
import asyncio
from agents.mcp import MCPServerStdio


async def main() -> None:
    async with MCPServerStdio(
        name="Codex CLI",
        params={
            "command": "npx",
            "args": ["-y", "codex", "mcp-server"],
        },
        # 大任务可能很久，适当拉长超时
        client_session_timeout_seconds=360000,
    ) as codex_mcp_server:
        print("Codex MCP server started.")
        # 在这里把 codex_mcp_server 传给你的 Agent(...)
        return
```

## 单 agent 示例: 设计师写 brief, 开发者实现

这个模式适合“一个人想点子, 另一个人干活”的任务拆分。

```python
import asyncio
from agents import Agent, Runner
from agents.mcp import MCPServerStdio


async def main() -> None:
    async with MCPServerStdio(
        name="Codex CLI",
        params={"command": "npx", "args": ["-y", "codex", "mcp-server"]},
        client_session_timeout_seconds=360000,
    ) as codex_mcp_server:
        developer_agent = Agent(
            name="Game Developer",
            instructions=(
                "You are an expert in building simple games using basic html + css + javascript with no dependencies. "
                "Save your work in a file called index.html in the current directory. "
                "Always call codex with \"approval-policy\": \"never\" and \"sandbox\": \"workspace-write\"."
            ),
            mcp_servers=[codex_mcp_server],
        )

        designer_agent = Agent(
            name="Game Designer",
            instructions=(
                "You are an indie game connoisseur. Come up with an idea for a single page html + css + javascript game "
                "that a developer could build in about 50 lines of code. "
                "Format your request as a 3 sentence design brief for a game developer and call the Game Developer coder "
                "with your idea."
            ),
            model="gpt-5",
            handoffs=[developer_agent],
        )

        result = await Runner.run(designer_agent, "Implement a fun new game!")
        # print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
```

关键点:

- `developer_agent` 被允许写当前目录文件(示例里是 `index.html`)
- `designer_agent` 不写代码，只负责把需求写清楚并 handoff

## 多 agent 编排(推荐模式): 用 PM 门控交接

当任务变大(要产出设计稿, 代码, 测试, 文档)时，更稳的做法是加一个“项目经理(PM) agent”:

- PM 负责拆任务和验收标准
- 每次 handoff 前，PM 先检查上一位 agent 的产物是否真的写出来了(比如 `design_spec.md` 是否存在)
- 如果不存在，PM 要求补齐，而不是直接交给下一位 agent

一个常见的角色划分:

- Project Manager: 写任务清单, 定义交付物, 门控 handoff
- Designer: 输出 `design/` 下的设计说明
- Frontend Dev: 输出 `frontend/` 下代码
- Backend Dev: 输出 `backend/` 下代码
- Tester: 输出 `tests/` 下用例, 并跑验证

![[../4-Archives/attachments/Pasted image 20260226212534.png]]

> [!tip]
> 你不需要一口气上多 agent。先把“交付物 + 验证命令”写清楚，再决定要不要拆角色。

## 可观测性(为什么这套更可控)

当你把 Codex 作为 MCP 工具接入，并且用 PM 门控交接后，你会更容易定位问题:

- 哪一步最慢(看耗时)
- 哪一步产物缺失(看文件/路径)
- 哪个 agent 的输出不符合规范(看 prompt 和 tool call 记录)

![Multi-Agent Trace](https://developers.openai.com/cookbook/assets/images/multi_agent_trace.png)

![Multi-Agent Trace Details](https://developers.openai.com/cookbook/assets/images/multi_agent_trace_details.png)

## 常见坑(踩一次就记住)

- 超时: 长任务需要把 MCP 的 session timeout 拉长，否则中途断开。
- 权限: CI 里尽量最小权限，能只读就只读，能开 PR 就别直接 push 到 main。
- 上下文: 多 agent 会放大“上下文不一致”的问题，强制每个 agent 只读指定文件(例如 `AGENT_TASKS.md`)会更稳。
- 验证: 每个里程碑都要有可执行验证(测试命令, curl 请求, 人工检查清单)。

## 参考

- 原文链接:[ Building Consistent Workflows with Codex CLI & Agents SDK](https://developers.openai.com/cookbook/examples/codex/codex_mcp_agents_sdk/building_consistent_workflows_codex_cli_agents_sdk/)
