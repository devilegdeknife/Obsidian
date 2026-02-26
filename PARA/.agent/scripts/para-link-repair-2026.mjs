#!/usr/bin/env node

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, '.agent', 'outputs');
const REPORT_FILE = path.join(OUTPUT_DIR, 'para-link-repair-2026-report.json');
const BROKEN_BEFORE_FILE = path.join(OUTPUT_DIR, 'para-link-repair-2026-broken-before.jsonl');
const BROKEN_AFTER_FILE = path.join(OUTPUT_DIR, 'para-link-repair-2026-broken-after.jsonl');
const ROOT_PREFIX_DIRS = ['00_Inbox', '1-Projects', '2-Areas', '3-Resources', '4-Archives', '05_Daily'];

const DIRECT_WIKI_MAP_RAW = new Map([
  ['MOC - 心理控制机制', '社会心理观察-心理控制机制'],
  ['MOC - 经济剥削机制', '社会心理观察-经济剥削机制'],
  ['MOC - 性别表演研究', '社会心理观察-性别表演研究'],
  ['边缘关系的"准家人"剥削逻辑_Gemini_2026-01-17', '社会心理观察-边缘关系的-准家人-剥削逻辑'],
  ['边缘关系的“准家人”剥削逻辑_Gemini_2026-01-17', '社会心理观察-边缘关系的-准家人-剥削逻辑'],
  ['男娘', '社会心理观察-男娘与程序员女装文化分析'],
  ['codex docs', '资源-codex-docs'],
  ['DMA外挂真的无解吗-享彦-2025-08-12', '资源-DMA外挂真的无解吗'],
]);

const DIRECT_WIKI_MAP = new Map(
  [...DIRECT_WIKI_MAP_RAW.entries()].map(([k, v]) => [normalizeTitle(k), v]),
);

async function main() {
  await ensureDir(OUTPUT_DIR);

  const before = await collectBrokenLinks();
  const index = buildMdIndex(before.mdFiles);

  let touchedFiles = 0;
  let repairedLinks = 0;

  for (const rel of before.mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const original = await fs.readFile(abs, 'utf8');
    let localCount = 0;

    const next = original.replace(/\[\[([^\]]+)\]\]/g, (full, inner) => {
      const [targetAndHeading, alias = ''] = inner.split('|');
      const [targetRaw, heading = ''] = targetAndHeading.split('#');
      const target = targetRaw.trim();
      if (!target) {
        return full;
      }

      const resolved = resolveWikiTarget(rel, target, index);
      if (resolved) {
        return full;
      }

      if (isPlaceholderTarget(target)) {
        return full;
      }

      if (target.includes('/') || target.includes('\\')) {
        return full;
      }

      const direct = resolveDirectMappedTarget(target, index);
      if (direct) {
        const base = path.posix.basename(direct, '.md');
        if (base && base !== target) {
          localCount += 1;
          return `[[${base}${heading ? `#${heading}` : ''}${alias ? `|${alias}` : ''}]]`;
        }
      }

      const candidate = findBestCandidate(rel, target, index);
      if (!candidate) {
        return full;
      }

      const base = path.posix.basename(candidate, '.md');
      if (!base || base === target) {
        return full;
      }

      localCount += 1;
      return `[[${base}${heading ? `#${heading}` : ''}${alias ? `|${alias}` : ''}]]`;
    });

    const next2 = next.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, url) => {
      if (isExternalUrl(url) || url.startsWith('#')) {
        return full;
      }

      const [targetRaw, anchor = ''] = url.split('#');
      let target = targetRaw.trim();
      try {
        target = decodeURIComponent(target);
      } catch {
        target = targetRaw.trim();
      }

      if (!target) {
        return full;
      }

      const resolved = resolveMarkdownTarget(rel, target, index);
      if (resolved) {
        return full;
      }

      if (!looksLikeRootPrefixedPath(target)) {
        return full;
      }

      const rootCandidate = toPosix(target.replace(/^\.\/+/, '').replace(/\\/g, '/'));
      const rootAbs = path.join(ROOT, toNative(rootCandidate));
      const exists = requirePathExistsCache(rootAbs);
      if (!exists) {
        return full;
      }

      let relTarget = path.posix.relative(path.posix.dirname(rel), rootCandidate);
      relTarget = toPosix(relTarget);
      if (!relTarget.startsWith('.')) {
        relTarget = `./${relTarget}`;
      }

      localCount += 1;
      return `[${label}](${relTarget}${anchor ? `#${anchor}` : ''})`;
    });

    if (next2 !== original) {
      await fs.writeFile(abs, next2, 'utf8');
      touchedFiles += 1;
      repairedLinks += localCount;
    }
  }

  const after = await collectBrokenLinks();
  const report = {
    generated_at: new Date().toISOString(),
    repaired: {
      touched_files: touchedFiles,
      repaired_links: repairedLinks,
    },
    before: summarizeBroken(before.broken),
    after: summarizeBroken(after.broken),
    samples_after: after.broken.slice(0, 120),
  };

  await writeJsonl(BROKEN_BEFORE_FILE, before.broken);
  await writeJsonl(BROKEN_AFTER_FILE, after.broken);
  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log(`touched_files=${touchedFiles}`);
  console.log(`repaired_links=${repairedLinks}`);
  console.log(`before_total=${before.broken.length}`);
  console.log(`after_total=${after.broken.length}`);
  console.log(`after_actionable=${report.after.actionable_total}`);
  console.log(`after_placeholder=${report.after.placeholder_total}`);
}

