#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, '.agent', 'outputs');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'para-rename-2026-manifest.jsonl');
const REPORT_FILE = path.join(OUTPUT_DIR, 'para-rename-2026-report.json');

const TOP_DIR_MAP = new Map([
  ['01_Project', '1-Projects'],
  ['02_Areas', '2-Areas'],
  ['03_Resource', '3-Resources'],
  ['04_Archives', '4-Archives'],
]);

const AREA_MOC_CANONICAL = new Map([
  ['AI编程能力', '01-MOC-AI编程能力'],
  ['个人投资', '02-MOC-个人投资'],
  ['社会心理观察', '03-MOC-社会心理观察'],
]);

const AREA_DOMAIN_PREFIXES = ['AI编程能力', '个人投资', '社会心理观察'];

const AREA_AI_KEYWORDS = [
  'codex',
  'claude',
  'mcp',
  'jira',
  'git',
  'github',
  'gitlab',
  'execplan',
  'rust',
  'linux',
  'python',
  'transformer',
  'gemini',
  'trellis',
  'ai',
  '编程',
  '计算机',
  '网络工程师',
  '软件',
  '学习路线',
];

const AREA_INVEST_KEYWORDS = [
  '投资',
  '理财',
  'a股',
  '铜',
  '定投',
  '债务',
  '金融',
  '万科',
  '罗杰斯',
];

const PROJECT_BASE_MAP = new Map([
  ['processing-log', 'Inbox处理日志'],
  ['summary-report', 'Inbox处理摘要'],
  ['tag-index', 'Inbox标签索引'],
  ['phase3-manual-review', '阶段三人工复核'],
]);

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = process.argv.includes('--dry-run') || !apply;

  await ensureDir(OUTPUT_DIR);

  const topOps = await collectTopDirOps();
  if (apply) {
    await applyTopDirOps(topOps);
    await rewriteTopDirLinks(TOP_DIR_MAP);
  }

  const mdFiles = await scanAllMarkdown();
  const usedTargets = new Set(mdFiles.map((rel) => remapTopDirPrefix(rel)));
  const ops = [];

  for (const rel of mdFiles) {
    const virtualRel = remapTopDirPrefix(rel);
    if (!isRenameScope(virtualRel)) {
      continue;
    }

    const ext = path.posix.extname(virtualRel).toLowerCase();
    if (ext !== '.md') {
      continue;
    }

    const dir = path.posix.dirname(virtualRel);
    const base = path.posix.basename(virtualRel, ext);
    const normalizedBase = normalizeBaseByScope(virtualRel, base);
    const finalBase = ensureFileNameShape(normalizedBase, 50) || '未命名';

    if (finalBase === base) {
      continue;
    }

    const dstRel = uniqueTargetPath(dir, `${finalBase}${ext}`, usedTargets, virtualRel);
    usedTargets.add(dstRel);

    ops.push({
      src_path: rel,
      dst_path: dstRel,
      scope: scopeLabel(virtualRel),
    });
  }

  await writeJsonl(MANIFEST_FILE, ops);

  const report = {
    generated_at: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'apply',
    top_ops: topOps,
    stats: {
      total_md_scanned: mdFiles.length,
      rename_ops: ops.length,
      areas_ops: ops.filter((x) => x.scope === 'areas').length,
      resources_ops: ops.filter((x) => x.scope === 'resources').length,
      projects_ops: ops.filter((x) => x.scope === 'projects').length,
    },
  };

  if (apply) {
    await applyMoveOperations(ops.map((x) => ({ src_path: x.src_path, dst_path: x.dst_path })), 'rename2026');
    await rewriteTopDirLinks(TOP_DIR_MAP);
    report.verify = await runVerify();
  }

  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  const lines = [
    `mode=${dryRun ? 'dry-run' : 'apply'}`,
    `top_rename_ops=${topOps.length}`,
    `file_rename_ops=${ops.length}`,
    `areas_ops=${report.stats.areas_ops}`,
    `resources_ops=${report.stats.resources_ops}`,
    `projects_ops=${report.stats.projects_ops}`,
  ];
  if (report.verify) {
    lines.push(`naming_violations=${report.verify.naming_violations}`);
    lines.push(`broken_links=${report.verify.broken_links}`);
  }
  console.log(lines.join('\n'));
}

