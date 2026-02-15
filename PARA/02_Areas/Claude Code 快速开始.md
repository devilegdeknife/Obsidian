---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - #1
  - #编程
  - #claude-code
  - #vibe-coding
  - #workflow
---
本文档中的每项任务都包含清晰的说明、示例命令和最佳实践，帮助您充分利用 Claude Code。

## 理解新的代码库

### 获取代码库的快速概览

假设您刚加入一个新项目，需要快速了解其结构。

1

导航到项目根目录

```
cd /path/to/project
```

2

启动 Claude Code

```
claude
```

3

请求高级概览

```
> give me an overview of this codebase
```

4

深入了解特定组件

```
> explain the main architecture patterns used here
```

```
> what are the key data models?
```

```
> how is authentication handled?
```

提示：

- 从广泛的问题开始，然后缩小到特定领域
- 询问项目中使用的编码约定和模式
- 请求项目特定术语的词汇表

### 查找相关代码

假设您需要定位与特定功能相关的代码。

1

要求 Claude 查找相关文件

```
> find the files that handle user authentication
```

2

获取有关组件如何交互的上下文

```
> how do these authentication files work together?
```

3

理解执行流程

```
> trace the login process from front-end to database
```

提示：

- 具体说明您要查找的内容
- 使用项目中的领域语言

---

## 高效修复错误

假设您遇到了错误消息，需要找到并修复其来源。

1

与 Claude 分享错误

```
> I'm seeing an error when I run npm test
```

2

请求修复建议

```
> suggest a few ways to fix the @ts-ignore in user.ts
```

3

应用修复

```
> update user.ts to add the null check you suggested
```

提示：

- 告诉 Claude 重现问题的命令并获取堆栈跟踪
- 提及重现错误的任何步骤
- 让 Claude 知道错误是间歇性的还是持续的

---

## 重构代码

假设您需要更新旧代码以使用现代模式和实践。

1

识别用于重构的遗留代码

```
> find deprecated API usage in our codebase
```

2

获取重构建议

```
> suggest how to refactor utils.js to use modern JavaScript features
```

3

安全地应用更改

```
> refactor utils.js to use ES2024 features while maintaining the same behavior
```

4

验证重构

```
> run tests for the refactored code
```

提示：

- 要求 Claude 解释现代方法的优势
- 请求更改在需要时保持向后兼容性
- 以小的、可测试的增量进行重构

---

## 使用专门的子代理

假设您想使用专门的 AI 子代理来更有效地处理特定任务。

1

查看可用的子代理

```
> /agents
```

这显示所有可用的子代理，并让您创建新的。

2

自动使用子代理

Claude Code 自动将适当的任务委派给专门的子代理：

```
> review my recent code changes for security issues
```

```
> run all tests and fix any failures
```

3

显式请求特定的子代理

```
> use the code-reviewer subagent to check the auth module
```

```
> have the debugger subagent investigate why users can't log in
```

4

为您的工作流创建自定义子代理

```
> /agents
```

然后选择”Create New subagent”并按照提示定义：

- 描述子代理目的的唯一标识符（例如，`code-reviewer`、`api-designer`）。
- Claude 何时应使用此代理
- 它可以访问哪些工具
- 描述代理角色和行为的系统提示

提示：

