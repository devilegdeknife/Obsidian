#!/usr/bin/env python3
# Batch-migrate Zhihu saved notes from 00-Inbox/知乎收藏 -> 03-Resource/<deep topic dirs>,
# and normalize frontmatter to a minimal set.
#
# Notes:
# - Designed for an Obsidian vault: we keep filenames stable (only move paths) to reduce link breakage.
# - We remove existing YAML frontmatter (typically tags) and replace with:
#   type/source/url/topics/status.
# - We also write a backup zip and a TSV log for auditability.

from __future__ import annotations

import re
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Optional, Tuple


VAULT_ROOT = Path.cwd()
SOURCE_DIR = VAULT_ROOT / "00-Inbox" / "知乎收藏"
DEST_ROOT = VAULT_ROOT / "03-Resource"
BACKUP_DIR = VAULT_ROOT / "04-Archives" / "_backups"
LOG_DIR = VAULT_ROOT / "04-Archives" / "_logs"


ROOT_TAG_SEGMENTS = {
    "技术",
    "学习",
    "文化",
    "生活",
    "社会",
    "心理",
    "职场",
    "金融",
}

# Segments that usually add noise when used as "topics".
GENERIC_SEGMENTS = {
    "观点",
    "讨论",
    "评论",
    "观察",
    "思考",
    "方法",
    "策略",
    "应用",
    "原理",
    "工具",
    "趋势",
    "日常",
    "议题",
    "现象",
    "经验",
    "科普",
}


@dataclass(frozen=True)
class NoteMeta:
    title: str
    url: Optional[str]
    tags: List[str]
    topics: List[str]
    dest_dir: Path


def _extract_yaml_frontmatter(text: str) -> Tuple[Optional[str], str]:
    # Supports both \n and \r\n line endings.
    m = re.match(r"(?s)^---\s*\r?\n(.*?)\r?\n---\s*\r?\n?", text)
    if not m:
        return None, text
    fm = m.group(1)
    rest = text[m.end() :]
    return fm, rest


def _parse_tags(frontmatter: Optional[str]) -> List[str]:
    if not frontmatter:
        return []

    # Common format in this vault: tags: [a, b, c]
    m = re.search(r"(?m)^tags:\s*\[(.*?)\]\s*$", frontmatter)
    if m:
        raw = m.group(1).strip()
        if not raw:
            return []
        # Values do not contain commas in this vault's taxonomy, so a simple split is OK.
        parts = [p.strip() for p in raw.split(",")]
        tags = []
        for p in parts:
            if not p:
                continue
            # Strip surrounding quotes if any.
            if (p.startswith("'") and p.endswith("'")) or (p.startswith('"') and p.endswith('"')):
                p = p[1:-1]
            tags.append(p)
        return tags

    # YAML list fallback:
    # tags:
    #   - a
    #   - b
    lines = frontmatter.splitlines()
    tags: List[str] = []
    in_tags = False
    for line in lines:
        if not in_tags:
            if re.match(r"^\s*tags:\s*$", line):
                in_tags = True
            continue
        # Stop when leaving the tags block.
        if re.match(r"^\S", line):
            break
        m_item = re.match(r"^\s*-\s+(.*?)\s*$", line)
        if m_item:
            tags.append(m_item.group(1))
    return tags


def _extract_title(body: str, fallback: str) -> str:
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    # Fallback: use filename stem, best-effort de-noise.
    return fallback.replace("_", " ").strip()


def _extract_url(text: str) -> Optional[str]:
    # Prefer explicit "内容链接".
    m = re.search(r"\[内容链接\]\(([^)]+)\)", text)
    if m:
        return m.group(1).strip()

    # Otherwise pick the first http(s) URL.
    m = re.search(r"https?://\S+", text)
    if m:
        return m.group(0).rstrip(").,]}>\"'")
    return None


def _sanitize_segment(seg: str) -> str:
    # Windows path-safe: strip characters that are invalid in folder names.
    seg = seg.strip().strip(".")
    seg = re.sub(r'[<>:"/\\\\|?*]+', "-", seg)
    seg = re.sub(r"\s+", " ", seg).strip()
    return seg or "_"


def _choose_dest_dir(tags: List[str], filename_stem: str) -> Path:
    # Special-case: meta files.
    if filename_stem.lower() in {"summary-tags", "summary tags"}:
        return DEST_ROOT / "知识库管理" / "标签管理"

    if not tags:
        return DEST_ROOT / "未分类"

    primary = tags[0]
    segments = [_sanitize_segment(s) for s in primary.split("/") if s.strip()]
    if not segments:
        return DEST_ROOT / "未分类"

    return DEST_ROOT.joinpath(*segments)