async function collectTopDirOps() {
  const ops = [];
  for (const [from, to] of TOP_DIR_MAP.entries()) {
    const fromAbs = path.join(ROOT, toNative(from));
    const toAbs = path.join(ROOT, toNative(to));
    const fromExists = await pathExists(fromAbs);
    const toExists = await pathExists(toAbs);
    if (!fromExists) {
      continue;
    }
    if (toExists) {
      throw new Error(`Top-level target already exists, cannot rename: ${from} -> ${to}`);
    }
    ops.push({ from, to });
  }
  return ops;
}

async function applyTopDirOps(ops) {
  for (const op of ops) {
    const fromAbs = path.join(ROOT, toNative(op.from));
    const toAbs = path.join(ROOT, toNative(op.to));
    await fs.rename(fromAbs, toAbs);
  }
}

function remapTopDirPrefix(rel) {
  for (const [from, to] of TOP_DIR_MAP.entries()) {
    if (rel === from) {
      return to;
    }
    if (rel.startsWith(`${from}/`)) {
      return `${to}${rel.slice(from.length)}`;
    }
  }
  return rel;
}

function isRenameScope(rel) {
  return rel.startsWith('1-Projects/') || rel.startsWith('2-Areas/') || rel.startsWith('3-Resources/');
}

function scopeLabel(rel) {
  if (rel.startsWith('2-Areas/')) {
    return 'areas';
  }
  if (rel.startsWith('3-Resources/')) {
    return 'resources';
  }
  return 'projects';
}

function normalizeBaseByScope(rel, base) {
  if (rel.startsWith('2-Areas/')) {
    return normalizeAreaBase(base);
  }
  if (rel.startsWith('3-Resources/')) {
    return normalizeResourceBase(base);
  }
  if (rel.startsWith('1-Projects/')) {
    return normalizeProjectBase(base);
  }
  return base;
}

function normalizeAreaBase(base) {
  if (AREA_MOC_CANONICAL.has(base)) {
    return AREA_MOC_CANONICAL.get(base);
  }

  const m = base.match(/^(?:0[1-9]-)?MOC-(.+)$/);
  if (m) {
    const topic = sanitizeTopic(m[1], { removeLeadingMarkers: true });
    const canonical = AREA_MOC_CANONICAL.get(topic);
    if (canonical) {
      return canonical;
    }

    const domain = inferAreaDomain(topic);
    return withDomainPrefix(domain, topic || '索引');
  }

  const core = sanitizeTopic(base, { removeLeadingMarkers: true });
  const domain = inferAreaDomain(`${base} ${core}`);
  return withDomainPrefix(domain, core || '主题');
}

function normalizeResourceBase(base) {
  if (base === 'MOC-资源总索引') {
    return base;
  }
  const core = sanitizeTopic(base, { removeLeadingMarkers: true });
  return withDomainPrefix('资源', core || '主题');
}

function normalizeProjectBase(base) {
  const mapped = PROJECT_BASE_MAP.get(base.toLowerCase());
  if (mapped) {
    return withDomainPrefix('项目', mapped);
  }
  const core = sanitizeTopic(base, { removeLeadingMarkers: true });
  return withDomainPrefix('项目', core || '文档');
}

function withDomainPrefix(prefix, coreRaw) {
  let core = coreRaw || '';

  for (const p of ['资源', '项目', ...AREA_DOMAIN_PREFIXES]) {
    if (core.startsWith(`${p}-`)) {
      core = core.slice(p.length + 1);
      break;
    }
  }

  core = core.replace(/^MOC-/, '').replace(/^0[1-9]-/, '');
  core = core.replace(/^目录-/, '');
  core = core.replace(/^-+|-+$/g, '');

  const maxLen = Math.max(8, 50 - prefix.length - 1);
  core = trimToLength(core, maxLen);
  core = core.replace(/^-+|-+$/g, '');

  return `${prefix}-${core || '主题'}`;
}

function inferAreaDomain(textRaw) {
  const text = (textRaw || '').toLowerCase();
  if (containsAny(text, AREA_INVEST_KEYWORDS)) {
    return '个人投资';
  }
  if (containsAny(text, AREA_AI_KEYWORDS)) {
    return 'AI编程能力';
  }
  return '社会心理观察';
}

