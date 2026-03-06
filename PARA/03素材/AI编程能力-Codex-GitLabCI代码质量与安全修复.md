---
创建时间: 2026-02-03
最后修改: 2026-02-15
状态:
  - Areas
tags:
  - codex
para: areas
aliases:
  - 04_GitLab CI, 代码质量与安全修复 (Codex CLI)
---
# GitLab CI: 用 Codex 生成 Code Quality 报告, 整理并修复 SAST 结果

> [!summary]
> 这篇讲两个落地场景:
> 1) 用 Codex CLI 生成 GitLab 可识别的 Code Quality 报告(CodeClimate JSON)，让 MR 直接显示问题列表。
> 2) 读取上游 SAST 产物(`gl-sast-report.json`)，用 Codex 做“去重 + 排序 + 可执行修复建议”，甚至生成可应用的 patch。

## 先记住一个套路(几乎所有 CI 集成都靠它)

把 Codex 放进 CI 时，最怕的是输出不稳定。稳定做法是三件套:

1. **严格输出格式**: 强制它只在 marker 之间输出(例如 `=== BEGIN... ===` 到 `=== END... ===`)。
2. **提取与清洗**: 把原始输出保存为日志，去掉 ANSI/`\r`，再按 marker 抽出内容。
3. **校验与兜底**: JSON 就 `JSON.parse`，diff 就 `git apply --check`。失败就输出空报告或 noop。

> [!tip]
> 你要的不是“模型写了很多建议”，而是“CI 能稳定产出机器可读的工件(artifact)”，GitLab UI 才能展示。

---

## 示例 1: 生成 Code Quality 报告(CodeClimate JSON)

GitLab 的 Code Quality 小组件要求你上传 CodeClimate JSON 格式的报告。

下面 job 做了这些事:

- 安装 Codex CLI
- 用严格 prompt 要求输出一个 JSON array
- 从 marker 中提取 JSON, 校验 JSON，失败则回退到 `[]`
- 作为 `artifacts:reports:codequality` 上传，让 MR UI 展示

```yaml
stages: [codex]

default:
  image: node:24
  variables:
    CODEX_QA_PATH: "gl-code-quality-report.json"
    CODEX_RAW_LOG: "artifacts/codex-raw.log"
    # Strict prompt: must output a single JSON array (or []), no prose/markdown/placeholders.
    CODEX_PROMPT: |
      Review this repository and output a GitLab Code Quality report in CodeClimate JSON format.
      RULES (must follow exactly):
      - OUTPUT MUST BE A SINGLE JSON ARRAY. Example: [] or [ {...}, {...} ].
      - If you find no issues, OUTPUT EXACTLY: []
      - DO NOT print any prose, backticks, code fences, markdown, or placeholders.
      - DO NOT write any files. PRINT ONLY between these two lines:
        === BEGIN_CODE_QUALITY_JSON ===
        <JSON ARRAY HERE>
        === END_CODE_QUALITY_JSON ===
      Each issue object MUST include these fields:
        "description": String,
        "check_name": String (short rule name),
        "fingerprint": String (stable across runs for same issue),
        "severity": "info"|"minor"|"major"|"critical"|"blocker",
        "location": { "path": "<repo-relative-file>", "lines": { "begin": <line> } }
      Requirements:
      - Use repo-relative paths from the current checkout (no "./", no absolute paths).
      - Use only files that actually exist in this repo.
      - No trailing commas. No comments. No BOM.
      - Prefer concrete, de-duplicated findings. If uncertain, omit the finding.

codex_review:
  stage: codex
  # Skip on forked MRs (no secrets available). Run only if OPENAI_API_KEY exists.
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_SOURCE_PROJECT_ID != $CI_PROJECT_ID'
      when: never
    - if: '$OPENAI_API_KEY'
      when: on_success
    - when: never

  script:
    - set -euo pipefail
    - echo "PWD=$(pwd)  CI_PROJECT_DIR=${CI_PROJECT_DIR}"
    # Ensure artifacts always exist so upload never warns, even on early failure
    - mkdir -p artifacts
    - ': > ${CODEX_RAW_LOG}'
    - ': > ${CODEX_QA_PATH}'
    # Minimal deps + Codex CLI
    - apt-get update && apt-get install -y --no-install-recommends curl ca-certificates git lsb-release
    - npm -g i @openai/codex@latest
    - codex --version && git --version
    # Build a real-file allowlist to guide Codex to valid paths/lines
    - FILE_LIST="$(git ls-files | sed 's/^/- /')"
    - |
      export CODEX_PROMPT="${CODEX_PROMPT}
      Only report issues in the following existing files (exactly as listed):
      ${FILE_LIST}"
    # Run Codex; allow non-zero exit but capture output for extraction
    - |
      set +o pipefail
      script -q -c 'codex exec --full-auto "$CODEX_PROMPT"' | tee "${CODEX_RAW_LOG}" >/dev/null
      CODEX_RC=${PIPESTATUS[0]}
      set -o pipefail
      echo "Codex exit code: ${CODEX_RC}"
    # Strip ANSI + \\r, extract JSON between markers to a temp file; validate or fallback to []
    - |
      TMP_OUT="$(mktemp)"
      sed -E 's/\\x1B\\[[0-9;]*[A-Za-z]//g' "${CODEX_RAW_LOG}" \
        | tr -d '\\r' \
        | awk '
            /^\\s*=== BEGIN_CODE_QUALITY_JSON ===\\s*$/ {grab=1; next}
            /^\\s*=== END_CODE_QUALITY_JSON ===\\s*$/   {grab=0}
            grab
          ' > "${TMP_OUT}"
      # If extracted content is empty/invalid or still contains placeholders, replace with []
      if ! node -e 'const f=process.argv[1]; const s=require("fs").readFileSync(f,"utf8").trim(); if(!s || /(<JSON ARRAY HERE>|BEGIN_CODE_QUALITY_JSON|END_CODE_QUALITY_JSON)/.test(s)) process.exit(2); JSON.parse(s);' "${TMP_OUT}"; then
        echo "WARNING: Extracted content empty/invalid; writing empty [] report."
        echo "[]" > "${TMP_OUT}"
      fi
      mv -f "${TMP_OUT}" "${CODEX_QA_PATH}"
      # Soft warning if Codex returned non-zero but we still produced a report
      if [ "${CODEX_RC}" -ne 0 ]; then
        echo "WARNING: Codex exited with code ${CODEX_RC}. Proceeding with extracted report." >&2
      fi

  artifacts:
    when: always
    reports:
      codequality: gl-code-quality-report.json
    paths:
      - artifacts/codex-raw.log
    expire_in: 14 days
```

