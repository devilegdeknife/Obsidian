$ErrorActionPreference = "Stop"

$outDir = "01_Project/00_Inbox_Processing"
$sourceDir = "00_Inbox"
$summaryPath = Join-Path $outDir "summary_report.md"
$tagIndexPath = Join-Path $outDir "tag_index.md"
$logPath = Join-Path $outDir "processing_log.md"
$headingIndexPath = Join-Path $outDir "rg_heading_index.txt"
$metadataIndexPath = Join-Path $outDir "rg_metadata_index.txt"

$allFilesRaw = & rg --files $sourceDir -g "*.md"
$allFiles = @($allFilesRaw | ForEach-Object { ($_ -replace "/", "\\").Trim() } | Sort-Object)

$processFiles = New-Object System.Collections.Generic.List[string]
$excludedFiles = New-Object System.Collections.Generic.List[string]
foreach ($f in $allFiles) {
  $name = [System.IO.Path]::GetFileName($f)
  if ($name -ieq "INDEX.md" -or $name -ieq "文档格式.md") {
    [void]$excludedFiles.Add($f)
  } else {
    [void]$processFiles.Add($f)
  }
}

function Remove-Frontmatter {
  param([string]$text)
  if ([string]::IsNullOrWhiteSpace($text)) { return "" }
  if ($text -match "(?s)^---\r?\n.*?\r?\n---\r?\n?") {
    return ($text -replace "(?s)^---\r?\n.*?\r?\n---\r?\n?", "")
  }
  return $text
}

function Get-FrontmatterValue {
  param(
    [string]$text,
    [string]$key
  )
  $m = [regex]::Match($text, "(?m)^" + [regex]::Escape($key) + ":\s*(.*)$")
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return ""
}

function Clean-Line {
  param([string]$line)
  if ($null -eq $line) { return "" }
  $s = $line.Trim()
  $s = $s -replace "^#{1,6}\s*", ""
  $s = $s -replace "^[-*+]\s*", ""
  $s = $s -replace "^>\s*", ""
  $s = $s -replace "`"", ""
  return $s.Trim()
}

function Get-Title {
  param(
    [string]$body,
    [string]$filePath
  )
  $lines = $body -split "`r?`n"
  foreach ($line in $lines) {
    if ($line -match "^#\s+(.+)$") {
      return (Clean-Line $line)
    }
  }
  return [System.IO.Path]::GetFileNameWithoutExtension($filePath)
}

function Contains-Any {
  param(
    [string]$text,
    [string[]]$keywords
  )
  foreach ($k in $keywords) {
    if ($text -match [regex]::Escape($k)) { return $true }
  }
  return $false
}

function Get-PrimaryTags {
  param(
    [string]$text,
    [string]$title
  )
  $hay = ($title + "\n" + $text)
  $score = @{
    "社会文化" = 0
    "科技AI" = 0
    "编程工程" = 0
    "经济金融" = 0
    "历史政治" = 0
    "个人成长" = 0
    "健康生活" = 0
    "杂项素材" = 0
  }

  $map = @{
    "社会文化" = @("社会", "文化", "女性", "男性", "日本", "知乎", "舆论", "男娘", "女拳", "恋爱", "中学生", "大学")
    "科技AI" = @("AI", "人工智能", "大模型", "Gemini", "ChatGPT", "Claude", "Transformer", "提示词")
    "编程工程" = @("编程", "代码", "程序员", "Linux", "Docker", "RTSP", "onvif", "NAS", "bug", "框架", "项目", "服务器", "Python", "Rust")
    "经济金融" = @("A股", "金融", "投资", "定投", "量化", "市场", "债务", "危机", "万科", "携程", "利润", "铜", "理财")
    "历史政治" = @("冷战", "苏联", "美国", "法国", "王朝", "晚清", "纪委", "反垄断", "政府", "制度", "历史")
    "个人成长" = @("学习", "指南", "路线图", "实践", "建议", "忠告", "自律", "成长", "职场", "经验", "独居")
    "健康生活" = @("癌症", "体检", "塑料颗粒", "保养", "健康", "抑郁", "可乐", "烟", "医学")
  }

  foreach ($k in $map.Keys) {
    foreach ($kw in $map[$k]) {
      if ($hay -match [regex]::Escape($kw)) { $score[$k] += 1 }
    }
  }

  $sorted = $score.GetEnumerator() | Sort-Object -Property Value -Descending
  $top = @($sorted | Where-Object { $_.Value -gt 0 } | Select-Object -First 2)

  if ($top.Count -eq 0) {
    return @("杂项素材")
  }

  if ($top.Count -eq 1) {
    return @($top[0].Key)
  }

  if ($top[0].Value -ge ($top[1].Value * 2)) {
    return @($top[0].Key)
  }

  return @($top[0].Key, $top[1].Key)
}

