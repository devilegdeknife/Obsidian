#!/usr/bin/env node

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, '.agent', 'outputs');
const REPORT_FILE = path.join(OUTPUT_DIR, 'para-archives-link-cleanup-2026-report.json');

async function main() {
  await ensureDir(OUTPUT_DIR);

  const mdFiles = await scanAllMarkdown();
  const index = buildMdIndex(mdFiles);
  const archiveFiles = mdFiles.filter((x) => x.startsWith('4-Archives/'));

  let touchedFiles = 0;
  let rewiredMarkdown = 0;
  let rewiredWikilink = 0;
  let downgradedMarkdown = 0;
  let downgradedWikilink = 0;
  let fixedWikiUrlCombo = 0;

  for (const rel of archiveFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const original = await fs.readFile(abs, 'utf8');
    let text = original;

    // Convert [[x]](https://...) to [x](https://...) so these are plain reference links.
    text = text.replace(/\[\[([^\]]+)\]\]\((https?:[^)]+)\)/gi, (_full, label, url) => {
      fixedWikiUrlCombo += 1;
      return `[${label}](${url})`;
    });

    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, url) => {
      if (isExternalUrl(url) || url.startsWith('#')) {
        return full;
      }

      const parsed = parseMdTarget(url);
      if (!parsed.pathToken) {
        return full;
      }
      const targetPath = parsed.pathToken;

      const resolved = resolveMarkdownTarget(rel, targetPath, index);
      if (resolved) {
        return full;
      }

      // docsify-export: remap legacy zh-cn chapter paths to current 3-Resources files.
      if (rel.startsWith('4-Archives/docsify-export/') && targetPath.startsWith('zh-cn/')) {
        const mapped = mapZhCnTarget(targetPath, index);
        if (mapped) {
          let next = toPosix(path.posix.relative(path.posix.dirname(rel), mapped));
          if (!next.startsWith('.')) {
            next = `./${next}`;
          }
          rewiredMarkdown += 1;
          return `[${label}](${next}${parsed.anchor ? `#${parsed.anchor}` : ''})`;
        }
      }

      // docsify-export: fix root-prefixed old paths like ../../4-Archives/attachments/...
      const rooted = tryRootSegmentRemap(rel, targetPath);
      if (rooted) {
        rewiredMarkdown += 1;
        return `[${label}](${rooted}${parsed.anchor ? `#${parsed.anchor}` : ''}${parsed.titlePart})`;
      }

      // Unresolvable internal markdown link: keep text, drop dead link.
      if (looksInternalPath(targetPath)) {
        downgradedMarkdown += 1;
        return label || targetPath;
      }

      return full;
    });

    text = text.replace(/(!?)\[\[([^\]]+)\]\]/g, (full, bang, inner) => {
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

      const mappedDirect = mapDirectArchiveTerm(target, index);
      if (mappedDirect) {
        const base = path.posix.basename(mappedDirect, '.md');
        if (base && base !== target) {
          rewiredWikilink += 1;
          return `${bang}[[${base}${heading ? `#${heading}` : ''}${alias ? `|${alias}` : ''}]]`;
        }
      }

      const candidate = findBestCandidate(rel, target, index);
      if (candidate) {
        const base = path.posix.basename(candidate, '.md');
        if (base && base !== target) {
          rewiredWikilink += 1;
          return `${bang}[[${base}${heading ? `#${heading}` : ''}${alias ? `|${alias}` : ''}]]`;
        }
      }

      // Unresolvable wikilink in archive: preserve visible words, remove dead link.
      downgradedWikilink += 1;
      const visible = alias.trim() || target;
      return visible;
    });

    if (text !== original) {
      await fs.writeFile(abs, text, 'utf8');
      touchedFiles += 1;
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    touched_files: touchedFiles,
    fixed_wiki_url_combo: fixedWikiUrlCombo,
    rewired_markdown: rewiredMarkdown,
    rewired_wikilink: rewiredWikilink,
    downgraded_markdown: downgradedMarkdown,
    downgraded_wikilink: downgradedWikilink,
  };
  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log(`touched_files=${touchedFiles}`);
  console.log(`fixed_wiki_url_combo=${fixedWikiUrlCombo}`);
  console.log(`rewired_markdown=${rewiredMarkdown}`);
  console.log(`rewired_wikilink=${rewiredWikilink}`);
  console.log(`downgraded_markdown=${downgradedMarkdown}`);
  console.log(`downgraded_wikilink=${downgradedWikilink}`);
}

function mapZhCnTarget(targetPath, index) {
  const normalized = toPosix(targetPath.replace(/\\/g, '/'));
  const base = path.posix.basename(normalized, '.md');
  const baseLower = base.toLowerCase();

  if (baseLower === 'foreword') {
    return singleByBase(index, '资源-Foreword');
  }
  if (baseLower === 'preface') {
    return singleByBase(index, '资源-Preface');
  }
  if (baseLower === 'afterword') {
    return singleByBase(index, '资源-Afterword');
  }

  const m = base.match(/^Chapter-(\d+)_/i);
  if (!m) {
    return null;
  }

  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 50) {
    return null;
  }

  const chapterPrefix = new RegExp(`^资源-Chapter-${n}(?:-|$)`, 'i');
  const candidates = index.mdFiles.filter((rel) => {
    const b = path.posix.basename(rel, '.md');
    if (!chapterPrefix.test(b)) {
      return false;
    }
    return rel.startsWith('3-Resources/');
  });

  if (candidates.length === 1) {
    return candidates[0];
  }

  const books = candidates.filter((x) => x.startsWith('3-Resources/02_books/'));
  if (books.length === 1) {
    return books[0];
  }

  return null;
}