---

## 示例 2: SAST 结果再加工(去重, 排序, 给行动项)

前提: 你的 pipeline 上游已经产出了 `gl-sast-report.json` (GitLab SAST 或其它扫描器生成)。

这个 job 的目标是生成一个给人看的 `security_priority.md`:

- 把重复/重叠的漏洞合并
- 按“真实可利用性 + 业务风险”排序，而不是只看 severity
- 产出 Top 5 行动项(可直接开工)

```yaml
stages:
  - codex
  - remediation

default:
  image: node:24

variables:
  CODEX_SAST_PATH: "gl-sast-report.json"
  CODEX_SECURITY_MD: "security_priority.md"
  CODEX_RAW_LOG: "artifacts/codex-sast-raw.log"

  # Recommendations prompt (reads SAST -> writes Markdown)
  CODEX_PROMPT: |
    You are a security triage assistant analyzing GitLab SAST output.
    The SAST JSON is located at: ${CODEX_SAST_PATH}

    GOAL:
    - Read and parse ${CODEX_SAST_PATH}.
    - Consolidate duplicate or overlapping findings (e.g., same CWE + same sink/function, same file/line ranges, or same data flow root cause).
    - Rank findings by realistic exploitability and business risk, not just library presence.
      * Prioritize issues that:
        - Are reachable from exposed entry points (HTTP handlers, controllers, public APIs, CLI args).
        - Involve user-controlled inputs reaching dangerous sinks (e.g., SQL exec, OS exec, eval, path/file ops, deserialization, SSRF).
        - Occur in authentication/authorization boundaries or around secrets/keys/tokens.
        - Have clear call stacks/evidence strings pointing to concrete methods that run.
        - Affect internet-facing or privileged components.
      * De-prioritize purely theoretical findings with no reachable path or dead code.

    CONSOLIDATION RULES:
    - Aggregate by (CWE, primary sink/function, file[:line], framework route/handler) when applicable.
    - Merge repeated instances across files if they share the same source-sink pattern and remediation is the same.
    - Keep a single representative entry with a count of affected locations; list notable examples.

    OUTPUT FORMAT (MARKDOWN ONLY, BETWEEN MARKERS BELOW):
    - Start with a title and short summary of total findings and how many were consolidated.
    - A table of TOP PRIORITIES sorted by exploitability (highest first) with columns:
      Rank | CWE | Title | Affected Locations | Likely Exploit Path | Risk | Rationale (1-2 lines)
    - "Top 5 Immediate Actions" list with concrete next steps.
    - "Deduplicated Findings (Full Details)" with risk, 0-100 exploitability score, evidence (file:line + methods), remediation, owners, references.
    - If ${CODEX_SAST_PATH} is missing or invalid JSON, output a brief note stating no parsable SAST findings.

    RULES (must follow exactly):
    - PRINT ONLY between these two lines:
      === BEGIN_SECURITY_MD ===
      <MARKDOWN CONTENT HERE>
      === END_SECURITY_MD ===
    - No prose, backticks, code fences, or anything outside the markers.
    - Be concise but specific. Cite only evidence present in the SAST report.

codex_recommendations:
  stage: codex
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_SOURCE_PROJECT_ID != $CI_PROJECT_ID'
      when: never
    - if: '$OPENAI_API_KEY'
      when: on_success
    - when: never
  script:
    - set -euo pipefail
    - mkdir -p artifacts
    - ": > ${CODEX_RAW_LOG}"
    - ": > ${CODEX_SECURITY_MD}"

    - apt-get update && apt-get install -y --no-install-recommends curl ca-certificates git lsb-release
    - npm -g i @openai/codex@latest
    - codex --version && git --version

    - |
      if [ ! -s "${CODEX_SAST_PATH}" ]; then
        echo "WARNING: ${CODEX_SAST_PATH} not found or empty. Codex will emit a 'no parsable findings' note."
      fi

    # Ground Codex to actual repo files (avoid hallucinated paths)
    - FILE_LIST="$(git ls-files | sed 's/^/- /')"
    - |
      export CODEX_PROMPT="${CODEX_PROMPT}

      Existing repository files (for reference only; use paths exactly as listed in SAST evidence):
      ${FILE_LIST}"

    # Run Codex and capture raw output (preserve Codex exit code via PIPESTATUS)
    - |
      set +o pipefail
      codex exec --full-auto "$CODEX_PROMPT" | tee "${CODEX_RAW_LOG}" >/dev/null
      CODEX_RC=${PIPESTATUS[0]}
      set -o pipefail
      echo "Codex exit code: ${CODEX_RC}"

    # Extract markdown between markers; fallback to a minimal note
    - |
      TMP_OUT="$(mktemp)"
      sed -E 's/\\x1B\\[[0-9;]*[A-Za-z]//g' "${CODEX_RAW_LOG}" | tr -d '\\r' | awk '
        /^\\s*=== BEGIN_SECURITY_MD ===\\s*$/ {grab=1; next}
        /^\\s*=== END_SECURITY_MD ===\\s*$/   {grab=0}
        grab
      ' > "${TMP_OUT}"
      if ! [ -s "${TMP_OUT}" ]; then
        cat > "${TMP_OUT}" <<'EOF'
# Security Findings Priority
No parsable SAST findings detected in `gl-sast-report.json`.
EOF
        echo "WARNING: No content extracted; wrote minimal placeholder."
      fi
      mv -f "${TMP_OUT}" "${CODEX_SECURITY_MD}"
      if [ "${CODEX_RC}" -ne 0 ]; then
        echo "WARNING: Codex exited with code ${CODEX_RC}. Proceeding with extracted report." >&2
      fi
  artifacts:
    when: always
    paths:
      - artifacts/codex-sast-raw.log
      - security_priority.md
    expire_in: 14 days
```

