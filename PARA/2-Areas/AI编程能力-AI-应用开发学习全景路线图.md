---
创建时间: 2026-02-05
最后修改: 2026-02-15
状态:
  - Inbox
tags:
  - #ai求职实录
para: inbox
aliases:
  - "未命名 1__from__02-学术研究_未命名_1."
---
# AI 应用开发学习全景路线图

想写这个很久了，因为自己在开源和实习中也接触过一些 ai 的工程化内容，对这一块也有一些自己的思考，这个路线图说是 AI 应用开发全景路线图，其实我是想写从 maas 平台到 AI infra 的整个模型工程化的全链路的知识，但是笔力有限，第一版应该先聚焦于平台和应用开发。

学识尚浅，也欢迎各位牛友一起交流，探讨，完善

阅读建议：每个模块开始是我的一点思考和收集的信息，后面就是学习建议和资料（主要是开源项目+文档，视频资源如果有比较不错的也会放上去），有些技术可能没有好的教程，后续会陆陆续续的出文章+ demo 和大家交流

# 一，AI 应用开发到底是什么

## 概述

AI 应用开发这个字眼从 gpt 刚开始火的时候，就有萌芽的势头，到现在各个大厂入局之后，已经变成了目前最火的方向了，也有很多同学想从事相关的工作，但是由于信息的不对称，很多同学对 AI 应用开发有一定的误区。很多同学说不学工程相关的知识（其实就是后端知识，我觉得这样说更容易理解），用 langchain 或者 AutoGPT 这样的框架搭一个 demo ，就算是 AI 应用开发了。其实这个是一个很大的误区

我个人认为这个岗位大体上可以分为一个层级结构吧（不是官方定义！！）

**应用层**----**中间件层/中台**----**模型层**----**infra层**

1. 优化 RL 算法，提升模型能力，Agentic RL 基建，Mutil-agent 等等的算法相关岗位，这个也是 AI 工程整条链路的核心和灵魂，这个是模型层
2. infra 层，写底层算子，CUDA，GPU加速，推理框架开发等等（这个我也不是很懂，但是这个是岗位之一）
3. 中间件层/中台，Agent 开发框架，Maas 平台，机器学习平台，AI 中间件（向量数据库，上下文工程，Memory，AI网关等等），Agent评测和数据 pipline，以及云原生相关的模型调度等等
4. 最后就是应用层，主要就是C端的AI产品，开发者AI，内部的 AI 应用（这里和中间层的耦合比较多，有的能力可能中台会提供，有的可能需要业务自己实现，比较典型的例子就是 rag，上下文工程）而且比较坑的一点是，很多公司的 AI 应用，和 AI 沾边的就一个调 API 。。

所以上面的岗位，大家觉得哪些不需要一个扎实的工程能力呢？难道 AI 应用就不需要稳定性保障和良好的工程架构吗？

所以明确了这个之后我理解，想学 AI 应用开发，需要具备下面的前提条件

- 有足够的后端，前端工程基础
- 对大模型有一定的了解（不能只把这个当作一个黑盒用，连最基本的原理都不知道）

具备以上两个条件，就可以深入的研究一下 AI 了，由于我的学识也很浅薄，所以只能说一下我个人有所接触的应用层和中间件层相关的一点学习知识，也欢迎各位大佬在评论区补充

由于业务层和中间件之间的区别没有那么大，就把相关的技术直接放到一起说了，这一篇先讲智能体相关的

ps: 由于市面上基本没有完整的教程，整体这个学起来就是要看很多内容，我推荐的也是以开源项目，博客，文档为主

# 二，相关技术

### 基础

1. 任意一门编程语言（java,go,py,ts不限）
2. 做过至少一个工程项目（后端黑马点评，前端小兔鲜啥都行）
3. 熟悉主流的中间件
4. 有比较强的产品意识，如何将 AI 与自己的业务结合

### 原生应用

#### 智能体

**工作流**

最先兴起的 AI 应用构建模式，比如 Dify，Coze ，n8n 这些平台，通过可拖拉拽的方式构建一个工作流。利用这样的工作流实现AI能力，但是也可以通过代码编排的模式构造，就像责任链模式一样，通过节点，边，图的概念进行编排

其实这个再深入一些也是一种多智能体的形式，每个节点就是一个智能体，每一个图有一个全局状态，每个节点维护一个自己的状态，这样实现一个多智能体系统

应该学什么：

langgraph 中全局状态和单个节点的状态如何维护

整个图的断点重启机制

如何实现一个自定义节点

子图和父图的实现逻辑