function Get-SecondaryTags {
  param(
    [string]$text,
    [string]$title,
    [string[]]$primaryTags
  )

  $hay = ($title + "\n" + $text)
  $tags = New-Object System.Collections.Generic.List[string]

  function Add-Tag {
    param([string]$t)
    if (-not $tags.Contains($t)) { [void]$tags.Add($t) }
  }

  if ($hay -match "知乎|提问|回答|评论") { Add-Tag "知乎讨论" }
  if ($hay -match "爆料|风波|争议|怎么看|评价|事件") { Add-Tag "舆情事件" }
  if ($hay -match "日本|东京|牛郎|男娘|二次元|柯南") { Add-Tag "日本社会" }
  if ($hay -match "女性|男性|女拳|恋爱|性别|夫妻|男娘") { Add-Tag "性别议题" }
  if ($hay -match "美国|中国|冷战|俄罗斯|苏联|国际|法国") { Add-Tag "国际关系" }
  if ($hay -match "社会|阶层|群体|文化|结构|原子化") { Add-Tag "社会结构" }
  if ($hay -match "AI|Gemini|ChatGPT|Claude|模型|大模型|提示词") { Add-Tag "AI工具链" }
  if ($hay -match "学习|指南|路线图|自学|教程") { Add-Tag "学习路线" }
  if ($hay -match "架构|系统|框架|设计|协议|Transformer") { Add-Tag "系统设计" }
  if ($hay -match "编程|代码|工程|项目|bug|CI|测试|开发") { Add-Tag "软件工程" }
  if ($hay -match "外挂|安全|密码|漏洞|攻击|DMA|RTSP|onvif") { Add-Tag "网络安全" }
  if ($hay -match "投资|定投|策略|资产|理财") { Add-Tag "投资策略" }
  if ($hay -match "A股|股市|上证|深证|行情|股票") { Add-Tag "A股" }
  if ($hay -match "量化|回测|因子|交易策略") { Add-Tag "量化交易" }
  if ($hay -match "宏观|经济|通胀|债务|危机|制造业") { Add-Tag "宏观经济" }
  if ($hay -match "行业|产业|公司|利润率|平台|供需|铜") { Add-Tag "产业分析" }
  if ($hay -match "复盘|王朝|晚清|历史|变迁|希腊") { Add-Tag "历史复盘" }
  if ($hay -match "纪委|制度|政府|反垄断|政策") { Add-Tag "政治制度" }
  if ($hay -match "方法论|本质|理论|机制|框架") { Add-Tag "方法论" }
  if ($hay -match "职场|程序员|网络工程师|职业") { Add-Tag "职业发展" }
  if ($hay -match "自律|成长|建议|习惯|独居") { Add-Tag "自我管理" }
  if ($hay -match "癌症|体检|保养|塑料颗粒|健康|抑郁") { Add-Tag "健康认知" }
  if ($hay -match "医学|临床|病理|诊断") { Add-Tag "医学科普" }
  if ($hay -match "摘录|对话|X帖子|未命名") { Add-Tag "素材摘录" }

  $fallbackMap = @{
    "社会文化" = @("社会结构", "知乎讨论", "方法论")
    "科技AI" = @("AI工具链", "学习路线", "系统设计")
    "编程工程" = @("软件工程", "系统设计", "网络安全")
    "经济金融" = @("投资策略", "宏观经济", "产业分析")
    "历史政治" = @("历史复盘", "政治制度", "国际关系")
    "个人成长" = @("自我管理", "职业发展", "方法论")
    "健康生活" = @("健康认知", "医学科普", "自我管理")
    "杂项素材" = @("素材摘录", "方法论", "知乎讨论")
  }

  if ($tags.Count -lt 3) {
    foreach ($p in $primaryTags) {
      if ($fallbackMap.ContainsKey($p)) {
        foreach ($f in $fallbackMap[$p]) {
          Add-Tag $f
          if ($tags.Count -ge 3) { break }
        }
      }
      if ($tags.Count -ge 3) { break }
    }
  }

  if ($tags.Count -gt 8) {
    return @($tags | Select-Object -First 8)
  }

  return @($tags)
}

