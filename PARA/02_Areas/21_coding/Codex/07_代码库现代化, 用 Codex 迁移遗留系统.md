---
aliases:
  - 使用 Codex 实现代码库现代化
tags:
  - coding
  - codex
  - modernization
  - planning
para: area
created: 2026-02-03
updated: 2026-02-11
---
# 代码库现代化: 用 Codex 迁移遗留系统

> [!summary] 适合谁
> 你需要重构或迁移一个遗留系统 (例如 COBOL, 大型单体应用, 老旧脚本编排)，但希望把工作拆成可验证的阶段，并且让新同事可以看懂, 审计, 复用。

> [!tip] 先读这个概念
> ExecPlan 是这篇文章的核心工具，建议先看: [[06_ExecPlan, 用 PLANS.md 拆解多小时任务]]。

## 介绍
Codex 经过专门训练，能够读取和分析大型复杂代码库，与工程师协同规划工作，并生成高质量的代码变更。代码现代化已迅速成为其最常见且最有价值的用途之一。在这种模式下，工程师可以专注于架构和业务规则，而 Codex 则负责繁重的工作：转换遗留模式、提出安全的重构方案，并在系统演进过程中保持文档和测试的同步。
本指南展示了如何使用 **OpenAI 的 Codex CLI** 来现代化改造旧版代码库，具体方式如下：
* 易于新工程师理解
* 可供建筑师和风险团队审计
* 可在其他系统中重复使用
我们将以基于 COBOL 的[投资组合系统](https://github.com/sentientsergio/COBOL-Legacy-Benchmark-Suite/)作为运行示例，并选择一个试点流程进行重点分析。您可以替换为任何包含遗留程序、编排（作业、调度程序、脚本）或共享数据源的遗留技术栈（例如 Java 单体应用、PL/SQL）。
---
## 高级概述
我们将其分解为 5 个不同的阶段，这些阶段都围绕着执行计划（简称 ExecPlan）展开，执行计划是一份设计文档，代理人可以按照该文档来实施系统变更。
![代码现代化阶段](https://developers.openai.com/cookbook/assets/images/code-modernization-phases.png)
我们将为选定的试点流程创建 4 种类型的文档：
* **pilot_execplan.md** - 执行计划，用于协调试点项目，回答以下问题：试点范围是什么，为什么重要，我们将采取哪些步骤，以及我们如何知道试点已经完成。
* **pilot_overview.md** - 涉及哪些遗留程序（在我们的示例中为 COBOL）、编排作业（此处为 JCL）和数据源，数据如何在它们之间流动，以及业务流程实际执行什么操作。
* **pilot_design.md** - 系统的目标形状：拥有此流程的服务/模块、新的数据模型以及公共 API 或批处理入口点。
* **pilot_validation.md** - 定义了我们将如何证明对等性：关键场景、共享输入数据集、如何并排运行传统系统与现代系统，以及“匹配输出”在实践中的含义。
这 4 个文件有助于说明正在更改的代码、新系统应该是什么样子，以及如何检查行为是否出现倒退。
---
## 第0阶段 - 设置代理人和计划
**目标**：为 Codex 提供一个轻量级的契约，说明如何在这个仓库中进行规划，而不会让流程过于复杂。
我们从 [使用 PLANS.md 解决多小时问题](https://cookbook.openai.com/articles/codex_exec_plans) cookbook 中汲取灵感，创建 AGENTS.md 和 PLANS.md 文件，并将它们放在 .agent 文件夹中。
* AGENTS.md：如果您尚未为您的存储库创建 AGENTS.md 文件，我建议使用 /init 命令。生成后，请在 AGENTS.md 中添加一个部分，指示代理引用 PLANS.md 文件。
* PLANS.md：以操作手册中提供的示例为起点
这些内容解释了什么是执行计划、何时创建或更新执行计划、执行计划存放在哪里以及每个执行计划必须包含哪些部分。
### Codex CLI 的作用
如果您希望 Codex 针对您的特定仓库优化代理或计划，您可以运行以下命令：
```md
请仔细阅读目录结构，并完善 .agent/AGENTS.md 和 .agent/PLANS.md 文件，使其成为我们在此规划 COBOL 现代化工作的一个清晰、明确的标准。保留 ExecPlan 框架，但添加一到两个具体示例。
```
---
## 第一阶段 - 选择试点项目并制定首个执行计划
**目标**：确定一个现实但有界限的试点流程，并将第一阶段的计划记录在一个单独的 ExecPlan 文件中。
**关键文件**：pilot_execplan.md
### 1.1 选择先导流量
如果您还没有合适的流程进行试点，可以请 Codex 提出建议。以下是仓库根目录下的示例提示：
```md
浏览此存储库，并提出一到两个切实可行但有限制的现代化试点流程候选方案。
列出每位候选人的以下信息：
涉及的 COBOL 程序和副本
- JCL成员参与
- 用通俗易懂的语言描述业务场景
最后明确建议我们应该采用哪种流程作为第一个试点流程。
```
在这种情况下，我们将选择报告流程作为试点。
![飞行员候选人流程](https://developers.openai.com/cookbook/assets/images/pilot-candidate.png)
### 1.2 请教法典委员会制定试点执行计划
```md
根据 .agent/PLANS.md 创建 pilot_execplan.md 文件。将其范围限定于每日报告流程。该计划应涵盖此流程的四个结果：
- 库存清单和图表
- 现代化技术报告内容
- 目标设计和规格
- 奇偶校验测试计划
使用 ExecPlan 框架，并用对实际 COBOL 和 JCL 文件的具体引用来填充它。
```
该方案现在将成为您所有试点工作的“大本营”。
---
## 第二阶段 - 清点和发现
**目标**：全面记录试点流程的当前实际运行情况：包括程序、作业、数据流和业务规则。工程师无需阅读每一行遗留代码即可理解变更。
**关键文件**：pilot_reporting_overview.md
**工程师可以关注的重点：**
* 确认哪些作业确实在生产环境中运行
* 填补 Codex 无法从代码中推断出的空白（服务级别协议、运行环境、所有者）
* 健全性检验图表和说明
### 2.1 请教法典起草概述
```md
创建或更新 pilot_reporting_overview.md，其中包含两个顶级部分：“试点项目清单”和“试点项目现代化技术报告”。
使用 pilot_execplan.md 来确定试点流程。
库存清单部分应包含：
1. 所涉及的 COBOL 程序和副本，如适用，请按批处理、联机和实用程序进行分组。
2. 调用这些程序的 JCL 作业和步骤
3. 他们读取和写入的数据集或表格
4. 一个简单的文字图表，展示作业顺序和数据流。
在现代化技术报告部分，描述：
5. 用通俗易懂的语言描述此流程的业务场景
6. 流程中每个 COBOL 程序的详细行为
7. 关键文件和表的数据模型，包括字段名称和含义
8. 已知的技术风险，例如日期处理、舍入、特殊错误代码或棘手的条件
```
本文档将有助于工程师在不阅读所有代码的情况下了解飞行员的形状和行为。
pilot_reporting_overview.md 中的流程图示例
![Pilot Flow Diagram](https://developers.openai.com/cookbook/assets/images/pilot-flow-diagram.png)
### 2.2 更新执行计划
一旦有了总体规划，就要求教法典委员会确保计划保持一致。
```md
更新 pilot_execplan.md 文件，使其反映新的 pilot_reporting_overview.md 文件。
- 进行中，将库存和 MTR 部分标记为草稿完成。
- 将任何值得注意的发现添加到“惊喜与发现”和“决策日志”中。
- 保持 ExecPlan 对仓库新手来说易于阅读。
```
在第二阶段结束时，您将获得一份试点概述文档，该文档既是系统清单报告，又是现代化技术报告。
---
## 第三阶段 - 设计、规范和验证计划
**目标**
* 确定现代版试点流程图应是什么样子
* 描述目标服务和数据模型
* 定义如何通过测试和并行运行来证明奇偶性。
到本阶段结束时，我们将决定我们要构建什么以及如何证明它有效。
**关键资料**
* pilot_reporting_design.md
* pilot_reporting_validation.md
* modern/openapi/pilot.yaml
* modern/tests/pilot_parity_test.py
### 3.1 目标设计文件
```md
根据 pilot_reporting_overview.md 文件，起草 pilot_reporting_design.md 文件，包含以下章节：
# 目标服务设计
- 在现代架构中，哪个服务或模块将负责此试点流程？
- 它将以批处理作业、REST API、事件监听器还是它们的组合形式实现。
- 它如何融入更广泛的领域模型。
# 目标数据模型
- 建议替换当前文件或 DB2 表的数据库表和列。
- 键、关系和任何派生字段。
- 关于如何表示传统编码（例如压缩十进制数或 EBCDIC 字段）的说明。
# API设计概述
- 用户或系统将调用的主要操作。
- 对每个端点或事件进行简要描述。
- 指向 modern/openapi/pilot.yaml 的指针，完整的 schema 将位于其中。
```
### 3.2 API 规范
我们将试点流程的外部行为记录在一个 OpenAPI 文件中，以便现代系统拥有清晰且与编程语言无关的接口。该规范成为实现、测试生成和未来集成的基础，并为 Codex 提供了具体的框架，用于构建代码和测试。
```md
使用 pilot_reporting_design.md，在 modern/openapi/pilot.yaml 处创建一个 OpenAPI 文件，用于描述此试点项目的外部 API。文件内容应包括：
- 主要端点或管理钩子的路径和操作
- 每个操作的请求和响应模式
- 字段类型和约束，与目标数据模型保持一致
```
示例输出：
![Pilot Yaml](https://developers.openai.com/cookbook/assets/images/pilot-yaml.png)
### 3.3 验证和测试计划
```md
创建或更新 pilot_reporting_validation.md 文件，使其包含三个部分：
# 测试计划
- 关键场景，包括至少一条正常路径和几个极端情况。
- 针对每种场景需要捕获的输入和输出。
# 平价与比较策略
- 你将如何在相同的输入数据上运行传统的 COBOL 流程和现代实现？
- 将比较哪些输出（文件、表格、日志）。
- 如何检测和区分差异。
# 测试支架
- 关于测试文件 modern/tests/pilot_parity_test.py 的说明，包括如何运行它。
- 现代实施方案完成后，需要填写哪些内容？
```
然后请 Codex 提供测试框架：
```md
使用 pilot_reporting_validation.md，在 modern/tests/pilot_parity_test.py 创建一个初始测试文件。
在测试计划中加入占位符断言和注释，引用测试计划中的场景，但不要假设现代实现已经存在。
```
### 3.4 更新执行计划
```md
更新 pilot_execplan.md 文件，使工作计划、具体步骤以及验证和验收部分明确引用以下内容：
1. pilot_reporting_overview.md
2. pilot_reporting_design.md
3. pilot_reporting_validation.md
4. modern/openapi/pilot.yaml
5. modern/tests/pilot_parity_test.py
```
在第三阶段结束时，您将拥有一个清晰的设计、一个机器可读的规范以及一个测试计划/框架，其中描述了您将如何证明对等性。
---
## 第四阶段 - 实施与比较
**目标：**实施现代试点，与 COBOL 版本并行运行，并证明输出与计划场景相符。
**关键资料**
* 代码位于 modern/<stack>/pilot 目录下（例如 modern/java/pilot）。
* 已完成 modern/tests/pilot_parity_test.py 中的测试
* 更新了 pilot_reporting_validation.md 文件中描述实际并行运行步骤的章节
### 4.1 生成现代代码的初稿
```md
使用 pilot_reporting_design.md 和 pilot_reporting_overview.md 中列出的 COBOL 程序，在 modern/<stack>/pilot 下生成初始实现代码，该代码如下：
- 为关键记录和表定义领域模型和数据库实体。
- 在服务类中实现核心业务逻辑，保留 COBOL 段落的行为。
- 添加引用原始 COBOL 段落和副本的注释。
- 请将此作为初稿供工程师审阅。
```
您可以多次运行此程序，每次专注于不同的模块。
### 4.2 连接奇偶校验测试
```md
扩展 modern/tests/pilot_parity_test.py，使其：
- 使用我们为 COBOL 提供的任何包装器或命令（例如在测试框架中运行 JCL 的脚本）来调用传统的试点流程。
- 通过其 API 或批处理入口点调用新实现。
- 根据 pilot_reporting_validation.md 中的“对等性和比较策略”比较输出结果。
```
### 4.3 记录并行运行步骤
与其单独创建一个 parallel_run_pilot.md 文件，不如重用现有的验证文档：
```md
更新 pilot_reporting_validation.md 文件中的“一致性与比较策略”部分，使其包含清晰有序的命令列表：
- 准备或加载输入数据集
- 对该数据运行 COBOL 试点流程
- 在相同数据上运行现代试点流程
- 对比输出结果并解读结果
- 明确输出路径，并简要描述成功标准。
```
### 4.4（如有需要）使用 Codex 进行迭代修复
当测试失败或行为异常时，使用短循环进行处理：
```md
以下是 modern/tests/pilot_parity_test.py 中的一个失败测试，​​以及相关的 COBOL 代码和现代代码。请解释输出结果为何不同，并提出对现代实现进行最小改动以使其与 COBOL 行为保持一致的方法。请展示更新后的代码以及任何测试调整。
```
每次完成一项有意义的工作后，请让 Codex 更新执行计划：
```md
更新 pilot_execplan.md，使进度、决策日志和结果反映试点项目的最新代码、测试和验证结果。
```
您会看到 ExecPlan 的“进度”和“成果”部分将更新，内容大致如下：
```md
进步  
- [x] 已编制清单和图表（`pilot_reporting_overview.md` 以及 `system-architecture.md` 中的支持性说明）。  
- [x] 已起草现代化技术报告（`pilot_reporting_overview.md` MTR 部分）。  
- [x] 目标设计规范草案（`pilot_reporting_design.md` 和 `modern/openapi/pilot.yaml`）。  
- [x] 已记录奇偶性测试计划和脚手架（`pilot_reporting_validation.md` 和 `modern/tests/pilot_parity_test.py`）。
结果  
- `pilot_reporting_overview.md`、`pilot_reporting_design.md` 和 `pilot_reporting_validation.md` 现在提供端到端的叙述（清单、设计、验证）。  
- `modern/openapi/pilot.yaml` 描述了 API 接口，而 `modern/python/pilot/{models,repositories,services}.py` 包含了草案实现。  
- `modern/tests/pilot_parity_test.py` 使用占位符和辅助函数来测试奇偶校验流程，这些占位符和辅助函数与验证策略保持一致。  
- 剩余的工作仅限于更新操作测试附录以及将服务连接到实际运行时。
```
---
## 第五阶段 - 将试点项目转化为可扩展的运动
**目标：** 在本仓库中提供其他流程的可重用模板和 Codex 使用简短指南。
**关键资料**
* template_modernization_execplan.md
* how_to_use_codex_for_cobol_modernization.md
### 6.1 模板执行计划
```md
请查看我们创建的试点文件：
1. pilot_reporting_overview.md
2. pilot_reporting_design.md
3. pilot_reporting_validation.md
4. pilot_execplan.md
创建 template_modernization_execplan.md 文件，供团队在现代化其他流程时复制使用。该文件应包含以下内容：
5. 请按照 .agent/PLANS.md 中的说明操作
6. 添加“概述”、“清单”、“现代化技术报告”、“目标设计”和“验证计划”的占位符。
7. 假设类似的模式：概述文档、设计文档、验证文档、OpenAPI 规范和测试。
```
### 6.2 操作指南
```md
使用相同的试点文件，编写 how_to_use_codex_for_cobol_modernization.md 文件，内容如下：
1. 从宏观层面解释各个阶段（选择试点、盘点和发现、设计和规范、实施和验证、工厂模式）。
2. 针对每个阶段，列出编码代理提供帮助的地方，并指向相关文件和示例提示。
```
---
## 总结
如果您按照本指南中的步骤进行任何试点项目，最终得到的文件夹结构应该大致如下：ExecPlan、三个试点文档、一个 OpenAPI 规范、一个试点模块和一个奇偶性测试。您还可以将 Markdown 文件进一步组织到其他试点和模板子文件夹中，以获得更清晰的结构。
![Pilot 文件夹结构](https://developers.openai.com/cookbook/assets/images/pilot-folder-structure.png)
你会注意到，由于模块（models.py、repositories.py、services.py）只是初步的构建模块，modern/python/pilot 目前还没有可运行的入口点。如果你想在本地进行实验，有两种选择：
* 使用交互式 shell 或小型脚本
* 创建你自己的运行器（例如 modern/python/pilot/main.py），将存储库和服务连接起来。
虽然本指南以 COBOL 试点流程为例，但同样的模式也适用于各种不同的重构类型。例如，一位客户使用 Codex 迁移了一个大型单体仓库，方法是向 Codex 导入数百个 Jira 问题单，让 Codex 标记高风险工作、识别横切依赖关系并生成代码变更草稿，最后由另一个验证人员进行审查和合并。
COBOL 代码库现代化只是一个常见的例子，但同样的方法也适用于任何遗留技术栈或大规模迁移：将“代码库现代化”分解为一系列小的、可测试的步骤（一份执行计划、一些文档和一个优先考虑对等性的实现）。Codex 会处理理解旧模式、生成候选迁移方案和提高对等性等繁琐的工作，而您和您的团队则可以专注于架构和权衡取舍，从而使现代化过程更快、更安全，并且可重复应用于您决定迁移的每个系统。
