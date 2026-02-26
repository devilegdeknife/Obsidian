---
创建时间: 2026-02-02
最后修改: 2026-02-15
状态:
  - Resource
tags: []
para: resource
aliases:
  - "有哪些轻量级适合阅读的优秀_C_开源项目_0370"
---
# 有哪些轻量级适合阅读的优秀 C++ 开源项目？
[内容链接](https://www.zhihu.com/question/40131963/answer/2264876073)

**Workflow：**搜狗公司的C++服务器引擎，支撑搜狗几乎所有后端C++在线服务，包括所有搜索服务、云输入法、在线广告等。

Github地址：[https://github.com/sogou/workflow](https://link.zhihu.com/?target=https%3A//github.com/sogou/workflow)

该项目适合阅读文档特别完整，直接上目录：

- Client基础
- - 创建第一个任务：wget
- 实现一次redis写入与读出：redis_cli
- 任务序列的更多功能：wget_to_redis
- Server基础
- - 第一个server：http_echo_server
- 异步server的示例：http_proxy
- 并行任务与工作流
- - 一个简单的并行抓取：parallel_wget
- 几个重要的话题
- - 关于错误处理
- 关于超时
- 关于全局配置
- 关于DNS
- 关于程序退出
- 计算任务
- - 使用内置算法工厂：sort_task
- 自定义计算任务：matrix_multiply
- 更加简单的使用计算任务：go_task
- 文件异步IO任务
- - 异步IO的http server：http_file_server
- 用户定义协议基础
- - 简单的用户自定义协议client/server
- 其它一些重要任务与组件
- - 关于定时器
- 关于计数器
- 条件任务与资源池
- 服务治理
- - 关于服务治理
- Upstream更多文档
- 连接上下文的使用
- - 关于连接上下文
- 内置客户端
- - 异步MySQL客户端：mysql_cli
- 异步kafka客户端：kafka_cli

**C++的项目练习，也可以参照一些书籍练习：**

[]()

**另外，针对C++的项目，这边在推荐一些不错的项目：**

## 1、C++ 实现太阳系行星系统

项目使用 C++实现 OpenGL GLUT 实现一个简单的太阳系行星系统，将涉及一些三维图形技术的数学基础、OpenGL 里的[三维坐标系](https://www.zhihu.com/search?q=%E4%B8%89%E7%BB%B4%E5%9D%90%E6%A0%87%E7%B3%BB&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)、OpenGL 里的光照模型、GLUT 的键盘事件处理。

**项目涉及的知识点：**

- C++ 语言基础
- 基本的 Makefile
- 基本的 OOP 编程思想
- OpenGL GLUT 的结构基本使用

![图片描述](https://picx.zhimg.com/v2-1a999ce605ac43235215ff556586d915_r.jpg?source=2c26e567)

## 2、C++实现运动目标的追踪

这个项目是在前面一个项目的后续项目，利用 OpenCV 来实现对视频中[动态物体](https://www.zhihu.com/search?q=%E5%8A%A8%E6%80%81%E7%89%A9%E4%BD%93&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)的追踪。

**项目涉及的知识点：**

- C++ 语言基础
- g++ 的使用
- 图像基础
- OpenCV 在图像及视频中的应用
- Meanshift 和 Camshift 算法

本次实验要实现的效果是追踪太阳系中运动的行星（图中选择了浅绿颜色轨道上的土星，可以看到追踪的目标被红色的椭圆圈住）：

![图片描述](https://picx.zhimg.com/v2-a262503be2e535d4c3e21d0ad3766219_r.jpg?source=2c26e567)

## 3、C++ 实现银行排队服务模拟

项目使用 C++对银行排队服务进行模拟，以事件驱动为核心思想，手动实现[模板链式队列](https://www.zhihu.com/search?q=%E6%A8%A1%E6%9D%BF%E9%93%BE%E5%BC%8F%E9%98%9F%E5%88%97&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)、随机数产生器等内容，进而学习概率编程等知识。作为可选进阶，这个模型同时还能稍加修改的应用到 CPU 资源争夺模型中。

**项目涉及知识点：**

- OOP 编程思想
- std::rand() 函数原理
- 概率编程
- 排队理论
- 链式队列数据结构及其模板实现
- 事件驱动的设计
- 蒙特卡洛方法
- CPU 资源争夺模型
- 时间片轮转调度

让我们的程序能够给出类似下面的结果：

![图片描述](https://pica.zhimg.com/v2-108e5c6979902639e75f014ef9248f24_r.jpg?source=2c26e567)

## 4、1小时入门增强现实技术

项目利用C+＋，基于OpenCV实现一个将3D模型显示在现实中的小例子，学习基于Marker的AR技术。

**项目涉及知识点：**

- C++ 语言基础语法
- AR 基本概念
- 基于 Marker 的 AR 技术
- OpenCV 程序开发

![图片描述](https://picx.zhimg.com/v2-5b1f36077ccc238814cf3537231270fe_r.jpg?source=2c26e567)

一个踩着魔鬼的步伐的漆黑的[食人魔](https://www.zhihu.com/search?q=%E9%A3%9F%E4%BA%BA%E9%AD%94&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)

## 5、100 行 C++ 代码实现线程池

为了追求性能，在服务器开发中我们经常要面临大量线程任务之间的调度和管理，该项目使用 C++ 及大量 C++11新特性设计并实现一个[线程池库](https://www.zhihu.com/search?q=%E7%BA%BF%E7%A8%8B%E6%B1%A0%E5%BA%93&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)。

**项目涉及知识点：**

- C++11 标准库特性
- C++11 语言特性
- - Lambda 表达式
- 尾置返回类型
- 线程池模型
- 测试驱动开发思想

编译代码并执行，一个可能的结果会向下面这样（显然，你的结果几乎不可能和这里的结果完全一样）：

![图片描述](https://picx.zhimg.com/v2-0c44da28c4b86fd3c510448aed70ce23_r.jpg?source=2c26e567)

## 6、C++ 开发 Web 服务框架

服务器开发中 Web 服务是一个基本的代码单元，将服务端的请求和响应部分的逻辑抽象出来形成框架，能够做到最高级别的框架级代码复用。项目将综合使用 C++11 及 Boost 中的 Asio 实现 HTTP 和 HTTPS 的服务器框架。

**项目涉及的知识点：**

- C++基本知识
- - 面向对象
- 模板
- 命名空间
- 常用 IO 库
- C++11 相关
- Boost Asio 相关

过程截图一：

![图片描述](https://pic1.zhimg.com/v2-72a29aa3c0a4f466379eb98df40455ac_r.jpg?source=2c26e567)

## 7、C++ 打造 Markdown 解析器

Markdown 几乎成为了程序员编写文档的标配，Markdown 的相关语法简单，解析 Markdown 文本能够加深日后编写编译器中词法分析的理解，本项目将使用 C++ 实现 Markdown 解析器，并将解析的内容生成为 HTML。

**项目涉及知识点：**

- 词法分析技术
- 语法树
- DFS 深度优先搜索
- C++11
- 使用指针进行字符流处理

![图片描述](https://picx.zhimg.com/v2-9a62f67f54d2b8e49916a591682d5f61_r.jpg?source=2c26e567)

## 8、C++ 实现高性能内存池

在 C/C++ 中，内存管理是一个非常棘手的问题，我们在编写一个程序的时候几乎不可避免的要遇到内存的分配逻辑，这时候随之而来的有这样一些问题：是否有足够的内存可供分配? 分配失败了怎么办? 如何管理自身的内存使用情况? 等等一系列问题。

该项目实现一个内存池，并使用一个栈结构来测试我们的内存池提供的分配性能。最终，我们要实现的内存池在栈结构中的性能，要远高于使用[std::allocator](https://www.zhihu.com/search?q=std%3A%3Aallocator&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)和 std::vector。

**项目涉及的知识点:**

- C++ 中的内存分配器 std::allocator
- 内存池技术
- 手动实现模板链式栈
- 链式栈和列表栈的性能比较

![图片描述](https://picx.zhimg.com/v2-2e80df6e3ced853be27dc3d8b76ec64e_r.jpg?source=2c26e567)

## 9、C++ 实现简易 Docker 容器

Docker 的本质是使用 LXC 实现类似虚拟机的功能，进而节省的硬件资源提供给用户更多的计算资源。本项目将 C++ 与 Linux 的 Namespace 及 Control Group 技术相结合，实现一个简易 Docker 容器。

**项目涉及知识点：**

- Linux 相关知识
- - Namespace
- Control Group
- Linux 系统调用
- C++
- - namespace
- lambda expression
- C/C++ 混合编译

最后我们将为容器实现下面这些功能：

- 独立的文件系统
- 网络访问的支持
- 容器资源的限制

![图片描述](https://picx.zhimg.com/v2-0f21e6b738a873a1cb2294a3e51c9d47_r.jpg?source=2c26e567)

## 10、C++ 实现内存泄露检查器

内存泄漏一直是 C++ 中比较令人头大的问题， 即便是很有经验的 C++程序员有时候也难免因为疏忽而写出导致内存泄漏的代码。除了基本的申请过的内存未释放外，还存在诸如异常分支导致的内存泄漏等等。本项目将使用 C++ 实现一个内存泄漏检查器。

**项目涉及的知识点：**

- new 操作符重载
- __FILE__、__LINE__ 预定义宏
- 头文件中的静态变量
- std::shared_ptr 智能指针

![图片描述](https://pic1.zhimg.com/v2-520650bc5001cdb2c7852c184e899711_r.jpg?source=2c26e567)

## 11、C++ 使用 Crypto++ 库实现常用的加密算法

该项目利用 Cryto++库 对[字符串](https://www.zhihu.com/search?q=%E5%AD%97%E7%AC%A6%E4%B8%B2&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)进行 AES 加密和解密，RSA 加密和解密，生成 MD5 值。其中主要用到了 Crypto++ 库，这是开源的C++数据加密算法库，支持如下算法：RSA、MD5、DES、AES、[SHA-256](https://www.zhihu.com/search?q=SHA-256&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)等等。

**该项目涉及知识点：**

- 安装 Crypto++ 库并检验
- 学习 MD5 摘要算法
- 学习 AES 加密算法

![图片描述](https://picx.zhimg.com/v2-a23fe25bfa89eff36fa0aaa8fd1a75a6_r.jpg?source=2c26e567)

## 12、C++ 实现高性能 RTTI 库

RTTI 是运行时类型信息的英文缩写，C++ 本身提供了运行时类型检查的运算符[dynamic_cast](https://www.zhihu.com/search?q=dynamic_cast&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A29361147%7D)和 typeid，然而dynamic_cast 的效率其实并不理想，需要牺牲一定性能。本项目将手动实现一个高性能 RTTI 库。

**项目涉及的知识点:**

- 运行时类型检查 dynamic_cast, typeid
- 显式类型转换 static_cast, const_cast, reinterpret_cast

![图片描述](https://picx.zhimg.com/v2-f6364542548639618c9e8cc1dcb69b16_r.jpg?source=2c26e567)

## 13、c++操作 redis 实现异步订阅和发布

该项目操作 redis 实现异步订阅和发布，其中将介绍 redis 基础知识，在linux中安装和使用 redis ，常用的 hiredis API，并实现一个例程。

**该项目涉及知识点：**

- 介绍 Redis 的基础知识
- 安装使用 Redis
- 安装 hiredis 库，并编写测试程序
- 发布订阅模式者模式介绍
- 编写发布者/订阅者相关模块
- 编写 makefile

![图片描述](https://pica.zhimg.com/v2-528efd69a055f77aa42e0d86d1d3d081_r.jpg?source=2c26e567)

![图片描述](https://pic1.zhimg.com/v2-1582563b605bb5aab5e8e7364670b833_r.jpg?source=2c26e567)

![图片描述](https://picx.zhimg.com/v2-feca63f16c70b68171cfb83a956b671d_r.jpg?source=2c26e567)

## 14、C++ 实现基数树 radix tree

对于长整型数据的映射，如何解决 Hash 冲突和 Hash 表大小的设计是一个很头疼的问题。radix 树就是针对这种稀疏的长整型数据查找，能快速且节省空间地完成映射。该项目就带你用C++实现基数树 radix tree。

**项目涉及知识点：**

- 泛型
- 析构
- 运算符重载
- 双向链表
- 数据结构

![图片描述](https://picx.zhimg.com/v2-f752f705ffab82d4a8af640f3ae4bc5e_r.jpg?source=2c26e567)

## 15、C++基于OpenCV实现实时监控和运动检测记录

该项目使用C++和OpenCV提供的库函数，实现摄像头的实时监控功能，并通过监控画面的运动检测选择是否记录视频。监控人员可选择输出图像的模式以更容易的分辨监控中的异常情况。

**项目涉及知识点：**

- 对摄像头数据的捕获
- 对捕获到的监控帧作背景处理
- 对监控视频做运动检测并记录视频

以下几张分别是程序在不同显示模式下的显示情况，你可以通过切换-mog1，-mog2和-src来自己观察对应的效果。

![图片描述](https://pica.zhimg.com/50/v2-fb57ef9e9169d1cdb4fb0035b44cd857_720w.jpg?source=2c26e567)

![图片描述](https://picx.zhimg.com/50/v2-bce98fd35635785e939b76ad97c2b3f9_720w.jpg?source=2c26e567)

![图片描述](https://picx.zhimg.com/50/v2-b7e6d0bf6b77c281c5fe4d1ee99fea4d_720w.jpg?source=2c26e567)

![图片描述](https://pic1.zhimg.com/50/v2-da942e674a9409018a8b9dc37dfaa46e_720w.jpg?source=2c26e567)

![图片描述](https://picx.zhimg.com/50/v2-a032dd757177cba04007af74ea2807fe_720w.jpg?source=2c26e567)