function Get-ShortSummary {
  param(
    [string]$title,
    [string]$body
  )
  $topic = $title.Trim()
  if ($topic -match "摘录|未命名|对话") {
    return "该笔记以素材摘录为主，围绕[$topic]保留原始观点与上下文，便于后续二次加工。"
  }
  if ($topic -match "为什么|如何|怎么看|评价|会不会|能不能|是什么") {
    return "该文围绕[$topic]提出问题并组织观点，重点关注争议点、论据与可验证结论。"
  }
  if ($topic -match "指南|路线图|教程|实践|复盘|分析") {
    return "该文系统梳理[$topic]，覆盖背景、核心方法与可执行建议。"
  }
  if ($body.Length -lt 50) {
    return "该笔记内容较短，当前主要用于记录[$topic]的线索，建议后续补全。"
  }
  return "该文聚焦[$topic]，整理了关键事实、观点与后续可处理线索。"
}

function Get-NextAction {
  param([string[]]$primaryTags)

  if ($primaryTags -contains "编程工程" -or $primaryTags -contains "科技AI") {
    return "建议迁移至 02_Areas 技术专题，长文可拆为方法卡片与SOP。"
  }
  if ($primaryTags -contains "经济金融") {
    return "建议迁移至 02_Areas 经济金融专题，并与历史行情笔记建立双链。"
  }
  if ($primaryTags -contains "社会文化" -or $primaryTags -contains "历史政治") {
    return "建议迁移至 02_Areas 社会观察专题，补充来源与反例后再归档。"
  }
  if ($primaryTags -contains "个人成长" -or $primaryTags -contains "健康生活") {
    return "建议迁移至 02_Areas 个人发展专题，提炼可执行清单。"
  }
  return "建议暂留 Inbox，待补充上下文后再迁移。"
}

$headingByFile = @{}
if (Test-Path $headingIndexPath) {
  Get-Content -Path $headingIndexPath | ForEach-Object {
    if ($_ -match "^([^:]+):\d+:(.*)$") {
      $file = ($matches[1] -replace "/", "\\")
      $line = $matches[2].Trim()
      if (-not $headingByFile.ContainsKey($file)) { $headingByFile[$file] = New-Object System.Collections.Generic.List[string] }
      [void]$headingByFile[$file].Add((Clean-Line $line))
    }
  }
}

$records = New-Object System.Collections.Generic.List[object]
$lowConfidence = New-Object System.Collections.Generic.List[string]
$emptyFiles = New-Object System.Collections.Generic.List[string]