function findBestCandidate(sourceRel, target, index) {
  const targetNorm = normalizeTitle(target);
  if (!targetNorm) {
    return null;
  }

  const srcTop = topDir(sourceRel);
  const srcDir = path.posix.dirname(sourceRel);
  const baseCandidates = index.byNorm.get(targetNorm) || [];

  const ranked = rankCandidates(baseCandidates, sourceRel);
  if (ranked.length === 1) {
    return ranked[0];
  }

  const targetCore = stripCommonPrefixes(stripLeadingNumber(targetNorm));
  if (!targetCore) {
    return null;
  }

  const containsMatches = [];
  const containsSameTop = [];
  for (const rel of index.mdFiles) {
    const base = path.posix.basename(rel, '.md');
    const baseNorm = normalizeTitle(base);
    if (!baseNorm) {
      continue;
    }
    if (!baseNorm.includes(targetCore)) {
      continue;
    }
    if (topDir(rel) === srcTop) {
      containsSameTop.push(rel);
    }
  }

  const containsSameTopRanked = rankCandidates(containsSameTop, sourceRel);
  if (containsSameTopRanked.length === 1) {
    return containsSameTopRanked[0];
  }

  for (const rel of index.mdFiles) {
    const base = path.posix.basename(rel, '.md');
    const baseNorm = normalizeTitle(base);
    if (!baseNorm) {
      continue;
    }
    if (!baseNorm.includes(targetCore)) {
      continue;
    }
    containsMatches.push(rel);
  }

  const containsRanked = rankCandidates(containsMatches, sourceRel);
  if (containsRanked.length === 1) {
    return containsRanked[0];
  }

  const sameDirStrong = containsRanked.filter((x) => path.posix.dirname(x) === srcDir);
  if (sameDirStrong.length === 1) {
    return sameDirStrong[0];
  }

  const sameTopStrong = containsRanked.filter((x) => topDir(x) === srcTop);
  if (sameTopStrong.length === 1) {
    return sameTopStrong[0];
  }

  return null;
}

function resolveDirectMappedTarget(target, index) {
  const mappedBase = DIRECT_WIKI_MAP.get(normalizeTitle(target));
  if (!mappedBase) {
    return null;
  }
  const hits = index.byBase.get(mappedBase) || [];
  if (hits.length === 1) {
    return hits[0];
  }
  return null;
}

function looksLikeRootPrefixedPath(target) {
  const t = toPosix(target.replace(/\\/g, '/'));
  return ROOT_PREFIX_DIRS.some((x) => t === x || t.startsWith(`${x}/`));
}

function rankCandidates(candidates, sourceRel) {
  if (candidates.length === 0) {
    return [];
  }

  const srcTop = topDir(sourceRel);
  const srcDir = path.posix.dirname(sourceRel);
  const uniq = [...new Set(candidates)];

  const sameDir = uniq.filter((x) => path.posix.dirname(x) === srcDir);
  if (sameDir.length > 0) {
    return sameDir;
  }

  const sameTop = uniq.filter((x) => topDir(x) === srcTop);
  if (sameTop.length > 0) {
    return sameTop;
  }

  return uniq;
}

