# AGENTS.md ─ Obsidian Vault 行为规范（2026版）

## 核心哲学

- 这是一个**双向链接优先**的 PKM 系统，所有重要概念都应尽可能双向链接。
- 笔记原子化：一条笔记只讲一件事，长度控制在 300–1200 字。
- 永不删除用户已写的内容，除非用户明确指令“删除”或“重构为”。
- 永远使用 Obsidian 原生语法：[[WikiLink]]、 ![[嵌入]]、#标签、^块引用、$LaTeX$。
- 禁止生成 frontmatter 除非用户当前笔记已有，或明确要求。
- 禁止使用 ![ ]( ) 外部图片链接，优先 ![[vault 内附件]]。

## 文件组织与命名规范

- 所有 fleeting / literature notes 放在 Inbox/ 或 0_Inbox/
- Evergreen notes 放在 2_Evergreen/ 或 Concepts/
- MOC（Maps of Content）统一前缀：MOC- 或 Hub-
- 日记统一格式：Journal/2026-02-26.md（ISODate）
- 插件数据文件夹（.obsidian/、插件名/）禁止修改，除非用户说“可以改插件配置”

## 链接与引用偏好

- 优先使用 [[ ]] 链接已存在笔记；若笔记不存在，询问用户是否创建。
- 强烈鼓励使用块引用 ^block-id 而不是直接复制大段文字。
- 嵌入优先用 ![[note#section]] 或 ![[note^block]]，避免内容重复。
- 标签系统：#status/seed #status/evergreen #type/concept #type/method 等

## 写作与编辑风格

- 输出使用简体中文（或用户当前笔记语言）。
- 语气专业但不死板，允许轻度幽默（类似 Grok 风格）。
- 列表使用 - 而非 * 或数字（除非有序）。
- 代码块永远指定语言 ```python/```ts /```markdown
- 永远在建议修改时，先给出 diff 风格预览，再完整替换。

## 常见任务指令偏好

- 当用户说“整理”/“提炼” → 输出 MOC 或结构化总结 + 建议创建的原子笔记列表
- 当用户说“扩展”/“写文献笔记” → 先搜索 vault 内相关笔记，再补充新内容
- 当用户说“创建插件想法” → 同时生成 manifest.json 草稿 + main.ts 框架 + 推荐文件夹结构
- 涉及 Dataview / Templater / QuickAdd 时，先确认用户是否安装该插件
- When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.

## 安全与边界

- 绝不输出任何真实 API Key、密码、个人敏感路径
- 涉及 .obsidian/ 插件配置修改时，必须先输出完整 diff 并等待用户确认
- 如果用户输入包含 {{date}} / {{title}} 等模板变量，自动解析为实际值

最后更新：2026-02-26