foreach ($f in $processFiles) {
  $raw = Get-Content -Path $f -Raw
  $body = Remove-Frontmatter $raw
  $created = Get-FrontmatterValue -text $raw -key "创建时间"
  $title = Get-Title -body $body -filePath $f
  $headings = @()
  if ($headingByFile.ContainsKey($f)) {
    $headings = @($headingByFile[$f])
  }

  $lines = @($body -split "`r?`n")
  $contentLines = @(
    $lines |
      ForEach-Object { Clean-Line $_ } |
      Where-Object {
        -not [string]::IsNullOrWhiteSpace($_) -and
        $_ -notmatch '^(---|```|状态:|tags:|aliases:|para:)$'
      }
  )

  $snippetLines = @($contentLines | Select-Object -First 3)
  $longText = ($contentLines | Select-Object -First 120) -join "\n"
  $primary = Get-PrimaryTags -text $longText -title $title
  $secondary = Get-SecondaryTags -text $longText -title $title -primaryTags $primary

  $summaryShort = Get-ShortSummary -title $title -body $body

  $detail = New-Object System.Collections.Generic.List[string]
  [void]$detail.Add("主题焦点：$title")

  if ($snippetLines.Count -gt 0) {
    [void]$detail.Add("关键线索：$($snippetLines[0])")
  }
  if ($snippetLines.Count -gt 1) {
    [void]$detail.Add("补充信息：$($snippetLines[1])")
  }
  if ($headings.Count -gt 0) {
    $h = @($headings | Select-Object -First 4) -join "；"
    [void]$detail.Add("结构线索：$h")
  }

  $nextAction = Get-NextAction -primaryTags $primary
  [void]$detail.Add("整理建议：$nextAction")

  if ($detail.Count -gt 6) {
    $detail = New-Object System.Collections.Generic.List[string] (@($detail | Select-Object -First 6))
  }

  while ($detail.Count -lt 3) {
    [void]$detail.Add("补充待办：建议人工复核原文以补全关键事实。")
  }

  $confidence = "high"
  if ($contentLines.Count -eq 0) {
    $confidence = "low"
    [void]$emptyFiles.Add($f)
  } elseif ($lines.Count -gt 500) {
    $confidence = "medium"
  } elseif ($secondary.Count -lt 3) {
    $confidence = "medium"
  }

  if ($confidence -ne "high") {
    [void]$lowConfidence.Add($f)
  }

  $records.Add([PSCustomObject]@{
    file_path = $f
    title = $title
    created_at = $created
    summary_short = $summaryShort
    summary_detailed = @($detail)
    tags_primary = @($primary)
    tags_secondary = @($secondary)
    confidence = $confidence
    next_action = $nextAction
  }) | Out-Null
}

$records = @($records | Sort-Object -Property file_path)

# summary_report.md
$summaryLines = New-Object System.Collections.Generic.List[string]
$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

[void]$summaryLines.Add("# 00_Inbox 摘要与标签整理报告")
[void]$summaryLines.Add("")
[void]$summaryLines.Add("生成时间: $now")
[void]$summaryLines.Add("")
[void]$summaryLines.Add("## 全局统计")
[void]$summaryLines.Add("")
[void]$summaryLines.Add("- 总文件数(含排除): $($allFiles.Count)")
[void]$summaryLines.Add("- 实际处理: $($records.Count)")
[void]$summaryLines.Add("- 排除: $($excludedFiles.Count)")
[void]$summaryLines.Add("- 低置信度: $($lowConfidence.Count)")
[void]$summaryLines.Add("- 空内容文件: $($emptyFiles.Count)")
[void]$summaryLines.Add("")
[void]$summaryLines.Add("## 排除清单")
[void]$summaryLines.Add("")
foreach ($ex in $excludedFiles) {
  [void]$summaryLines.Add("- $ex")
}
[void]$summaryLines.Add("")
[void]$summaryLines.Add("## 单篇明细")
[void]$summaryLines.Add("")

$idx = 1
foreach ($r in $records) {
  [void]$summaryLines.Add("### $idx. $($r.title)")
  [void]$summaryLines.Add("")
  [void]$summaryLines.Add("- file_path: $($r.file_path)")
  [void]$summaryLines.Add("- created_at: $($r.created_at)")
  [void]$summaryLines.Add("- summary_short: $($r.summary_short)")
  [void]$summaryLines.Add("- summary_detailed:")
  foreach ($d in $r.summary_detailed) {
    [void]$summaryLines.Add("  - $d")
  }
  [void]$summaryLines.Add("- tags_primary: " + ($r.tags_primary -join ", "))
  [void]$summaryLines.Add("- tags_secondary: " + ($r.tags_secondary -join ", "))
  [void]$summaryLines.Add("- confidence: $($r.confidence)")
  [void]$summaryLines.Add("- next_action: $($r.next_action)")
  [void]$summaryLines.Add("")
  $idx += 1
}

