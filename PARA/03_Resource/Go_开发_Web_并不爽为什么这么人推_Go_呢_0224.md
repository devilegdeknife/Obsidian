---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
---
# Go 开发 Web 并不爽为什么这么人推 Go 呢?
[内容链接](https://www.zhihu.com/question/456669235/answer/3178368747)

我一个人懂go。

就可以让团队20个人在略懂的情况下开发出高性能的系统。

这下好了，团队的同学都开始懂了

给大家强烈推荐一个教科书级别的国产项目：go-answer（项目捐给Apache了，改叫：incubator-answer），各种技术栈、开发风格、模块结构设计是面面俱到，我这种代码强迫症看着都心情舒畅。

感谢大家的青睐，最近又发现一个用心的作品：tiny-rdm。使用go-wails+vue开发的跨平台redis客户端，作为go开发客户端一个很不错的示例。

再给大家推荐一个。快速开发带数据库的管理系统：pocketbase。这个项目让开发者更侧重于用户端（自带js sdk和dart sdk）的开发，免去再搭建数据库和开发crud代码（用的sqlite）。主要开发一些个人项目。

2025年了，也该扩展go的边界了吧。[go nes 模拟器](https://link.zhihu.com/?target=https%3A//github.com/fogleman/nes)这个项目让你熟悉一个模拟器的底层到底在做什么，如何用go调用opengl渲染界面，如何用audio编排音频，如何监听输入设备，如何解码程序并在虚拟的CPU和内存上运行。

啥，nes是个老东西，那要不要看看[ollama](https://link.zhihu.com/?target=https%3A//github.com/ollama/ollama)是如何用golang编写大模型运行环境，用go调用cuda。

再看看使用[bubbletea](https://link.zhihu.com/?target=https%3A//github.com/charmbracelet/bubbletea)设计一个运行于命令行的APP。

亦或者直接做一款2D游戏[ebiten](https://link.zhihu.com/?target=https%3A//github.com/hajimehoshi/ebiten)。




使用go写mcp服务终于出现了一个标杆型应用，github用go重构了自己的mcp应用：[github-mcp-server](https://link.zhihu.com/?target=https%3A//github.com/github/github-mcp-server)，go的面向网络协议开发和跨平台特性将被AI产业青睐。

宣布个事儿，[mcp 官方 go sdk](https://link.zhihu.com/?target=https%3A//github.com/modelcontextprotocol/go-sdk)发布了，结合了google官方sdk设计风格，涵盖了3个go热门的mcp sdk的设计，堪称集大成之作。

第二个，字节把自己的看家本身[cloudwego/eino](https://link.zhihu.com/?target=https%3A//github.com/cloudwego/eino)go的AI Agent设计框架开源了，并且保证和字节内部使用的一致，据我所知Coze的后端可能就是用该框架做的。