function mapDirectArchiveTerm(target, index) {
  const norm = normalizeTitle(target);
  const direct = new Map([
    ['共依附关系', '资源-共依附关系'],
    ['原子化个体', '资源-原子化个体'],
    ['叙事粘性', '资源-叙事粘性'],
    ['契约性受难', '资源-契约性受难'],
    ['承认欲望', '资源-承认欲望'],
    ['存在性自尊', '资源-存在性自尊'],
    ['変動比例強化', '资源-変動比例強化'],
    ['变动比例强化', '资源-变动比例强化'],
  ]);

  for (const [k, v] of direct.entries()) {
    if (norm === normalizeTitle(k)) {
      return singleByBase(index, v);
    }
  }
  return null;
}

function findBestCandidate(sourceRel, target, index) {
  if (!target) {
    return null;
  }
  if (target.includes('/') || target.includes('\\')) {
    return null;
  }
  if (isPlaceholderTarget(target)) {
    return null;
  }

  const targetNorm = normalizeTitle(target);
  if (!targetNorm) {
    return null;
  }

  const exact = index.byNorm.get(targetNorm) || [];
  if (exact.length === 1) {
    return exact[0];
  }

  const core = stripCommonPrefixes(stripLeadingNumber(targetNorm));
  if (!core) {
    return null;
  }

  const srcTop = topDir(sourceRel);
  const matches = index.mdFiles.filter((rel) => {
    const baseNorm = normalizeTitle(path.posix.basename(rel, '.md'));
    return baseNorm.includes(core);
  });

  if (matches.length === 1) {
    return matches[0];
  }

  const sameTop = matches.filter((x) => topDir(x) === srcTop);
  if (sameTop.length === 1) {
    return sameTop[0];
  }

  const resources = matches.filter((x) => x.startsWith('3-Resources/'));
  if (resources.length === 1) {
    return resources[0];
  }

  return null;
}

function tryRootSegmentRemap(sourceRel, targetPath) {
  const t = toPosix(targetPath.replace(/\\/g, '/'));
  const marker = '/4-Archives/';
  const idx = t.indexOf(marker);
  if (idx < 0) {
    return '';
  }

  const rooted = t.slice(idx + 1); // keep "4-Archives/..."
  const rootedAbs = path.join(ROOT, toNative(rooted));
  if (!existsSync(rootedAbs)) {
    return '';
  }

  let relTarget = toPosix(path.posix.relative(path.posix.dirname(sourceRel), rooted));
  if (!relTarget.startsWith('.')) {
    relTarget = `./${relTarget}`;
  }
  return relTarget;
}

function parseMdTarget(rawUrl) {
  const [pathAndTitle, anchor = ''] = rawUrl.split('#');
  let token = pathAndTitle.trim();
  let titlePart = '';

  // docsify style: path 'title'
  const m = token.match(/^(\S+)(\s+['"][\s\S]*['"])$/);
  if (m) {
    token = m[1];
    titlePart = m[2];
  }

  token = token.replace(/^<|>$/g, '');
  return { pathToken: token, anchor, titlePart };
}

function looksInternalPath(targetPath) {
  if (!targetPath) {
    return false;
  }
  const t = targetPath.trim();
  if (isExternalUrl(t)) {
    return false;
  }
  if (t.startsWith('#')) {
    return false;
  }
  return true;
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

  const rootCandidate = path.posix.normalize(normalized.replace(/^\.\//, ''));
  if (index.byPath.has(rootCandidate)) {
    return rootCandidate;
  }
  if (!rootCandidate.toLowerCase().endsWith('.md') && index.byPath.has(`${rootCandidate}.md`)) {
    return `${rootCandidate}.md`;
  }

  const abs = path.join(ROOT, toNative(candidate));
  if (existsSync(abs)) {
    return candidate;
  }
  return null;
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

function singleByBase(index, base) {
  const hit = index.byBase.get(base) || [];
  if (hit.length === 1) {
    return hit[0];
  }
  return null;
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

function normalizeTitle(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[《》【】\[\]（）()]/g, '')
    .replace(/[\s\-_.，。！？!?,、:：;；"'`~@#$%^&+=]/g, '')
    .replace(/%/g, '');
}

function stripLeadingNumber(s) {
  return s.replace(/^\d+/, '');
}

function stripCommonPrefixes(s) {
  return s
    .replace(/^资源/, '')
    .replace(/^项目/, '')
    .replace(/^aicoding|^aiprogramming|^ai编程能力/, '')
    .replace(/^个人投资/, '')
    .replace(/^社会心理观察/, '');
}

function topDir(rel) {
  return toPosix(rel).split('/')[0] || '(root)';
}

function isExternalUrl(url) {
  return /^(https?:|mailto:|obsidian:|data:|tel:)/i.test(url);
}

function existsSync(abs) {
  try {
    return fsSync.existsSync(abs);
  } catch {
    return false;
  }
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

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function toNative(p) {
  return p.replace(/\//g, path.sep);
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
