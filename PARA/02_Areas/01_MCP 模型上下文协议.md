---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - #codex
  - #coding
  - #mcp
---
# 模型上下文协议 (MCP)

> [!summary] 一句话
> MCP (Model Context Protocol) 用来把模型连接到“工具”和“上下文”。对 Codex 来说，它让你可以在 CLI 或 IDE 里安全地接入外部能力, 例如读取文档, 操作浏览器, 或连接 Figma, Sentry, GitHub 等服务。

## 什么时候需要 MCP

- 你希望 Codex “查阅”最新文档，而不是只靠模型记忆。
- 你希望 Codex 调用外部工具 (例如浏览器自动化, Figma, Sentry, GitHub API)。
- 你希望用允许列表限制可用工具，降低误操作风险。

## MCP 服务器的两种形态

- **STDIO 服务器**: 作为本地进程运行，通过标准输入输出和 Codex 通信。
- **HTTP 服务器**: 通过 URL 访问的服务端点，Codex 通过 HTTP 调用 (可流式)。

> [!warning] 安全
> 不要把长期密钥硬编码进 `config.toml` 或仓库。优先使用环境变量 (CI Secrets) 或 OAuth 登录流程。

## 在 Codex 里配置 MCP 的两种方式

1. 通过 CLI: `codex mcp ...`
2. 直接编辑配置: `~/.codex/config.toml`，或项目内 `.codex/config.toml` (只对你信任的项目使用)。

### 方式 A: 用 CLI 配置 (更适合新手)

#### 添加 STDIO 服务器

```bash
codex mcp add <server-name> --env VAR1=VALUE1 --env VAR2=VALUE2 -- <command> <args...>
```

例子: 添加 Context7 (用于开发者文档)

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

#### 其他常用命令

```bash
codex mcp --help
codex mcp list
codex mcp remove <server-name>
codex mcp login <server-name>  # 需要 OAuth 时使用
```

> [!tip] 在 Codex TUI 里查看 MCP
> 打开 `codex` 的终端界面后，输入 `/mcp` 查看已启用的服务器。

### 方式 B: 直接编辑 config.toml (更灵活)

Codex 的 MCP 配置和其它设置一起存放在 `config.toml` 中。用 `[mcp_servers.<name>]` 配置每个服务器。

#### STDIO 服务器字段

- `command` (必需): 启动服务器的命令
- `args` (可选): 传给命令的参数
- `env` (可选): 该服务器的环境变量
- `env_vars` (可选): 允许从当前环境转发哪些变量
- `cwd` (可选): 启动时的工作目录

#### HTTP 服务器字段

- `url` (必需): 服务器地址
- `bearer_token_env_var` (可选): 从哪个环境变量读取 bearer token
- `http_headers` (可选): 静态 HTTP Header
- `env_http_headers` (可选): 从环境变量读取的 Header

#### config.toml 示例

Context7 (STDIO)

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
```

Figma (HTTP, bearer token)

```toml
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"
http_headers = { "X-Figma-Region" = "us-east-1" }
```

本地 Chrome DevTools (HTTP)

```toml
[mcp_servers.chrome_devtools]
url = "http://localhost:3000/mcp"
enabled = true
enabled_tools = ["open", "screenshot"]
startup_timeout_sec = 20
tool_timeout_sec = 45
```

## 一些常见 MCP 服务器 (备忘)

- OpenAI Docs MCP: https://developers.openai.com/resources/docs-mcp
- Context7: https://github.com/upstash/context7
- Figma MCP: https://developers.figma.com/docs/figma-mcp-server/
- Playwright MCP: https://www.npmjs.com/package/@playwright/mcp
- Chrome DevTools MCP: https://github.com/ChromeDevTools/chrome-devtools-mcp/
- Sentry MCP: https://docs.sentry.io/product/sentry-mcp/
- GitHub MCP: https://github.com/github/github-mcp-server

