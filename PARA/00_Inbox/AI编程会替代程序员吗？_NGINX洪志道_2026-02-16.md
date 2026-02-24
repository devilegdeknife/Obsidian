---
title: AI编程会替代程序员吗？
url: https://www.zhihu.com/question/1960623371101398549/answer/2006691834576016592
author: NGINX洪志道
author_badge: NGINX核心开发者|在AI编程实践中专注架构设计
created: 2026-02-16 11:30
modified: 2026-02-16 11:30
upvote_num: 255
comment_num: 69
---
我在 nginx 团队工作，最近碰到一个真实的例子，正好可以看看 AI 和人处理同一个问题的区别。

用户提了一个 issue（[#1101](https://github.com/nginx/nginx/issues/1101)）：HTTP/2 upstream、proxy_cache、keepalive 三个功能同时开启时，缓存命中的请求会报 “upstream sent frame for unknown stream”。报错信息指向上游，但这个请求压根没到上游——响应是从本地缓存拿的。

三个子系统各自的逻辑都没错，问题出在交叉路径上。正常流程里，新连接建立时 `ctx->id` 被设为 1，表示第一个 stream。但这个赋值放在了一条共享路径上，复用连接也会走到这里。缓存命中时没有真实的 upstream 请求，`ctx->id` 却已经有了值，后续新请求复用这条连接，stream ID 已经递增，校验就对不上了。

来看看 AI 和我们的修复方式：

## AI 的修复

AI 给了几种方案。一种是在校验处直接跳过 cached：

```text
if (!r->cached && ctx->stream_id && ctx->stream_id != ctx->id) {
    ...
}
```

另一种是到各个可能出问题的地方加同步，哪里用到 `ctx->id` 就在哪里补一个 `r->cached` 的判断，让两个值对上。

核心思路都一样：cached 的时候报错了，那就在 cached 的时候绕过去。能 work，但它不关心这个补丁对系统的长期影响。

## 我的修复

```text
if (r->cached) {
    ctx->id = ctx->stream_id;
}

if (ctx->stream_id && ctx->stream_id != ctx->id) {
    ...
}
```

我的想法是尽量让逻辑简洁，拿到什么用什么。`ctx->id` 和 `ctx->stream_id` 对不上，那就在校验前把它们同步一下，两行解决。功能上没问题，测试也过了。但和 AI 一样，还是在校验处做文章，引入了 `r->cached` 这个上层概念。cache 是 HTTP 层的事，stream ID 校验是 HTTP/2 协议层的逻辑，两者本来不该有交集。

## arut 的建议

这个模块是我写的，我同事 Arut 对 HTTP/2 和 HTTP/3 都非常熟悉。他看了之后给了一个完全不同的方向：问题不在校验逻辑，而在 `ctx->id` 的初始化。改动涉及三个位置：

```text
/* 校验处：加 ctx->id 前置条件，id 为 0 时不校验 */
if (ctx->id && ctx->stream_id && ctx->stream_id != ctx->id) {
    ...
}

/* 复用连接路径 */
ctx->connection->last_stream_id = 0;
ctx->id = 0;
goto done;

/* 新连接路径 */
ctx->id = 1;
ctx->connection->last_stream_id = 1;
```

原来的代码在共享路径上写死了 `ctx->id = 1`，隐含的假设是所有连接都会发 stream。Arut 把这个特殊值去掉，按连接类型分别初始化：新连接 `id = 1`，复用连接 `id = 0`。校验处看到 `id == 0` 就知道还没发过请求，自然跳过。不需要知道上层是 cache 还是别的原因，任何复用场景都自动覆盖。

## review 后的定稿

我按 arut 的方向改完提交后，他又 review 了一轮，精简掉了一个不需要的改动：

```text
/* 复用连接路径 */
ctx->id = 0;
goto done;

/* 新连接路径 */
ctx->id = 1;
```

上一版把 `last_stream_id` 也按连接类型拆开了，review 时发现没必要——`last_stream_id` 是连接级别的状态，新连接和复用连接都应该从 1 开始。只有 `ctx->id` 需要区分，因为它表示的是当前请求有没有发出 stream。

代码提交：[f8e1bc5](https://github.com/nginx/nginx/commit/f8e1bc5b9821eba7995905fe46c8ca383b5ea782)

## 四个版本说明了什么

四个版本的代码量都差不多，都是几行的事。差距不在写代码的能力上，而在看问题的角度上。不看代码也能理解这四步的区别：AI 的做法是”这里出了事，加个特殊处理”；我的做法是”这里出了事，用最简洁的方式处理掉”；arut 的做法是”这里会出事，是因为原来的设计做了一个不该做的假设，把假设去掉，问题自然消失”；最后 review 时又多问了一步：”改动里有没有哪些其实不需要改的。”

说到底，人和 AI 对代码的审美不一样。AI 在意的是”能不能解决问题”，人在意的还有”这个改动读起来是不是自然，下一个人看到会不会困惑”。Arut 的修法不只是功能上更通用，它在概念上也更干净——`id == 0` 就是没发过请求，不需要任何额外解释。人会本能地追求这种东西：简洁、清晰、减少心智负担。这种审美不是装的，是被无数次维护别人代码的痛苦训练出来的。

AI 在 make it work 这件事上已经很强了，这一点值得认真对待。它出方案的速度比人快得多，给它足够的上下文它甚至能覆盖很多边界情况。Kent Beck 说过：Make it work, make it right, make it fast。这四个版本正好走了前两步。AI 能快速做到 make it work，但 make it right——理解系统的假设、去掉不该有的特殊值、让改动在概念上自洽——目前还是要靠人来完成。

所以”替代”这个词得拆开看。把想法翻译成代码这一层，AI 已经做得很好了，而且还在快速进步。但搞清楚该写什么、该改哪里、为什么这么改，这一层需要对系统整体的理解，不是看几个文件就能得出结论的。大部分关于”替代”的讨论，把这两层混在一起了。

最近刚好在实践 AI 编程，写了两个系列记录过程：
[一个 nginx 工程师接手 AI 写的软件](https://www.zhihu.com/column/c_2003830990213239603)
[我带 AI 写了个项目](https://www.zhihu.com/column/c_2006330352843657698)