function sanitizeTopic(raw, options = {}) {
  let text = raw.normalize('NFKC');

  text = text.replace(/（[^）]*[A-Za-z][^）]*）/g, '');
  text = text.replace(/\([^)]*[A-Za-z][^)]*\)/g, '');

  text = text.replace(/^((?:19|20)\d{2})年\d{1,2}月\d{1,2}日/, '$1');
  text = text.replace(/^((?:19|20)\d{2})[-_/]\d{1,2}[-_/]\d{1,2}/, '$1');

  text = text.replace(/-[^-]{1,24}-(?:19|20)\d{2}(?:[-_年]\d{1,2}){0,2}(?:日)?(?:-\d{1,2})?$/g, '');
  text = text.replace(/-(?:19|20)\d{2}(?:[-_年]\d{1,2}){0,2}(?:日)?(?:-\d{1,2})?$/g, '');
  text = text.replace(/-\d{8}$/g, '');
  text = text.replace(/\b\d{8}\b/g, '');

  text = text.replace(/-(知乎|zhihu|x帖子|X帖子|inbox|摘录|转载|转发|resource|unknown|source)$/gi, '');

  const replacements = new Map([
    ['，', '-'],
    ['。', '-'],
    ['：', '-'],
    ['；', '-'],
    ['？', '-'],
    ['！', '-'],
    ['“', ''],
    ['”', ''],
    ['‘', ''],
    ['’', ''],
    ['、', '-'],
    ['／', '-'],
    ['\\', '-'],
    ['　', ' '],
    ['《', ''],
    ['》', ''],
    ['【', ''],
    ['】', ''],
    ['（', '-'],
    ['）', '-'],
    ['—', '-'],
    ['–', '-'],
    ['‒', '-'],
    ['﹣', '-'],
  ]);

  for (const [from, to] of replacements.entries()) {
    text = text.split(from).join(to);
  }

  text = text.replace(/[<>:"|?*\x00-\x1F]/g, '-');
  text = text.replace(/[!?,.;"'`~@#$%^&+=]+/g, '-');
  text = text.replace(/[_\s]+/g, '-');
  text = text.replace(/-+/g, '-');
  text = text.replace(/^\d{2}-/, '');
  text = text.replace(/^0[1-9]-MOC-/, '');

  if (options.removeLeadingMarkers) {
    text = text.replace(/^(?:资源|项目|AI编程能力|个人投资|社会心理观察)-/, '');
    text = text.replace(/^MOC-/, '');
    text = text.replace(/^目录-/, '');
  }

  text = text.replace(/^-+|-+$/g, '');
  text = trimToLength(text, 80);
  text = text.replace(/^-+|-+$/g, '');

  return text;
}

function ensureFileNameShape(base, maxLen) {
  let out = (base || '').trim();
  out = out.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
  out = out.replace(/[\s_]+/g, '-');
  out = out.replace(/-+/g, '-');
  out = out.replace(/^-+|-+$/g, '');
  out = trimToLength(out, maxLen);
  out = out.replace(/^-+|-+$/g, '');
  return out;
}

function trimToLength(s, maxLen) {
  if (!s || s.length <= maxLen) {
    return s;
  }
  return s.slice(0, maxLen).replace(/-+$/g, '');
}

function containsAny(text, words) {
  return words.some((w) => text.includes(w.toLowerCase()));
}

async function applyMoveOperations(ops, phaseLabel) {
  if (ops.length === 0) {
    return;
  }

  const preMdFiles = await scanAllMarkdown();
  const preIndex = buildMdIndex(preMdFiles);
  const changedMdMap = new Map();
  const tempOps = [];

  for (let i = 0; i < ops.length; i += 1) {
    const op = ops[i];
    const srcAbs = path.join(ROOT, toNative(op.src_path));
    const dstAbs = path.join(ROOT, toNative(op.dst_path));
    if (!(await pathExists(srcAbs))) {
      continue;
    }

    await ensureDir(path.dirname(dstAbs));
    const tempRel = `${op.src_path}.__tmp_${phaseLabel}_${i}`;
    const tempAbs = path.join(ROOT, toNative(tempRel));
    await ensureDir(path.dirname(tempAbs));
    await fs.rename(srcAbs, tempAbs);

    tempOps.push({ ...op, temp_path: tempRel });

    if (op.src_path.toLowerCase().endsWith('.md') && op.dst_path.toLowerCase().endsWith('.md')) {
      changedMdMap.set(op.src_path, op.dst_path);
    }
  }

  for (const op of tempOps) {
    const tempAbs = path.join(ROOT, toNative(op.temp_path));
    const dstAbs = path.join(ROOT, toNative(op.dst_path));
    await ensureDir(path.dirname(dstAbs));
    await fs.rename(tempAbs, dstAbs);
  }

  if (changedMdMap.size > 0) {
    await rewriteMarkdownLinks(preIndex, changedMdMap);
  }
}

async function rewriteMarkdownLinks(preIndex, changedMap) {
  const mdFiles = await scanAllMarkdown();
  const updates = [];

  for (const rel of mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const original = await fs.readFile(abs, 'utf8');
    let content = original;
    content = rewriteWikilinks(content, rel, preIndex, changedMap);
    content = rewriteMarkdownLinksInText(content, rel, preIndex, changedMap);
    if (content !== original) {
      updates.push({ rel, content });
    }
  }

  for (const item of updates) {
    await fs.writeFile(path.join(ROOT, toNative(item.rel)), item.content, 'utf8');
  }
}

function rewriteWikilinks(text, sourceRel, preIndex, changedMap) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (full, inner) => {
    const [targetAndHeading, alias = ''] = inner.split('|');
    const [targetRaw, heading = ''] = targetAndHeading.split('#');
    const target = targetRaw.trim();
    if (!target) {
      return full;
    }

    const resolved = resolveWikiTarget(sourceRel, target, preIndex);
    if (!resolved) {
      return full;
    }

    const mapped = changedMap.get(resolved);
    if (!mapped) {
      return full;
    }

    const hasPath = /\//.test(target);
    const hasExt = target.toLowerCase().endsWith('.md');
    let nextTarget = target;

    if (hasPath || hasExt) {
      let relTarget = toPosix(path.posix.relative(path.posix.dirname(sourceRel), mapped));
      if (!relTarget.startsWith('.')) {
        relTarget = `./${relTarget}`;
      }
      nextTarget = hasExt ? relTarget : relTarget.replace(/\.md$/i, '');
    } else {
      const oldBase = path.posix.basename(resolved, '.md');
      const newBase = path.posix.basename(mapped, '.md');
      if (oldBase !== newBase) {
        nextTarget = newBase;
      }
    }

    const rebuilt = `${nextTarget}${heading ? `#${heading}` : ''}${alias ? `|${alias}` : ''}`;
    return `[[${rebuilt}]]`;
  });
}

function rewriteMarkdownLinksInText(text, sourceRel, preIndex, changedMap) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, url) => {
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

    const resolved = resolveMarkdownTarget(sourceRel, target, preIndex);
    if (!resolved) {
      return full;
    }

    const mapped = changedMap.get(resolved);
    if (!mapped) {
      return full;
    }

    let relTarget = toPosix(path.posix.relative(path.posix.dirname(sourceRel), mapped));
    if (!relTarget.startsWith('.')) {
      relTarget = `./${relTarget}`;
    }

    return `[${label}](${relTarget}${anchor ? `#${anchor}` : ''})`;
  });
}

