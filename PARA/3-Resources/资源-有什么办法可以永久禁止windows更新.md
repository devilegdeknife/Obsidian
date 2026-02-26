---
title: 有什么办法可以永久禁止windows更新？
url: https://www.zhihu.com/question/9399357631/answer/2008510691896758958
author: 元子鹅
author_badge: 
created: 2026-02-21 11:57
modified: 2026-02-21 11:57
upvote_num: 49
comment_num: 4
---
简单，把更新服务器地址改成127.0.0.1就行了，不会影响微软商店




新建一个文本文档，把下列内容粘贴进去保存，扩展名改为reg，双击打开然后重启电脑即可

```text
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate]
"WUServer"="http://127.0.0.1"
"WUStatusServer"="http://127.0.0.1"

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU]
"UseWUServer"=dword:00000001
```




如果是专业版/教育版/企业版/工作站版的系统，也可以打开开始菜单，搜索“编辑组策略”，打开它，导航到“计算机配置\管理模板\Windows 组件\Windows 更新\管理从 Windows Server Update Service 提供的更新”，双击点开“指定 Intranet Microsoft 更新服务位置”。点击“已启用”，把下面的空全部填上 127.0.0.1 ，确定即可。使用组策略更改的话无需重启即可生效