def _extract_latin_tokens(title: str) -> List[str]:
    # Grab tokens like ChatGPT, GPT-4, AV1, HEVC, Gen-2, C++, etc.
    tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9+_.-]*", title)
    # Deduplicate while preserving order.
    seen = set()
    out: List[str] = []
    for t in tokens:
        if t in seen:
            continue
        seen.add(t)
        out.append(t)
    return out


def _derive_topics(tags: List[str], title: str) -> List[str]:
    topics: List[str] = []

    def add_topic(t: str) -> None:
        t = t.strip()
        if not t:
            return
        if t in ROOT_TAG_SEGMENTS:
            return
        if t in GENERIC_SEGMENTS:
            return
        if t not in topics:
            topics.append(t)

    # Use tag path segments (minus top-level taxonomy roots), filtered.
    for tag in tags:
        segs = [s.strip() for s in tag.split("/") if s.strip()]
        for seg in segs:
            add_topic(seg)

    # Add Latin tokens from the title (often the most searchable bits).
    for tok in _extract_latin_tokens(title):
        add_topic(tok)

    # Ensure we have at least one topic.
    if not topics and tags:
        # Fallback: take the most specific segment of the primary tag, even if generic.
        segs = [s.strip() for s in tags[0].split("/") if s.strip()]
        if len(segs) >= 2 and segs[-1] not in topics:
            topics.append(segs[-1])

    # Keep it minimal.
    return topics[:6]


def _yaml_quote(s: str) -> str:
    # Minimal YAML-safe quoting for flow sequences.
    if re.fullmatch(r"[A-Za-z0-9\u4e00-\u9fff+_.-]+", s):
        return s
    return "'" + s.replace("'", "''") + "'"


def _render_frontmatter(url: Optional[str], topics: List[str]) -> str:
    lines = ["---", "type: resource", "source: zhihu"]
    if url:
        lines.append(f"url: {url}")
    if topics:
        joined = ", ".join(_yaml_quote(t) for t in topics)
        lines.append(f"topics: [{joined}]")
    lines.append("status: processed")
    lines.append("---")
    return "\n".join(lines) + "\n"


def _write_backup_zip(zip_path: Path, files: Iterable[Path]) -> None:
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in files:
            rel = p.relative_to(VAULT_ROOT)
            zf.write(p, arcname=str(rel))


def main() -> int:
    if not SOURCE_DIR.exists():
        raise SystemExit(f"Source dir not found: {SOURCE_DIR}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"zhihu_inbox_backup_{timestamp}.zip"
    log_path = LOG_DIR / f"zhihu_inbox_to_resource_{timestamp}.tsv"

    files = sorted(SOURCE_DIR.glob("*.md"))
    if not files:
        print("No .md files found, nothing to do.")
        return 0

    LOG_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Backing up {len(files)} files -> {backup_path.relative_to(VAULT_ROOT)}")
    _write_backup_zip(backup_path, files)

    moved = 0
    skipped = 0

    with log_path.open("w", encoding="utf-8", newline="\n") as log:
        log.write("src\tdest\turl\ttitle\ttopics\n")

        for src in files:
            try:
                raw = src.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                raw = src.read_text(encoding="utf-8", errors="replace")

            fm, body = _extract_yaml_frontmatter(raw)
            tags = _parse_tags(fm)
            title = _extract_title(body, fallback=src.stem)
            url = _extract_url(raw)

            dest_dir = _choose_dest_dir(tags, filename_stem=src.stem)
            topics = _derive_topics(tags, title)

            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / src.name

            # Collision safety: don't overwrite existing files.
            if dest.exists():
                # Keep deterministic suffixing.
                n = 1
                while True:
                    candidate = dest_dir / f"{src.stem}__dup{n}{src.suffix}"
                    if not candidate.exists():
                        dest = candidate
                        break
                    n += 1

            new_text = _render_frontmatter(url, topics)
            # Keep the rest of the note as-is (minus old frontmatter).
            new_text += body.lstrip("\ufeff").lstrip("\n").lstrip("\r\n")

            dest.write_text(new_text, encoding="utf-8", newline="\n")
            src.unlink()

            moved += 1
            log.write(
                f"{src.as_posix()}\t{dest.as_posix()}\t{(url or '')}\t{title}\t{', '.join(topics)}\n"
            )
            if moved % 50 == 0:
                print(f"...moved {moved}/{len(files)}")

    print(f"Done. Moved {moved} files. Log: {log_path.relative_to(VAULT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