async function rewriteTopDirLinks(dirMap) {
  const mdFiles = await scanAllMarkdown();
  const updates = [];

  for (const rel of mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const original = await fs.readFile(abs, 'utf8');
    let next = original;

    next = next.replace(/\[\[([^\]]+)\]\]/g, (full, inner) => {
      const [targetAndHeading, alias = ''] = inner.split('|');
      const [targetRaw, heading = ''] = targetAndHeading.split('#');
      const remapped = remapPathSegments(targetRaw.trim(), dirMap);
      if (!remapped || remapped === targetRaw.trim()) {
        return full;
      }
      return `[[${remapped}${heading ? `#${heading}` : ''}${alias ? `|${alias}` : ''}]]`;
    });

    next = next.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, url) => {
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
      const remapped = remapPathSegments(target, dirMap);
      if (!remapped || remapped === target) {
        return full;
      }
      return `[${label}](${remapped}${anchor ? `#${anchor}` : ''})`;
    });

    if (next !== original) {
      updates.push({ rel, content: next });
    }
  }

  for (const item of updates) {
    await fs.writeFile(path.join(ROOT, toNative(item.rel)), item.content, 'utf8');
  }
}

function remapPathSegments(pathLike, dirMap) {
  if (!pathLike) {
    return pathLike;
  }
  const normalized = toPosix(pathLike.replace(/\\/g, '/'));
  if (!normalized.includes('/')) {
    return dirMap.get(normalized) || normalized;
  }

  const parts = normalized.split('/');
  let changed = false;
  for (let i = 0; i < parts.length; i += 1) {
    const mapped = dirMap.get(parts[i]);
    if (mapped) {
      parts[i] = mapped;
      changed = true;
    }
  }

  return changed ? parts.join('/') : normalized;
}