- 在 `.claude/agents/` 中创建项目特定的子代理以供团队共享
- 使用描述性的 `description` 字段来启用自动委派
- 限制工具访问权限为每个子代理实际需要的内容
- 查看[子代理文档](https://code.claude.com/docs/zh-CN/sub-agents)了解详细示例

---

## 使用计划模式进行安全的代码分析

计划模式指示 Claude 通过使用只读操作分析代码库来创建计划，非常适合探索代码库、规划复杂更改或安全地审查代码。

### 何时使用计划模式

- **多步骤实现**：当您的功能需要编辑许多文件时
- **代码探索**：当您想在更改任何内容之前彻底研究代码库时
- **交互式开发**：当您想与 Claude 迭代方向时

### 如何使用计划模式

**在会话期间打开计划模式**
您可以在会话期间使用 **Shift+Tab** 循环切换权限模式来切换到计划模式。
如果您处于正常模式，**Shift+Tab** 首先切换到自动接受模式，在终端底部显示 `⏵⏵ accept edits on`。随后的 **Shift+Tab** 将切换到计划模式，显示 `⏸ plan mode on`。
**在计划模式下启动新会话**
要在计划模式下启动新会话，请使用 `--permission-mode plan` 标志：

```
claude --permission-mode plan
```

**在计划模式下运行”无头”查询**
您也可以直接在计划模式下使用 `-p`（即在[”无头模式”](https://code.claude.com/docs/zh-CN/headless)中）运行查询：

```
claude --permission-mode plan -p "Analyze the authentication system and suggest improvements"
```

### 示例：规划复杂的重构

```
claude --permission-mode plan
```

```
> I need to refactor our authentication system to use OAuth2. Create a detailed migration plan.
```

Claude 分析当前实现并创建全面的计划。通过后续问题进行细化：

```
> What about backward compatibility?
> How should we handle database migration?
```

### 将计划模式配置为默认值

```
// .claude/settings.json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

有关更多配置选项，请参阅[设置文档](https://code.claude.com/docs/zh-CN/settings#available-settings)。

---

## 使用测试

假设您需要为未覆盖的代码添加测试。

1

识别未测试的代码

```
> find functions in NotificationsService.swift that are not covered by tests
```

2

生成测试框架

```
> add tests for the notification service
```

3

添加有意义的测试用例

```
> add test cases for edge conditions in the notification service
```

4

运行并验证测试

```
> run the new tests and fix any failures
```

Claude 可以生成遵循您项目现有模式和约定的测试。请求测试时，请具体说明您想验证的行为。Claude 检查您现有的测试文件以匹配已在使用的样式、框架和断言模式。
为了获得全面的覆盖，要求 Claude 识别您可能遗漏的边界情况。Claude 可以分析您的代码路径并建议测试错误条件、边界值和容易忽略的意外输入。

---

## 创建拉取请求

假设您需要为您的更改创建一个文档完善的拉取请求。

1

总结您的更改

```
> summarize the changes I've made to the authentication module
```

2

使用 Claude 生成拉取请求

```
> create a pr
```

3

审查和细化

```
> enhance the PR description with more context about the security improvements
```

4

添加测试详情

```
> add information about how these changes were tested
```

提示：

- 直接要求 Claude 为您创建 PR
- 在提交前审查 Claude 生成的 PR
- 要求 Claude 突出显示潜在的风险或考虑因素

## 处理文档

假设您需要为代码添加或更新文档。

1

识别未记录的代码

```
> find functions without proper JSDoc comments in the auth module
```

2

生成文档

```
> add JSDoc comments to the undocumented functions in auth.js
```

3

审查和增强

```
> improve the generated documentation with more context and examples
```

4

验证文档

```
> check if the documentation follows our project standards
```

提示：

- 指定您想要的文档样式（JSDoc、docstrings 等）
- 请求文档中的示例
- 请求公共 API、接口和复杂逻辑的文档

---

## 使用图像

假设您需要在代码库中使用图像，并希望 Claude 帮助分析图像内容。

1

将图像添加到对话中

您可以使用以下任何方法：

1. 将图像拖放到 Claude Code 窗口中
2. 复制图像并使用 ctrl+v 将其粘贴到 CLI 中（不要使用 cmd+v）
3. 向 Claude 提供图像路径。例如，“Analyze this image: /path/to/your/image.png”

2

要求 Claude 分析图像

```
> What does this image show?
```

```
> Describe the UI elements in this screenshot
```

```
> Are there any problematic elements in this diagram?
```

3

使用图像获取上下文

```
> Here's a screenshot of the error. What's causing it?
```

```
> This is our current database schema. How should we modify it for the new feature?
```

4

从视觉内容获取代码建议

```
> Generate CSS to match this design mockup
```

```
> What HTML structure would recreate this component?
```

提示：

- 当文本描述不清楚或繁琐时，使用图像
- 包含错误、UI 设计或图表的屏幕截图以获得更好的上下文
- 您可以在对话中使用多个图像
- 图像分析适用于图表、屏幕截图、模型等
- 当 Claude 引用图像时（例如，`[Image #1]`），`Cmd+Click`（Mac）或 `Ctrl+Click`（Windows/Linux）链接以在默认查看器中打开图像

---

## 引用文件和目录

使用 @ 快速包含文件或目录，无需等待 Claude 读取它们。

1

引用单个文件

```
> Explain the logic in @src/utils/auth.js
```

这在对话中包含文件的完整内容。

2

引用目录

```
> What's the structure of @src/components?
```

这提供了包含文件信息的目录列表。

3

引用 MCP 资源

```
> Show me the data from @github:repos/owner/repo/issues
```

这使用 @server:resource 格式从连接的 MCP 服务器获取数据。有关详细信息，请参阅 [MCP 资源](https://code.claude.com/docs/zh-CN/mcp#use-mcp-resources)。

提示：

- 文件路径可以是相对的或绝对的
- @ 文件引用在文件目录和父目录中添加 `CLAUDE.md` 到上下文
- 目录引用显示文件列表，而不是内容
- 您可以在单个消息中引用多个文件（例如，“@file1.js and @file2.js”）

---

## 使用扩展思考（思考模式）

[扩展思考](https://docs.claude.com/en/docs/build-with-claude/extended-thinking)为 Claude 保留总输出令牌预算的一部分，以便逐步推理复杂问题。这种推理在详细模式中可见，您可以使用 `Ctrl+O` 切换。
扩展思考对于复杂的架构决策、具有挑战性的错误、多步骤实现规划和评估不同方法之间的权衡特别有价值。它为探索多个解决方案、分析边界情况和自我纠正错误提供了更多空间。

Sonnet 4.5 和 Opus 4.5 默认启用思考。所有其他模型默认禁用思考。使用 `/model` 查看或切换您当前的模型。

您可以通过多种方式为 Claude Code 配置思考模式：

| 范围 | 如何启用 | 详情 |
| --- | --- | --- |
| **切换快捷键** | 按 `Option+T`（macOS）或 `Alt+T`（Windows/Linux） | 切换思考开/关。可能需要[终端配置](https://code.claude.com/docs/zh-CN/terminal-config)来启用 Option 键快捷键 |
| **全局默认值** | 使用 `/config` 切换思考模式开启 | 在所有项目中设置您的默认值。 保存为 `~/.claude/settings.json` 中的 `alwaysThinkingEnabled` |
| **环境变量覆盖** | 设置 [`MAX_THINKING_TOKENS`](https://code.claude.com/docs/zh-CN/settings#environment-variables) 环境变量 | 设置后，对所有请求应用自定义令牌预算，覆盖您的思考模式配置。示例：`export MAX_THINKING_TOKENS=1024` |

### 使用 `ultrathink` 的每个请求思考

您可以在消息中包含 `ultrathink` 作为关键字来为单个请求启用思考：

```
> ultrathink: design a caching layer for our API
```

请注意，`ultrathink` 既分配思考预算，又在语义上向 Claude 发出信号以进行更彻底的推理，这可能导致比任务所需更深入的思考。
`ultrathink` 关键字仅在未设置 `MAX_THINKING_TOKENS` 时有效。当配置了 `MAX_THINKING_TOKENS` 时，它优先并控制所有请求的思考预算。
其他短语如”think”、“think hard”和”think more”被解释为常规提示指令，不分配思考令牌。
要查看 Claude 的思考过程，按 `Ctrl+O` 切换详细模式，并查看显示为灰色斜体文本的内部推理。
有关详细的预算信息和成本影响，请参阅下面的[令牌预算部分](https://code.claude.com/docs/zh-CN/common-workflows#how-extended-thinking-token-budgets-work)。

### 扩展思考令牌预算如何工作

扩展思考使用**令牌预算**来控制 Claude 在响应前可以执行多少内部推理。
更大的思考令牌预算提供：

- 更多空间逐步探索多个解决方案方法
- 空间彻底分析边界情况和评估权衡
- 修改推理和自我纠正错误的能力

思考模式的令牌预算：

- 当思考**启用**时（通过 `/config` 或 `ultrathink`），Claude 可以从您的输出预算中使用最多 **31,999 个令牌**进行内部推理
- 当思考**禁用**时，Claude 使用 **0 个令牌**进行思考

**自定义令牌预算：**

- 您可以使用 [`MAX_THINKING_TOKENS` 环境变量](https://code.claude.com/docs/zh-CN/settings#environment-variables)设置自定义思考令牌预算
- 这具有最高优先级并覆盖默认的 31,999 令牌预算
- 有关有效令牌范围，请参阅[扩展思考文档](https://docs.claude.com/en/docs/build-with-claude/extended-thinking)

您需要为所有使用的思考令牌付费，即使 Claude 4 模型显示总结的思考

---

## 恢复以前的对话

启动 Claude Code 时，您可以恢复以前的会话：

- `claude --continue` 继续当前目录中最近的对话
- `claude --resume` 打开对话选择器或按名称恢复

从活跃会话内部，使用 `/resume` 切换到不同的对话。
会话按项目目录存储。`/resume` 选择器显示来自同一 git 存储库的会话，包括工作树。

### 命名您的会话

给会话起描述性的名称以便稍后找到它们。这是在处理多个任务或功能时的最佳实践。

1

命名当前会话

在会话期间使用 `/rename` 给它起一个易记的名称：

```
> /rename auth-refactor
```

您也可以从选择器重命名任何会话：运行 `/resume`，导航到会话，然后按 `R`。

2

稍后按名称恢复

从命令行：

```
claude --resume auth-refactor
```

或从活跃会话内部：

```
> /resume auth-refactor
```

### 使用会话选择器

`/resume` 命令（或不带参数的 `claude --resume`）打开具有以下功能的交互式会话选择器：
**选择器中的键盘快捷键：**

| 快捷键 | 操作 |
| --- | --- |
| `↑` / `↓` | 在会话之间导航 |
| `→` / `←` | 展开或折叠分组的会话 |
| `Enter` | 选择并恢复突出显示的会话 |
| `P` | 预览会话内容 |
| `R` | 重命名突出显示的会话 |
| `/` | 搜索以过滤会话 |
| `A` | 在当前目录和所有项目之间切换 |
| `B` | 过滤来自您当前 git 分支的会话 |
| `Esc` | 退出选择器或搜索模式 |

**会话组织：**
选择器显示带有有用元数据的会话：

- 会话名称或初始提示
- 自上次活动以来经过的时间
- 消息计数
- Git 分支（如果适用）

分叉的会话（使用 `/rewind` 或 `--fork-session` 创建）在其根会话下分组，使查找相关对话更容易。

提示：

- **尽早命名会话**：在开始处理不同任务时使用 `/rename`——稍后查找”payment-integration”比”explain this function”容易得多
- 使用 `--continue` 快速访问当前目录中最近的对话
- 当您知道需要哪个会话时，使用 `--resume session-name`
- 当您需要浏览和选择时，使用 `--resume`（不带名称）
- 对于脚本，使用 `claude --continue --print "prompt"` 以非交互模式恢复
- 在选择器中按 `P` 在恢复前预览会话
- 恢复的对话以与原始对话相同的模型和配置开始

它如何工作：

1. **对话存储**：所有对话都自动保存在本地，包含完整的消息历史
2. **消息反序列化**：恢复时，整个消息历史被恢复以保持上下文
3. **工具状态**：来自以前对话的工具使用和结果被保留
4. **上下文恢复**：对话以所有以前的上下文完整恢复

---

## 使用 Git 工作树运行并行 Claude Code 会话

假设您需要同时处理多个任务，并在 Claude Code 实例之间完全隔离代码。

1

理解 Git 工作树

Git 工作树允许您从同一存储库检出多个分支到单独的目录中。每个工作树都有自己的工作目录，文件隔离，同时共享相同的 Git 历史。在[官方 Git 工作树文档](https://git-scm.com/docs/git-worktree)中了解更多。

2

创建新的工作树

```
# 使用新分支创建新的工作树
git worktree add ../project-feature-a -b feature-a

# 或使用现有分支创建工作树
git worktree add ../project-bugfix bugfix-123
```

这创建了一个新目录，其中包含您的存储库的单独工作副本。

3

在每个工作树中运行 Claude Code

```
# 导航到您的工作树
cd ../project-feature-a

# 在此隔离环境中运行 Claude Code
claude
```

4

在另一个工作树中运行 Claude

```
cd ../project-bugfix
claude
```

5

管理您的工作树

```
# 列出所有工作树
git worktree list

# 完成后移除工作树
git worktree remove ../project-feature-a
```

提示：

- 每个工作树都有自己的独立文件状态，非常适合并行 Claude Code 会话
- 在一个工作树中所做的更改不会影响其他工作树，防止 Claude 实例相互干扰
- 所有工作树共享相同的 Git 历史和远程连接
- 对于长期运行的任务，您可以在一个工作树中让 Claude 工作，同时在另一个工作树中继续开发
- 使用描述性目录名称轻松识别每个工作树用于哪个任务
- 记住根据您的项目设置在每个新工作树中初始化您的开发环境。根据您的堆栈，这可能包括：
  - JavaScript 项目：运行依赖项安装（`npm install`、`yarn`）
  - Python 项目：设置虚拟环境或使用包管理器安装
  - 其他语言：遵循您的项目标准设置过程

---

## 将 Claude 用作 unix 风格的实用程序

### 将 Claude 添加到您的验证过程

假设您想将 Claude Code 用作 linter 或代码审查工具。
**将 Claude 添加到您的构建脚本：**

```
// package.json
{
    ...
    "scripts": {
        ...
        "lint:claude": "claude -p 'you are a linter. please look at the changes vs. main and report any issues related to typos. report the filename and line number on one line, and a description of the issue on the second line. do not return any other text.'"
    }
}
```

提示：

- 在您的 CI/CD 管道中使用 Claude 进行自动代码审查
- 自定义提示以检查与您的项目相关的特定问题
- 考虑为不同类型的验证创建多个脚本

### 管道输入、管道输出

假设您想将数据管道输入 Claude，并以结构化格式获取数据。
**通过 Claude 管道数据：**

```
cat build-error.txt | claude -p 'concisely explain the root cause of this build error' > output.txt
```

提示：

- 使用管道将 Claude 集成到现有的 shell 脚本中
- 与其他 Unix 工具结合以实现强大的工作流
- 考虑使用 —output-format 获得结构化输出

### 控制输出格式

假设您需要 Claude 的输出采用特定格式，特别是在将 Claude Code 集成到脚本或其他工具时。

1

使用文本格式（默认）

```
cat data.txt | claude -p 'summarize this data' --output-format text > summary.txt
```

这仅输出 Claude 的纯文本响应（默认行为）。

2

使用 JSON 格式

```
cat code.py | claude -p 'analyze this code for bugs' --output-format json > analysis.json
```

这输出包含元数据（包括成本和持续时间）的消息的 JSON 数组。

3

使用流式 JSON 格式

```
cat log.txt | claude -p 'parse this log file for errors' --output-format stream-json
```

这实时输出一系列 JSON 对象，因为 Claude 处理请求。每条消息都是有效的 JSON 对象，但如果连接，整个输出不是有效的 JSON。

提示：

- 对于简单集成（您只需要 Claude 的响应），使用 `--output-format text`
- 当您需要完整的对话日志时，使用 `--output-format json`
- 对于每个对话轮次的实时输出，使用 `--output-format stream-json`

---

## 创建自定义斜杠命令

Claude Code 支持自定义斜杠命令，您可以创建这些命令来快速执行特定的提示或任务。
有关更多详情，请参阅[斜杠命令](https://code.claude.com/docs/zh-CN/slash-commands)参考页面。

### 创建项目特定的命令

假设您想为您的项目创建可重用的斜杠命令，所有团队成员都可以使用。

1

在您的项目中创建命令目录

```
mkdir -p .claude/commands
```

2

为每个命令创建一个 Markdown 文件

```
echo "Analyze the performance of this code and suggest three specific optimizations:" > .claude/commands/optimize.md
```

3

在 Claude Code 中使用您的自定义命令

```
> /optimize
```

提示：

- 命令名称来自文件名（例如，`optimize.md` 变成 `/optimize`）
- 您可以在子目录中组织命令（例如，`.claude/commands/frontend/component.md` 创建 `/component`，在描述中显示”(project:frontend)”）
- 项目命令对克隆存储库的每个人都可用
- Markdown 文件内容成为调用命令时发送给 Claude 的提示

### 使用 $ARGUMENTS 添加命令参数

假设您想创建灵活的斜杠命令，可以接受用户的额外输入。

1

创建带有 $ARGUMENTS 占位符的命令文件

```
echo 'Find and fix issue #$ARGUMENTS. Follow these steps: 1.
Understand the issue described in the ticket 2. Locate the relevant code in
our codebase 3. Implement a solution that addresses the root cause 4. Add
appropriate tests 5. Prepare a concise PR description' >
.claude/commands/fix-issue.md
```

2

使用问题编号使用命令

在您的 Claude 会话中，使用带参数的命令。

```
> /fix-issue 123
```

这在提示中用”123”替换 $ARGUMENTS。

提示：

- $ARGUMENTS 占位符被替换为命令后面的任何文本
- 您可以在命令模板中的任何位置放置 $ARGUMENTS
- 其他有用的应用：为特定函数生成测试用例、为组件创建文档、审查特定文件中的代码或将内容翻译为指定的语言

### 创建个人斜杠命令

假设您想创建在所有项目中工作的个人斜杠命令。

1

在您的主文件夹中创建命令目录

```
mkdir -p ~/.claude/commands
```

2

为每个命令创建一个 Markdown 文件

```
echo "Review this code for security vulnerabilities, focusing on:" >
~/.claude/commands/security-review.md
```

3

使用您的个人自定义命令

```
> /security-review
```

提示：

- 个人命令在使用 `/help` 列出时在描述中显示”(user)”
- 个人命令仅对您可用，不与您的团队共享
- 个人命令在所有项目中工作
- 您可以使用这些在不同代码库中保持一致的工作流

---

## 询问 Claude 其功能

Claude 可以内置访问其文档，并可以回答有关其自身功能和限制的问题。

### 示例问题

```
> can Claude Code create pull requests?
```

```
> how does Claude Code handle permissions?
```

```
> what slash commands are available?
```

```
> how do I use MCP with Claude Code?
```

```
> how do I configure Claude Code for Amazon Bedrock?
```

```
> what are the limitations of Claude Code?
```

Claude 为这些问题提供基于文档的答案。有关可执行示例和实际演示，请参阅上面的特定工作流部分。

提示：

- Claude 始终可以访问最新的 Claude Code 文档，无论您使用的版本如何
- 提出具体问题以获得详细答案
- Claude 可以解释复杂功能，如 MCP 集成、企业配置和高级工作流

---