Set-Content -Path $summaryPath -Value $summaryLines -Encoding utf8

# tag_index.md
$primaryIndex = @{}
$secondaryIndex = @{}

foreach ($r in $records) {
  foreach ($p in $r.tags_primary) {
    if (-not $primaryIndex.ContainsKey($p)) { $primaryIndex[$p] = New-Object System.Collections.Generic.List[string] }
    [void]$primaryIndex[$p].Add($r.file_path)
  }
  foreach ($s in $r.tags_secondary) {
    if (-not $secondaryIndex.ContainsKey($s)) { $secondaryIndex[$s] = New-Object System.Collections.Generic.List[string] }
    [void]$secondaryIndex[$s].Add($r.file_path)
  }
}

$tagLines = New-Object System.Collections.Generic.List[string]
[void]$tagLines.Add("# 00_Inbox 标签反向索引")
[void]$tagLines.Add("")
[void]$tagLines.Add("生成时间: $now")
[void]$tagLines.Add("")
[void]$tagLines.Add("## 一级标签")
[void]$tagLines.Add("")

foreach ($k in ($primaryIndex.Keys | Sort-Object)) {
  $files = @($primaryIndex[$k] | Sort-Object -Unique)
  [void]$tagLines.Add("### $k ($($files.Count))")
  foreach ($f in $files) {
    [void]$tagLines.Add("- $f")
  }
  [void]$tagLines.Add("")
}

[void]$tagLines.Add("## 二级标签")
[void]$tagLines.Add("")
foreach ($k in ($secondaryIndex.Keys | Sort-Object)) {
  $files = @($secondaryIndex[$k] | Sort-Object -Unique)
  [void]$tagLines.Add("### $k ($($files.Count))")
  foreach ($f in $files) {
    [void]$tagLines.Add("- $f")
  }
  [void]$tagLines.Add("")
}

Set-Content -Path $tagIndexPath -Value $tagLines -Encoding utf8

# processing_log.md
$logLines = New-Object System.Collections.Generic.List[string]
[void]$logLines.Add("# 00_Inbox Processing Log")
[void]$logLines.Add("")
[void]$logLines.Add("生成时间: $now")
[void]$logLines.Add("")
[void]$logLines.Add("## Inputs")
[void]$logLines.Add("")
[void]$logLines.Add("- source_dir: $sourceDir")
[void]$logLines.Add("- metadata_index: $metadataIndexPath")
[void]$logLines.Add("- heading_index: $headingIndexPath")
[void]$logLines.Add("- total_md: $($allFiles.Count)")
[void]$logLines.Add("- processed_md: $($records.Count)")
[void]$logLines.Add("- excluded_md: $($excludedFiles.Count)")
[void]$logLines.Add("")
[void]$logLines.Add("## Excluded")
[void]$logLines.Add("")
foreach ($ex in $excludedFiles) {
  [void]$logLines.Add("- $ex")
}
[void]$logLines.Add("")
[void]$logLines.Add("## Low Confidence")
[void]$logLines.Add("")
if ($lowConfidence.Count -eq 0) {
  [void]$logLines.Add("- (none)")
} else {
  foreach ($lf in ($lowConfidence | Sort-Object -Unique)) {
    [void]$logLines.Add("- $lf")
  }
}
[void]$logLines.Add("")
[void]$logLines.Add("## Notes")
[void]$logLines.Add("")
[void]$logLines.Add("- 本次执行仅新增 01_Project 下产物文件，未写入 00_Inbox。")
[void]$logLines.Add("- 标签应用固定词表，超出词表不落盘。")

Set-Content -Path $logPath -Value $logLines -Encoding utf8

"generated_summary=$summaryPath"
"generated_tag_index=$tagIndexPath"
"generated_log=$logPath"
"processed_count=$($records.Count)"
"low_confidence=$($lowConfidence.Count)"