---

## 示例 3: 基于 SAST 生成可应用 patch(进阶)

如果你想更进一步，可以让 Codex 对 High/Critical 的漏洞逐个生成 unified diff，然后在 CI 里做 `git apply --check` 校验，校验通过就保存成 `.patch`。

> [!warning]
> 这一步会让“误修复”的风险上升。建议先只在 MR 里产出 patch 给人审，而不是自动应用到分支。

```yaml
stages:
  - remediation

default:
  image: node:24

variables:
  # Inputs/outputs
  SAST_REPORT_PATH: "gl-sast-report.json"
  PATCH_DIR: "codex_patches"
  CODEX_DIFF_RAW: "artifacts/codex-diff-raw.log"

  # Resolution prompt (produces unified git diffs only)
  CODEX_DIFF_PROMPT: |
    You are a secure code remediation assistant.
    You will receive:
    - The repository working tree (read-only)
    - One vulnerability (JSON from a GitLab SAST report)
    - Allowed files list

    GOAL:
    - Create the minimal, safe fix for the vulnerability.
    - Output a unified git diff that applies cleanly with `git apply -p0` (or -p1 for a/ b/ paths).
    - Prefer surgical changes: input validation, safe APIs, parameterized queries, permission checks.
    - Do NOT refactor broadly or change unrelated code.

    RULES (must follow exactly):
    - PRINT ONLY the diff between the markers below.
    - Use repo-relative paths; `diff --git a/path b/path` headers are accepted.
    - No binary file changes. No prose/explanations outside the markers.

    MARKERS:
    === BEGIN_UNIFIED_DIFF ===
    <unified diff here>
    === END_UNIFIED_DIFF ===

    If no safe fix is possible without deeper changes, output an empty diff between the markers.

codex_resolution:
  stage: remediation
  rules:
    - if: '$OPENAI_API_KEY'
      when: on_success
    - when: never
  script:
    - set -euo pipefail
    - mkdir -p "$PATCH_DIR" artifacts

    # Deps
    - apt-get update && apt-get install -y --no-install-recommends bash git jq curl ca-certificates
    - npm -g i @openai/codex@latest
    - git --version && codex --version || true

    # Require SAST report; no-op if missing
    - |
      if [ ! -s "${SAST_REPORT_PATH}" ]; then
        echo "No SAST report found; remediation will no-op."
        printf "CODEX_CREATED_PATCHES=false\n" > codex.env
        exit 0
      fi

    # Pull High/Critical items
    - jq -c '.vulnerabilities[]? | select((.severity|ascii_downcase)=="high" or (.severity|ascii_downcase)=="critical")' "$SAST_REPORT_PATH" \
        | nl -ba > /tmp/hicrit.txt || true
    - |
      if [ ! -s /tmp/hicrit.txt ]; then
        echo "No High/Critical vulnerabilities found. Nothing to fix."
        printf "CODEX_CREATED_PATCHES=false\n" > codex.env
        exit 0
      fi

    # Ground Codex to actual repo files
    - FILE_LIST="$(git ls-files | sed 's/^/- /')"

    - created=0

    # Loop: build prompt, run Codex, extract diff, validate
    - |
      while IFS=$'\t' read -r idx vuln_json; do
        echo "Processing vulnerability #$idx"
        echo "$vuln_json" > "/tmp/vuln-$idx.json"

        PROMPT_FILE="$(mktemp)"
        {
          printf "%s\n\n" "$CODEX_DIFF_PROMPT"
          printf "VULNERABILITY_JSON:\n<<JSON\n"
          cat "/tmp/vuln-$idx.json"
          printf "\nJSON\n\n"
          printf "EXISTING_REPOSITORY_FILES (exact list):\n"
          printf "%s\n" "$FILE_LIST"
        } > "$PROMPT_FILE"

        PER_FINDING_PROMPT="$(tr -d '\r' < "$PROMPT_FILE")"
        rm -f "$PROMPT_FILE"

        : > "$CODEX_DIFF_RAW"
        set +o pipefail
        codex exec --full-auto "$PER_FINDING_PROMPT" | tee -a "$CODEX_DIFF_RAW" >/dev/null
        RC=${PIPESTATUS[0]}
        set -o pipefail
        echo "Codex (diff) exit code: ${RC}"

        OUT_PATCH="$PATCH_DIR/fix-$idx.patch"
        sed -E 's/\\x1B\\[[0-9;]*[A-Za-z]//g' "$CODEX_DIFF_RAW" \
          | tr -d '\r' \
          | awk '
              /^\\s*=== BEGIN_UNIFIED_DIFF ===\\s*$/ {grab=1; next}
              /^\\s*=== END_UNIFIED_DIFF ===\\s*$/   {grab=0}
              grab
            ' > "$OUT_PATCH"

        if ! [ -s "$OUT_PATCH" ] || ! grep -qE '^\\s*diff --git ' "$OUT_PATCH"; then
          echo "  No usable diff produced for #$idx; skipping."
          rm -f "$OUT_PATCH"
          continue
        fi

        # Validate: accept -p0 (repo-relative) or -p1 (a/ b/ prefixes)
        if git apply --check -p0 "$OUT_PATCH" || git apply --check -p1 "$OUT_PATCH"; then
          echo "  Patch validated -> $OUT_PATCH"
          created=$((created+1))
        else
          echo "  Patch failed to apply cleanly; removing."
          rm -f "$OUT_PATCH"
        fi
      done < /tmp/hicrit.txt

      if [ "$created" -gt 0 ]; then
        printf "CODEX_CREATED_PATCHES=true\nPATCH_DIR=%s\n" "$PATCH_DIR" > codex.env
      else
        printf "CODEX_CREATED_PATCHES=false\n" > codex.env
      fi
  artifacts:
    when: always
    paths:
      - codex_patches/
      - artifacts/codex-diff-raw.log
    reports:
      dotenv: codex.env
    expire_in: 14 days
```

## 参考

- GitLab Code Quality: https://docs.gitlab.com/ci/testing/code_quality/
- GitLab SAST: https://docs.gitlab.com/user/application_security/sast/
- Codex CLI: https://github.com/openai/codex