最后用 langgraph 写一个 demo

参考：

langgraph 官方文档

[https://docs.langchain.com/oss/python/langgraph/overview](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fdocs.langchain.com%2Foss%2Fpython%2Flanggraph%2Foverview)

ps: 后面我可能会推荐很多的框架和项目，但是目的不是会用每一种框架，而是学这个里面的一些实现

**单智能体**

智能体是各个 Agent 框架和 AI 应用开发的最小单元，和微服务体系里面的单个服务一样，其实最好理解的方式就是把智能体理解成单个服务，利用微服务架构去理解 AI 原生应用开发，你会发现非常好理解，世界上聪明的人都是共通的

应该学什么：

Function call

智能体是如何调用工具的（以及 agent as a tool 的理念）

ReAct 范式

Reflection 范式

LoopAgent 范式

参考：

DataWhale 的智能体入门项目，适合整体构建起自己的 AI 开放体系，但是讲的有些地方并不详细

[https://github.com/datawhalechina/hello-agents](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fdatawhalechina%2Fhello-agents)

z-libray 或者 🍠 搜《Agentic Design Patterns》

LangChain中的智能体范式

[https://docs.langchain.com/oss/python/langchain/overview](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fdocs.langchain.com%2Foss%2Fpython%2Flangchain%2Foverview)

google adk java

[https://github.com/google/adk-java](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fgoogle%2Fadk-java)

google adk go

[https://github.com/google/adk-go](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fgoogle%2Fadk-go)

google adk js

[https://github.com/google/adk-js](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fgoogle%2Fadk-js)

google 的 adk 是比较全的，适合不同语言的开发者学习

**多智能体**

多智能体架构不知道算法的同学是怎么理解的，在工程上我的理解就是，把每个智能体作为一个单独的实例，有单独维护的状态，同时还有一个全局维护的状态，同时在远程调用的过程中要依赖分布式事务确保一致性，A2A规范通信格式，消息队列作为 event 中枢，同时根据不同的场景使用不同的调度模式

**应该学什么：**

多智能体设计模式：

1.单智能体作为路由进行任务拆解和分配

2.利用图编排智能体

3.把智能体作为工具使用

**参考：**

上面提到的智能体设计模式

分布式原理

各个框架的多智能体实现原理

以及和工具，记忆结合，多智能体中的工具调用以及记忆是如何实现的

比较完善的多智能体框架：CrewAI

[https://github.com/crewAIInc/crewAI](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2FcrewAIInc%2FcrewAI)

**智能体框架**

上面其实已经实现了很多的智能体框架，这块我就总结一下各个智能体框架都是啥吧，主要是为了让大家祛魅

1.实现 ReAct Agent 范式，在框架中内置一个

2.工具系统，包括调度和 mcp sdk的封装

3.统一的消息格式，兼容 OpenAI 范式

4.多智能体编排

5.扩展模块（tika文档解析，rag等等）

6.A2A，skill 等的实现

7.hook && 拦截器，用于在智能体运行的四个关键节点（智能体执行前，后，模型调用前，后）实现HIL，PII，token压缩等策略和上下文工程，不同的框架叫法不同，langchain是middleware，cursor 中也有 hook 等系统

其实就是互相抄来抄去，当然大部分都是抄 langchain![](https://uploadfiles.nowcoder.com/images/20220815/318889480_1660553763573/A95184503DF1D65798194F12FCEDE5C5)，每个公司基本都会维护一套自己的框架

**Agent SKills**

skills 是什么，要理解这个之前其实要理解一个内容，AI 应用的开发，本质就是各种花样的拼接提示词，给模型，然后各种花样的修饰模型输出的 message。比如工具调用就是把工具的描述拼接到给模型的提示词中，让模型知道我可以调用哪些工具。

那么 skill 就很好理解了，它的本质就是一种动态的提示词工程，通过渐进式披露，以最小的token消耗调用正确的工具，执行正确的流程

参考：

一定要去看 deepagents 的实现，这个 skills 的集成是我见过的所有框架中，最优雅，最简洁的，当然 claude code 的我也看不到![](https://uploadfiles.nowcoder.com/images/20220815/318889480_1660553763490/62AF11E48344D159DA608796DA7D39E5)。

本质就是看四个点

1.ShellTool 怎么做的

2.FileReadTool 怎么做的

3.什么时机加载的 skill

4.skill 的动态加载

[https://docs.langchain.com/oss/python/deepagents/overview](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fdocs.langchain.com%2Foss%2Fpython%2Fdeepagents%2Foverview)

**通信协议**

A2A 和 mcp ，这两个都很简单，都是一种通信协议，本质是为了方便智能体之间的通信，和远程调用工具，可以直接结合文档看官方的 sdk

A2A sdk:

[https://github.com/a2aproject/a2a-java](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fa2aproject%2Fa2a-java)

mcp sdk:

[https://github.com/modelcontextprotocol/java-sdk](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fmodelcontextprotocol%2Fjava-sdk)

还有一个就是 ag-ui 也是智能体通信协议，但是是智能体服务和 UI 之间的通信协议，在后端兼容了 OpenAI 的消息格式之后，就可以快速实现前端的思考步骤展示，流式输出，human in loop 这些复杂的交互形式，和生成式 UI 很像，是智能体通信协议御三家中最有意思的一个

ag-ui

[https://github.com/ag-ui-protocol/ag-ui](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fag-ui-protocol%2Fag-ui)

**智能体评测**

智能体评测是目前比较重要的方向了**，**因为站在工程的角度，一个可用的智能体不是能跑起来就行了，要有很好的可观测设计，以及令人信服的 benchmark，评估输出，工具调度等是否符合预期，要用数据说话

这个也是我最近在学习的，目前看到比较完善的是这个框架，主要的中心可以放到评估器构建，以及如何好像获取高质量的评测数据集

[https://github.com/agentscope-ai/OpenJudge](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fagentscope-ai%2FOpenJudge)

**智能体强化学习**

学习与适应是提升智能体能力的关键。这些过程使智能体能够突破预设参数，通过经验和环境交互自主改进。通过学习和适应，智能体能够有效应对新情况，并在无需持续人工干预的情况下优化自身表现，而且智能体本身这个概念，就是强化学习提出来的

可以看一下这两个算法的原理

PPO 算法

DPO算法

推荐框架：

提供 API 集成，把你的 agent 作为一个数据采集器，利用这个框架实现 Agent 的自适应和进化

[https://github.com/microsoft/agent-lightning](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fmicrosoft%2Fagent-lightning)

**智能体记忆和 RAG**

RAG 已经是老生常谈了，我这里推荐自己实现，不推荐项目，主要的功能点放到下面

**数据清洗**

markdown 格式识别，表格识别优化，多模态数据清洗，结构化数据

**存储：**

ES，Milvus，多种分块策略的实现

**query:**

query 改写的策略

**检索：**

元数据过滤（范围，单值，多值等等）

向量匹配的算法，HNSW等等

混合检索（BM25+向量）

多模态检索

知识图谱

**召回：**

多路召回

**重排：**

reank模型接入，重排算法

**对话：**

上下文记忆和提示词工程

**平台化：**

利用 Apollo 做白名单（结构化数据上传和元数据过滤）

权限控制和多租户

智能体记忆，这个地方的技术太多了，只推荐 mem0

[https://github.com/mem0ai/mem0](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fmem0ai%2Fmem0)

字节新出的上下文数据库，应该也可以看看，不过我还没看![](https://uploadfiles.nowcoder.com/images/20220815/318889480_1660553763490/62AF11E48344D159DA608796DA7D39E5)

[https://github.com/volcengine/OpenViking](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fgithub.com%2Fvolcengine%2FOpenViking)

# 三，学习建议

1. 不要把这个东西想的太高大上，多动手实现
2. 不要忽略自己的工程能力基础

# 四，后续迭代规划

第一个：补充平台和中间件侧的学习路线图，**智能体平台**，**AI 网关，Agent Runtime，Maas 平台，机器学习平台，数据 pipline**

第二个：上面的智能体相关的，其实还是概念和开源项目居多，没有那种适合新手入门的，而且上面的内容也比较精简了，其实每个模块都可以单独写一个文章，基于此，我打算写一个智能体框架和平台，包含上面的所有内容和适合工程同学的教程，都更新在牛客和 github，初期先做 java 版，因为 java 同学的基数比较多（而且我也有一版写了不少的了），后面再做go，ts 版本，**代码 github 开源，教程仓库和牛客同步更新**

第三个：希望牛友们给我一些后续的迭代建议，马上暑期就要忙起来了，我希望利用尽量少的时间帮助更多的牛友，和大家一起学习新的东西

[#AI求职实录#](https://www.zhihu.com/creation/subject/c03b054ea36744cca577e382ac696bb6)

  
  
作者：等闲_  
链接：[https://www.nowcoder.com/discuss/847995166416703488](https://www.nowcoder.com/discuss/847995166416703488)  
来源：牛客网