function summarizeBroken(broken) {
  const summary = {
    total: broken.length,
    placeholder_total: 0,
    actionable_total: 0,
    by_type: {},
    by_top_dir: {},
    top_targets: [],
  };

  const targetCount = new Map();
  for (const item of broken) {
    if (item.placeholder) {
      summary.placeholder_total += 1;
    } else {
      summary.actionable_total += 1;
    }

    summary.by_type[item.type] = (summary.by_type[item.type] || 0) + 1;
    const top = topDir(item.source || '');
    summary.by_top_dir[top] = (summary.by_top_dir[top] || 0) + 1;

    const key = `${item.type}:${item.target}`;
    targetCount.set(key, (targetCount.get(key) || 0) + 1);
  }

  summary.top_targets = [...targetCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([key, count]) => ({ key, count }));

  return summary;
}

async function collectBrokenLinks() {
  const mdFiles = await scanAllMarkdown();
  const index = buildMdIndex(mdFiles);
  const broken = [];

  for (const rel of mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const text = await fs.readFile(abs, 'utf8');
    const scanText = stripCodeForLinkScan(text);

    for (const [, inner] of scanText.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const target = inner.split('|')[0].split('#')[0].trim();
      if (!target) {
        continue;
      }

      const resolved = resolveWikiTarget(rel, target, index);
      if (resolved) {
        continue;
      }

      const pathLike = target.includes('/') || target.includes('\\') || target.startsWith('.');
      if (pathLike) {
        const ext = path.posix.extname(toPosix(target)).toLowerCase();
        if (ext && ext !== '.md') {
          const relCandidate = path.posix.normalize(path.posix.join(path.posix.dirname(rel), toPosix(target)));
          const rootCandidate = path.posix.normalize(toPosix(target).replace(/^\.\//, ''));
          const existsRel = await pathExists(path.join(ROOT, toNative(relCandidate)));
          const existsRoot = await pathExists(path.join(ROOT, toNative(rootCandidate)));
          if (!existsRel && !existsRoot) {
            broken.push({
              source: rel,
              type: 'wikilink-file',
              target,
              placeholder: false,
            });
          }
          continue;
        }
      }

      broken.push({
        source: rel,
        type: 'wikilink',
        target,
        placeholder: isPlaceholderTarget(target),
      });
    }

    for (const [, raw] of scanText.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (isExternalUrl(raw) || raw.startsWith('#')) {
        continue;
      }
      const [targetRaw] = raw.split('#');
      let target = targetRaw.trim();
      try {
        target = decodeURIComponent(target);
      } catch {
        target = targetRaw.trim();
      }
      if (!target) {
        continue;
      }

      const targetPosix = toPosix(target.replace(/\\/g, '/'));
      const ext = path.posix.extname(targetPosix).toLowerCase();
      if (ext && ext !== '.md') {
        const relCandidate = path.posix.normalize(path.posix.join(path.posix.dirname(rel), targetPosix));
        const rootCandidate = path.posix.normalize(targetPosix.replace(/^\.\//, ''));
        const existsRel = await pathExists(path.join(ROOT, toNative(relCandidate)));
        const existsRoot = await pathExists(path.join(ROOT, toNative(rootCandidate)));
        if (!existsRel && !existsRoot) {
          broken.push({
            source: rel,
            type: 'markdown-file',
            target: raw,
            placeholder: false,
          });
        }
        continue;
      }

      if (target.startsWith('/')) {
        broken.push({
          source: rel,
          type: 'markdown',
          target: raw,
          placeholder: true,
        });
        continue;
      }
      const resolved = resolveMarkdownTarget(rel, target, index);
      if (!resolved) {
        broken.push({
          source: rel,
          type: 'markdown',
          target: raw,
          placeholder: false,
        });
      }
    }
  }

  return { mdFiles, broken };
}

function isPlaceholderTarget(target) {
  const t = (target || '').trim();
  if (!t) {
    return true;
  }
  if (/^\d+$/.test(t)) {
    return true;
  }
  if (/^[\^#]+$/.test(t)) {
    return true;
  }
  if (/^(链接|链接\d+|link|todo|tbd|xxx)$/i.test(t)) {
    return true;
  }
  if (/[{}]/.test(t)) {
    return true;
  }
  if (/^[A-Za-z]+:[^/]/.test(t)) {
    return true;
  }
  return false;
}

function topDir(rel) {
  return toPosix(rel).split('/')[0] || '(root)';
}

function stripLeadingNumber(s) {
  return s.replace(/^\d+/, '');
}

function stripCommonPrefixes(s) {
  return s
    .replace(/^aicoding|^aiprogramming|^ai编程能力/, '')
    .replace(/^个人投资/, '')
    .replace(/^社会心理观察/, '')
    .replace(/^资源/, '')
    .replace(/^项目/, '');
}

function normalizeTitle(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[《》【】\[\]（）()]/g, '')
    .replace(/[\s\-_.，。！？!?,、:：;；"'`~@#$%^&+=]/g, '')
    .replace(/%/g, '');
}

function resolveWikiTarget(sourceRel, target, index) {
  const normalized = toPosix(target.replace(/\\/g, '/'));

  if (normalized.includes('/')) {
    const relCandidate = path.posix.normalize(path.posix.join(path.posix.dirname(sourceRel), normalized));
    if (index.byPath.has(relCandidate)) {
      return relCandidate;
    }
    if (!relCandidate.toLowerCase().endsWith('.md') && index.byPath.has(`${relCandidate}.md`)) {
      return `${relCandidate}.md`;
    }

    const rootCandidate = path.posix.normalize(normalized.replace(/^\.\//, ''));
    if (index.byPath.has(rootCandidate)) {
      return rootCandidate;
    }
    if (!rootCandidate.toLowerCase().endsWith('.md') && index.byPath.has(`${rootCandidate}.md`)) {
      return `${rootCandidate}.md`;
    }
  }

  if (normalized.toLowerCase().endsWith('.md')) {
    const sameDir = path.posix.normalize(path.posix.join(path.posix.dirname(sourceRel), normalized));
    if (index.byPath.has(sameDir)) {
      return sameDir;
    }
  }

  const byBase = index.byBase.get(path.posix.basename(normalized, '.md')) ?? [];
  if (byBase.length === 1) {
    return byBase[0];
  }

  const sameDirNoExt = path.posix.normalize(path.posix.join(path.posix.dirname(sourceRel), `${normalized}.md`));
  if (index.byPath.has(sameDirNoExt)) {
    return sameDirNoExt;
  }

  return null;
}

function resolveMarkdownTarget(sourceRel, target, index) {
  const normalized = toPosix(target.replace(/\\/g, '/'));
  const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(sourceRel), normalized));
  if (index.byPath.has(candidate)) {
    return candidate;
  }
  if (!candidate.toLowerCase().endsWith('.md') && index.byPath.has(`${candidate}.md`)) {
    return `${candidate}.md`;
  }
  return null;
}

function buildMdIndex(files) {
  const byPath = new Set(files);
  const byBase = new Map();
  const byNorm = new Map();

  for (const rel of files) {
    const base = path.posix.basename(rel, '.md');
    if (!byBase.has(base)) {
      byBase.set(base, []);
    }
    byBase.get(base).push(rel);

    const norm = normalizeTitle(base);
    if (!byNorm.has(norm)) {
      byNorm.set(norm, []);
    }
    byNorm.get(norm).push(rel);
  }

  return { mdFiles: files, byPath, byBase, byNorm };
}

async function scanAllMarkdown() {
  const files = await walkFiles(ROOT);
  return files
    .map((abs) => toPosix(path.relative(ROOT, abs)))
    .filter((rel) => rel.toLowerCase().endsWith('.md'))
    .filter((rel) => !rel.startsWith('.git/'))
    .filter((rel) => !rel.startsWith('.obsidian/'))
    .filter((rel) => !rel.startsWith('.space/'))
    .filter((rel) => !rel.startsWith('.trash/'))
    .sort();
}

async function walkFiles(startPath) {
  const out = [];
  const stack = [startPath];
  while (stack.length > 0) {
    const current = stack.pop();
    const st = await fs.stat(current);
    if (st.isDirectory()) {
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile()) {
          out.push(full);
        }
      }
    } else if (st.isFile()) {
      out.push(current);
    }
  }
  return out;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJsonl(filePath, rows) {
  const lines = rows.map((x) => JSON.stringify(x));
  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function isExternalUrl(url) {
  return /^(https?:|mailto:|obsidian:|data:|tel:)/i.test(url);
}

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function toNative(p) {
  return p.replace(/\//g, path.sep);
}

function stripCodeForLinkScan(text) {
  return (text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ');
}

const PATH_EXISTS_CACHE = new Map();
function requirePathExistsCache(absPath) {
  if (PATH_EXISTS_CACHE.has(absPath)) {
    return PATH_EXISTS_CACHE.get(absPath);
  }
  const ok = fsSync.existsSync(absPath);
  PATH_EXISTS_CACHE.set(absPath, ok);
  return ok;
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
