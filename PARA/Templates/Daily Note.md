---
type: daily
created: <% tp.file.creation_date("YYYY-MM-DD") %>
tags: [daily]
---

# <% moment(tp.file.title,'YYYY-MM-DD').format("YYYY 年 MM 月 DD 日 dddd") %>

<< [<% moment(tp.file.title,'YYYY-MM-DD').subtract(1,'day').format('YYYY-MM-DD') %>|昨天](# "Reference <% moment(tp.file.title,'YYYY-MM-DD').subtract(1,'day').format('YYYY-MM-DD') %>\|昨天 \|\|\| __GENERATING_DETAILS__") | [<% moment(tp.file.title,'YYYY-MM-DD').add(1,'day').format('YYYY-MM-DD') %>|明天](# "Reference <% moment(tp.file.title,'YYYY-MM-DD').add(1,'day').format('YYYY-MM-DD') %>\|明天 \|\|\| __GENERATING_DETAILS__") >>

## 今日三大任务
- [ ] 1.
- [ ] 2.
- [ ] 3.

## 捕获区（Ephemeral Notes）
- 

<% tp.file.cursor() %>

## 今日日志
- 时间线记录 / Journal

## 今日创建的笔记
```dataview
LIST FROM "" 
WHERE file.cday = date("<% tp.file.creation_date("YYYY-MM-DD") %>")
SORT file.name ASC