async function runVerify() {
  const namingViolations = await countNamingViolations();
  const broken = await findBrokenLinks();
  return {
    naming_violations: namingViolations,
    broken_links: broken.length,
    broken_samples: broken.slice(0, 50),
  };
}

async function countNamingViolations() {
  const mdFiles = await scanAllMarkdown();
  let bad = 0;

  for (const rel of mdFiles) {
    const base = path.posix.basename(rel, '.md');
    if (rel.startsWith('2-Areas/')) {
      const ok =
        /^0[1-9]-MOC-.+/.test(base) ||
        /^AI编程能力-.+/.test(base) ||
        /^个人投资-.+/.test(base) ||
        /^社会心理观察-.+/.test(base);
      if (!ok) {
        bad += 1;
      }
      continue;
    }

    if (rel.startsWith('3-Resources/')) {
      const ok = base === 'MOC-资源总索引' || /^资源-.+/.test(base);
      if (!ok) {
        bad += 1;
      }
      continue;
    }

    if (rel.startsWith('1-Projects/')) {
      if (!/^项目-.+/.test(base)) {
        bad += 1;
      }
    }
  }

  return bad;
}

async function findBrokenLinks() {
  const mdFiles = await scanAllMarkdown();
  const index = buildMdIndex(mdFiles);
  const broken = [];

  for (const rel of mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const text = await fs.readFile(abs, 'utf8');

    for (const [, inner] of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const target = inner.split('|')[0].split('#')[0].trim();
      if (!target) {
        continue;
      }

      const isPathLike = target.includes('/') || target.startsWith('.') || target.includes('\\');
      const ext = path.posix.extname(toPosix(target)).toLowerCase();

      if (isPathLike && ext && ext !== '.md') {
        const relCandidate = path.posix.normalize(path.posix.join(path.posix.dirname(rel), toPosix(target)));
        const rootCandidate = path.posix.normalize(toPosix(target).replace(/^\.\//, ''));
        const existsRel = await pathExists(path.join(ROOT, toNative(relCandidate)));
        const existsRoot = await pathExists(path.join(ROOT, toNative(rootCandidate)));
        if (!existsRel && !existsRoot) {
          broken.push({ source: rel, type: 'wikilink-file', target });
        }
        continue;
      }

      const resolved = resolveWikiTarget(rel, target, index);
      if (!resolved) {
        broken.push({ source: rel, type: 'wikilink', target });
      }
    }

    for (const [, raw] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
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

      const resolved = await resolveAnyRelativeTarget(rel, target, index);
      if (!resolved) {
        broken.push({ source: rel, type: 'markdown', target: raw });
      }
    }
  }

  return broken;
}

async function resolveAnyRelativeTarget(sourceRel, target, index) {
  const normalized = toPosix(target.replace(/\\/g, '/'));
  const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(sourceRel), normalized));
  if (index.byPath.has(candidate)) {
    return candidate;
  }

  const abs = path.join(ROOT, toNative(candidate));
  return (await pathExists(abs)) ? candidate : null;
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

  for (const rel of files) {
    const base = path.posix.basename(rel, '.md');
    if (!byBase.has(base)) {
      byBase.set(base, []);
    }
    byBase.get(base).push(rel);
  }

  return { byPath, byBase };
}

function uniqueTargetPath(dir, fileName, used, selfPath) {
  const ext = path.posix.extname(fileName);
  const base = path.posix.basename(fileName, ext);
  let candidate = path.posix.join(dir, `${base}${ext}`);

  if (candidate === selfPath) {
    return candidate;
  }

  let i = 2;
  while (used.has(candidate)) {
    candidate = path.posix.join(dir, `${base}-${i}${ext}`);
    i += 1;
  }
  return candidate;
}

async function writeJsonl(file, rows) {
  await ensureDir(path.dirname(file));
  const lines = rows.map((x) => JSON.stringify(x));
  await fs.writeFile(file, `${lines.join('\n')}\n`, 'utf8');
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
  if (!(await pathExists(startPath))) {
    return out;
  }

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

function isExternalUrl(url) {
  return /^(https?:|mailto:|obsidian:|data:|tel:)/i.test(url);
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
