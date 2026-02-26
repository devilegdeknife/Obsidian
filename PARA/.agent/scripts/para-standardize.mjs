#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, '01_Project', 'para_standardization');
const MANIFEST_DIR = path.join(OUTPUT_ROOT, 'manifests');
const LOG_DIR = path.join(OUTPUT_ROOT, 'logs');
const REVIEW_DIR = path.join(OUTPUT_ROOT, 'reviews');

const AREA_DIRS = {
  psych: '02_Areas/01_心理控制机制',
  econ: '02_Areas/02_经济剥削机制',
  gender: '02_Areas/03_性别表演研究',
  methods: '02_Areas/04_方法论与框架',
  cases: '02_Areas/05_案例与素材',
};

const RESOURCE_BUCKETS = {
  articles: '03_Resource/01_articles',
  books: '03_Resource/02_books',
  reports: '03_Resource/03_reports',
  tools: '03_Resource/04_tools',
  references: '03_Resource/05_references',
  snippets: '03_Resource/06_snippets',
};

const PHASES = ['phase2', 'phase3', 'phase4', 'phase5', 'phase6', 'verify'];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'run-all';
  const apply = args.includes('--apply');
  const dryRun = args.includes('--dry-run') || !apply;

  await ensureDir(MANIFEST_DIR);
  await ensureDir(LOG_DIR);
  await ensureDir(REVIEW_DIR);

  if (command === 'run-all') {
    for (const phase of PHASES) {
      if (phase === 'verify') {
        await runPhase(phase, true);
        continue;
      }
      if (dryRun) {
        await runPhase(phase, false);
      }
      if (apply) {
        await runPhase(phase, true);
      }
    }
    if (apply) {
      await runPhase('verify', true);
    }
    return;
  }

  if (!PHASES.includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  if (command === 'verify') {
    await runPhase(command, true);
    return;
  }

  if (dryRun) {
    await runPhase(command, false);
  }
  if (apply) {
    await runPhase(command, true);
  }
}

async function runPhase(phase, apply) {
  switch (phase) {
    case 'phase2':
      await runPhase2(apply);
      break;
    case 'phase3':
      await runPhase3(apply);
      break;
    case 'phase4':
      await runPhase4(apply);
      break;
    case 'phase5':
      await runPhase5(apply);
      break;
    case 'phase6':
      await runPhase6(apply);
      break;
    case 'verify':
      await runVerify();
      break;
    default:
      throw new Error(`Unsupported phase: ${phase}`);
  }
}

async function runPhase2(apply) {
  const scopeRoots = ['00_Inbox', '01_Project', '02_Areas', '03_Resource'];
  const allFiles = [];
  for (const root of scopeRoots) {
    const files = await walkFiles(path.join(ROOT, root));
    for (const absPath of files) {
      const rel = toPosix(path.relative(ROOT, absPath));
      if (rel.startsWith('03_Resource/Templates/')) {
        continue;
      }
      if (path.basename(rel).startsWith('.')) {
        continue;
      }
      const ext = path.extname(rel).toLowerCase();
      if (ext !== '.md' && ext !== '.base') {
        continue;
      }
      allFiles.push(rel);
    }
  }

  const allMdFiles = await scanAllMarkdown();
  const inboundMap = await buildInboundMap(allMdFiles);
  const usedTargets = new Set(allFiles);
  const unnamedSeq = new Map();
  const ops = [];

  for (const rel of allFiles.sort()) {
    const dir = path.posix.dirname(rel);
    const ext = path.posix.extname(rel);
    const base = path.posix.basename(rel, ext);

    let normalized = normalizeBaseName(base);
    const reasons = [];

    if (isUnnamed(base)) {
      const date = await deriveDateForUnnamed(rel);
      const seq = (unnamedSeq.get(date) ?? 0) + 1;
      unnamedSeq.set(date, seq);
      normalized = `待整理-${date}-${String(seq).padStart(2, '0')}`;
      reasons.push('unnamed');
    }

    if (containsFullwidthPunctuation(base)) {
      reasons.push('fullwidth_punct');
    }
    if (/\s/.test(base)) {
      reasons.push('space');
    }
    if (base.length > 120) {
      reasons.push('length');
    }
    if (hasMixedSeparators(base)) {
      reasons.push('mixed_sep');
    }

    if (!normalized) {
      normalized = 'note';
      reasons.push('empty_after_normalize');
    }

    if (normalized === base) {
      continue;
    }

    const dstRel = uniqueTargetPath(dir, normalized + ext, usedTargets, rel);
    usedTargets.add(dstRel);

    const inbound = inboundMap.get(rel) ?? 0;
    const isMoc = /(^|\/)MOC\s*-/.test(rel);
    let risk = 'low';
    if (isMoc) {
      risk = 'high';
    } else if (inbound > 0) {
      risk = 'medium';
    }

    ops.push({
      src_path: rel,
      dst_path: dstRel,
      reason: [...new Set(reasons)].join('|') || 'normalize',
      risk,
      link_update_required: inbound > 0,
      inbound_links: inbound,
    });
  }

  await writeJsonl(path.join(MANIFEST_DIR, 'rename_manifest.jsonl'), ops);

  const lines = [
    `phase=2`,
    `mode=${apply ? 'apply' : 'dry-run'}`,
    `scanned=${allFiles.length}`,
    `planned_renames=${ops.length}`,
    `high=${ops.filter((x) => x.risk === 'high').length}`,
    `medium=${ops.filter((x) => x.risk === 'medium').length}`,
    `low=${ops.filter((x) => x.risk === 'low').length}`,
  ];

  if (apply && ops.length > 0) {
    const sorted = [
      ...ops.filter((x) => x.risk === 'low'),
      ...ops.filter((x) => x.risk === 'medium'),
      ...ops.filter((x) => x.risk === 'high'),
    ];
    await applyMoveOperations(
      sorted.map((x) => ({ src_path: x.src_path, dst_path: x.dst_path })),
      'phase2',
    );
    lines.push(`applied=${sorted.length}`);
  }

  await writeLog('phase2', apply ? 'apply' : 'dryrun', lines.join('\n'));
}

async function runPhase3(apply) {
  const reportPath = await resolveInboxSummaryPath();
  const report = await fs.readFile(path.join(ROOT, toNative(reportPath)), 'utf8');
  const entries = parseSummaryReport(report);
  const inboxResolver = await buildInboxResolver();

  const ops = [];
  const review = [];
  const used = new Set(await scanRelativeFiles());

  for (const entry of entries) {
    if (!entry.file_path || !entry.file_path.startsWith('00_Inbox/')) {
      continue;
    }
    const resolvedSource = await resolveInboxSourcePath(entry.file_path, inboxResolver);
    const abs = path.join(ROOT, toNative(resolvedSource));
    if (!(await pathExists(abs))) {
      review.push({ reason: 'missing_source', ...entry });
      continue;
    }

    const confidence = (entry.confidence || '').toLowerCase();
    const route = routeAreaFromSummary(entry);

    if (confidence !== 'high') {
      review.push({ reason: 'low_confidence', target_dir: route, ...entry });
      continue;
    }

    const fileName = path.posix.basename(entry.file_path);
    const targetDir = route;
    const dstPath = uniqueTargetPath(targetDir, fileName, used, resolvedSource);
    used.add(dstPath);

    ops.push({
      src_path: resolvedSource,
      dst_dir: targetDir,
      dst_path: dstPath,
      basis: 'summary_report',
      confidence,
    });
  }

  await writeJsonl(path.join(MANIFEST_DIR, 'inbox_route_manifest.jsonl'), ops);
  await fs.writeFile(
    path.join(REVIEW_DIR, 'phase3_manual_review.md'),
    formatManualReview(review),
    'utf8',
  );

  const lines = [
    `phase=3`,
    `mode=${apply ? 'apply' : 'dry-run'}`,
    `parsed_entries=${entries.length}`,
    `planned_moves=${ops.length}`,
    `manual_review=${review.length}`,
  ];

  if (apply && ops.length > 0) {
    await applyMoveOperations(
      ops.map((x) => ({ src_path: x.src_path, dst_path: x.dst_path })),
      'phase3',
    );
    lines.push(`applied=${ops.length}`);
  }

  await writeLog('phase3', apply ? 'apply' : 'dryrun', lines.join('\n'));
}

async function resolveInboxSummaryPath() {
  const preferred = [
    '01_Project/00_Inbox_Processing/summary_report.md',
    '01_Project/00_Inbox_Processing/summary-report.md',
  ];
  for (const rel of preferred) {
    const abs = path.join(ROOT, toNative(rel));
    if (await pathExists(abs)) {
      return rel;
    }
  }

  const files = await walkFiles(path.join(ROOT, '01_Project'));
  for (const abs of files) {
    const rel = toPosix(path.relative(ROOT, abs));
    const base = path.posix.basename(rel).toLowerCase();
    if (base === 'summary_report.md' || base === 'summary-report.md') {
      return rel;
    }
  }

  throw new Error('Missing summary report file under 01_Project');
}

async function buildInboxResolver() {
  const files = (await walkFiles(path.join(ROOT, '00_Inbox')))
    .map((x) => toPosix(path.relative(ROOT, x)))
    .filter((x) => x.toLowerCase().endsWith('.md'));
  const byNormalizedTitle = new Map();
  for (const rel of files) {
    const key = normalizeTitle(path.posix.basename(rel, '.md'));
    if (!byNormalizedTitle.has(key)) {
      byNormalizedTitle.set(key, []);
    }
    byNormalizedTitle.get(key).push(rel);
  }
  return { files, byNormalizedTitle };
}

async function resolveInboxSourcePath(sourceRel, resolver) {
  const abs = path.join(ROOT, toNative(sourceRel));
  if (await pathExists(abs)) {
    return sourceRel;
  }

  const dir = path.posix.dirname(sourceRel);
  const ext = path.posix.extname(sourceRel);
  const base = path.posix.basename(sourceRel, ext);

  const normalizedCandidate = path.posix.join(dir, `${normalizeBaseName(base)}${ext}`);
  if (await pathExists(path.join(ROOT, toNative(normalizedCandidate)))) {
    return normalizedCandidate;
  }

  const key = normalizeTitle(base);
  const hit = resolver.byNormalizedTitle.get(key) || [];
  if (hit.length === 1) {
    return hit[0];
  }

  return sourceRel;
}

async function runPhase4(apply) {
  for (const dir of Object.values(RESOURCE_BUCKETS)) {
    if (apply) {
      await ensureDir(path.join(ROOT, toNative(dir)));
    }
  }

  const files = await walkFiles(path.join(ROOT, '03_Resource'));
  const manifest = [];
  const ops = [];
  const used = new Set(await scanRelativeFiles());

  for (const absFile of files) {
    const rel = toPosix(path.relative(ROOT, absFile));
    if (path.basename(rel).startsWith('.')) {
      continue;
    }
    if (rel.startsWith('03_Resource/Templates/')) {
      continue;
    }
    if (isInResourceBucket(rel)) {
      continue;
    }

    const bucket = await classifyResource(rel);
    const dstDir = RESOURCE_BUCKETS[bucket];
    const fileName = path.posix.basename(rel);
    const dstPath = uniqueTargetPath(dstDir, fileName, used, rel);
    used.add(dstPath);

    manifest.push({
      src_path: rel,
      dst_dir: dstDir,
      dst_path: dstPath,
      rule_hit: bucket,
    });

    ops.push({ src_path: rel, dst_path: dstPath });
  }

  await writeJsonl(path.join(MANIFEST_DIR, 'resource_route_manifest.jsonl'), manifest);

  const byBucket = Object.keys(RESOURCE_BUCKETS).map((bucket) => {
    const count = manifest.filter((x) => x.rule_hit === bucket).length;
    return `${bucket}=${count}`;
  });

  const lines = [
    `phase=4`,
    `mode=${apply ? 'apply' : 'dry-run'}`,
    `planned_moves=${ops.length}`,
    ...byBucket,
  ];

  if (apply && ops.length > 0) {
    await applyMoveOperations(ops, 'phase4');
    lines.push(`applied=${ops.length}`);
  }

  await writeLog('phase4', apply ? 'apply' : 'dryrun', lines.join('\n'));
}

async function runPhase5(apply) {
  for (const dir of Object.values(AREA_DIRS)) {
    if (apply) {
      await ensureDir(path.join(ROOT, toNative(dir)));
    }
  }

  const files = await walkFiles(path.join(ROOT, '02_Areas'));
  const ops = [];
  const manifest = [];
  const used = new Set(await scanRelativeFiles());

  for (const abs of files) {
    const rel = toPosix(path.relative(ROOT, abs));
    const ext = path.extname(rel).toLowerCase();
    if (ext !== '.md') {
      continue;
    }

    const fileName = path.posix.basename(rel);

    if (/^MOC\s*-/.test(fileName)) {
      continue;
    }
    if (fileName === 'INDEX.md') {
      continue;
    }
    if (isInAreaBucket(rel)) {
      continue;
    }

    const bucket = await classifyArea(rel);
    const dstDir = AREA_DIRS[bucket];
    const dstPath = uniqueTargetPath(dstDir, fileName, used, rel);
    used.add(dstPath);

    manifest.push({
      src_path: rel,
      dst_dir: dstDir,
      dst_path: dstPath,
      rule_hit: bucket,
    });

    ops.push({ src_path: rel, dst_path: dstPath });
  }

  await writeJsonl(path.join(MANIFEST_DIR, 'areas_route_manifest.jsonl'), manifest);

  const lines = [
    `phase=5`,
    `mode=${apply ? 'apply' : 'dry-run'}`,
    `planned_moves=${ops.length}`,
    `psych=${manifest.filter((x) => x.rule_hit === 'psych').length}`,
    `econ=${manifest.filter((x) => x.rule_hit === 'econ').length}`,
    `gender=${manifest.filter((x) => x.rule_hit === 'gender').length}`,
    `methods=${manifest.filter((x) => x.rule_hit === 'methods').length}`,
    `cases=${manifest.filter((x) => x.rule_hit === 'cases').length}`,
  ];

  if (apply && ops.length > 0) {
    await applyMoveOperations(ops, 'phase5');
    lines.push(`applied=${ops.length}`);
  }

  if (apply) {
    await writeAreasIndex();
  }

  await writeLog('phase5', apply ? 'apply' : 'dryrun', lines.join('\n'));
}

async function runPhase6(apply) {
  const mdFiles = await scanAllMarkdown({ excludeArchives: true });
  const inboundMap = await buildInboundMap(mdFiles);

  const hashGroups = new Map();
  const contentCache = new Map();

  for (const rel of mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const raw = await fs.readFile(abs);
    const hash = sha1(raw);
    if (!hashGroups.has(hash)) {
      hashGroups.set(hash, []);
    }
    hashGroups.get(hash).push(rel);
    contentCache.set(rel, raw.toString('utf8'));
  }

  const archiveDir = `04_Archives/backups/dedup-${todayDate()}`;
  if (apply) {
    await ensureDir(path.join(ROOT, toNative(archiveDir)));
  }

  const manifest = [];
  const moveOps = [];
  let groupId = 0;

  for (const group of hashGroups.values()) {
    if (group.length < 2) {
      continue;
    }
    groupId += 1;

    const canonical = await pickCanonical(group);
    for (const rel of group) {
      if (rel === canonical) {
        continue;
      }

      const inbound = inboundMap.get(rel) ?? 0;
      if (inbound > 0) {
        manifest.push({
          group_id: `exact-${groupId}`,
          canonical_path: canonical,
          duplicate_path: rel,
          dedup_type: 'exact',
          action: 'merge_manual',
        });
        continue;
      }

      const dstPath = uniqueTargetPath(
        archiveDir,
        path.posix.basename(rel),
        new Set(await scanRelativeFiles()),
        rel,
      );

      manifest.push({
        group_id: `exact-${groupId}`,
        canonical_path: canonical,
        duplicate_path: rel,
        dedup_type: 'exact',
        action: 'archive',
        archive_path: dstPath,
      });

      moveOps.push({ src_path: rel, dst_path: dstPath });
    }
  }

  const nearGroups = detectNearDuplicates(contentCache);
  for (const near of nearGroups) {
    manifest.push({
      group_id: near.group_id,
      canonical_path: near.canonical,
      duplicate_path: near.duplicate,
      dedup_type: 'near',
      action: 'merge_manual',
      similarity: near.similarity,
    });
  }

  await writeJsonl(path.join(MANIFEST_DIR, 'dedup_manifest.jsonl'), manifest);

  const lines = [
    `phase=6`,
    `mode=${apply ? 'apply' : 'dry-run'}`,
    `exact_groups=${new Set(manifest.filter((x) => x.dedup_type === 'exact').map((x) => x.group_id)).size}`,
    `near_groups=${new Set(manifest.filter((x) => x.dedup_type === 'near').map((x) => x.group_id)).size}`,
    `archive_ops=${moveOps.length}`,
    `manual=${manifest.filter((x) => x.action === 'merge_manual').length}`,
  ];

  if (apply && moveOps.length > 0) {
    await applyMoveOperations(moveOps, 'phase6');
    lines.push(`applied=${moveOps.length}`);
  }

  await writeLog('phase6', apply ? 'apply' : 'dryrun', lines.join('\n'));
}

async function runVerify() {
  const namingViolations = await countNamingViolations();
  const brokenLinks = await findBrokenLinks();

  const structure = {
    areas_dirs: await existingDirs(Object.values(AREA_DIRS)),
    resource_dirs: await existingDirs(Object.values(RESOURCE_BUCKETS)),
    daily_exists: await pathExists(path.join(ROOT, '05_Daily')),
  };

  const counts = {
    inbox_md: (await walkFiles(path.join(ROOT, '00_Inbox'))).filter((x) => x.endsWith('.md')).length,
    areas_md: (await walkFiles(path.join(ROOT, '02_Areas'))).filter((x) => x.endsWith('.md')).length,
    resource_files: (await walkFiles(path.join(ROOT, '03_Resource'))).length,
  };

  const report = {
    generated_at: new Date().toISOString(),
    naming_violations: namingViolations,
    broken_links: brokenLinks.length,
    broken_link_samples: brokenLinks.slice(0, 50),
    structure,
    counts,
  };

  await fs.writeFile(
    path.join(LOG_DIR, 'final_verify.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );

  const lines = [
    `verify=complete`,
    `naming_violations=${namingViolations}`,
    `broken_links=${brokenLinks.length}`,
    `areas_dirs_ready=${structure.areas_dirs}`,
    `resource_dirs_ready=${structure.resource_dirs}`,
    `daily_exists=${structure.daily_exists}`,
    `inbox_md=${counts.inbox_md}`,
    `areas_md=${counts.areas_md}`,
    `resource_files=${counts.resource_files}`,
  ];

  await writeLog('verify', 'apply', lines.join('\n'));
}

function parseSummaryReport(content) {
  const entries = [];
  const blocks = content.split(/\n###\s+\d+\.\s+/g).slice(1);
  for (const block of blocks) {
    const filePath = captureLine(block, '- file_path: ');
    const confidence = captureLine(block, '- confidence: ');
    const nextAction = captureLine(block, '- next_action: ');
    const tagsPrimary = splitTags(captureLine(block, '- tags_primary: '));
    const tagsSecondary = splitTags(captureLine(block, '- tags_secondary: '));

    entries.push({
      file_path: toPosix((filePath || '').trim()),
      confidence: (confidence || '').trim(),
      next_action: (nextAction || '').trim(),
      tags_primary: tagsPrimary,
      tags_secondary: tagsSecondary,
    });
  }
  return entries;
}

function captureLine(block, prefix) {
  const re = new RegExp(`^\\- ${escapeRegExp(prefix.trim())}(.+)$`, 'm');
  const m = block.match(re);
  if (m) {
    return m[1].trim();
  }
  const alt = new RegExp(`^${escapeRegExp(prefix)}(.+)$`, 'm');
  return alt.exec(block)?.[1]?.trim() ?? '';
}

function splitTags(raw) {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function routeAreaFromSummary(entry) {
  const text = [
    ...(entry.tags_primary || []),
    ...(entry.tags_secondary || []),
    entry.next_action || '',
    path.posix.basename(entry.file_path || '', '.md'),
  ]
    .join(' ')
    .toLowerCase();

  if (containsAny(text, ['经济', '金融', '投资', 'a股', '宏观', '产业', '量化'])) {
    return AREA_DIRS.econ;
  }
  if (containsAny(text, ['心理', '认知', '成瘾', '操纵', '控制', '舆情', '剥削'])) {
    return AREA_DIRS.psych;
  }
  if (containsAny(text, ['性别', '男娘', '地雷', '女性', '男性', '关系'])) {
    return AREA_DIRS.gender;
  }
  if (containsAny(text, ['方法论', 'sop', '学习路线', '系统设计', '软件工程', '框架', '实践', '指南', '技术'])) {
    return AREA_DIRS.methods;
  }
  return AREA_DIRS.cases;
}

async function classifyResource(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  const name = path.posix.basename(relPath, ext);
  const abs = path.join(ROOT, toNative(relPath));
  const content = ext === '.md' ? await fs.readFile(abs, 'utf8') : '';
  const text = `${name}\n${content.slice(0, 3000)}`.toLowerCase();

  if (containsAny(text, ['index', '索引', '合集', '清单', '参考', 'reference', '链接汇总'])) {
    return 'references';
  }
  if (containsAny(text, ['chapter', 'book', '书', '章节', '读书', 'book notes', '书摘'])) {
    return 'books';
  }
  if (containsAny(text, ['报告', 'report', '复盘', '研究', '洞察', '白皮书', '分析'])) {
    return 'reports';
  }
  if (containsAny(text, ['工具', 'tool', 'workflow', 'sop', '教程', '指南', '插件', '自动化', '配置'])) {
    return 'tools';
  }
  if (content.length > 0 && content.length < 900) {
    return 'snippets';
  }
  if (ext !== '.md') {
    return 'references';
  }
  return 'articles';
}

async function classifyArea(relPath) {
  const name = path.posix.basename(relPath, '.md').toLowerCase();
  const abs = path.join(ROOT, toNative(relPath));
  const content = await fs.readFile(abs, 'utf8');
  const text = `${name}\n${content.slice(0, 3500)}`.toLowerCase();

  if (containsAny(text, ['经济', '金融', '投资', '债务', '市场', 'a股', '量化', '产业', '牛郎'])) {
    return 'econ';
  }
  if (containsAny(text, ['心理', '认知', '成瘾', '控制', '依附', '叙事', '操纵'])) {
    return 'psych';
  }
  if (containsAny(text, ['性别', '男娘', '地雷', '关系', '女性', '男性', '表演'])) {
    return 'gender';
  }
  if (containsAny(text, ['方法论', 'sop', '框架', '模型', '学习路线', '流程'])) {
    return 'methods';
  }
  return 'cases';
}

async function writeAreasIndex() {
  const lines = [
    '# 02_Areas Index',
    '',
    '## 目录结构',
    '',
    '- 01_心理控制机制',
    '- 02_经济剥削机制',
    '- 03_性别表演研究',
    '- 04_方法论与框架',
    '- 05_案例与素材',
    '',
    '## MOC',
    '',
  ];

  const mocFiles = (await walkFiles(path.join(ROOT, '02_Areas')))
    .map((x) => toPosix(path.relative(ROOT, x)))
    .filter((x) => /^02_Areas\/MOC\s*-.*\.md$/.test(x))
    .sort();

  for (const moc of mocFiles) {
    lines.push(`- [[${path.posix.basename(moc, '.md')}]]`);
  }

  lines.push('', '## 分类文件计数', '');

  for (const [, dir] of Object.entries(AREA_DIRS)) {
    const files = (await walkFiles(path.join(ROOT, toNative(dir)))).filter((x) => x.endsWith('.md')).length;
    lines.push(`- ${path.posix.basename(dir)}: ${files}`);
  }

  await fs.writeFile(path.join(ROOT, '02_Areas', 'INDEX.md'), `${lines.join('\n')}\n`, 'utf8');
}

function isInAreaBucket(rel) {
  return Object.values(AREA_DIRS).some((dir) => rel.startsWith(`${dir}/`));
}

function isInResourceBucket(rel) {
  return Object.values(RESOURCE_BUCKETS).some((dir) => rel.startsWith(`${dir}/`));
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
    let content = await fs.readFile(abs, 'utf8');
    const original = content;

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

    const rebuilt = `${relTarget}${anchor ? `#${anchor}` : ''}`;
    return `[${label}](${rebuilt})`;
  });
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

async function buildInboundMap(mdFiles) {
  const index = buildMdIndex(mdFiles);
  const inbound = new Map();

  for (const rel of mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const text = await fs.readFile(abs, 'utf8');

    const wikiLinks = [...text.matchAll(/\[\[([^\]]+)\]\]/g)];
    for (const [, inner] of wikiLinks) {
      const target = inner.split('|')[0].split('#')[0].trim();
      if (!target) {
        continue;
      }
      const resolved = resolveWikiTarget(rel, target, index);
      if (!resolved) {
        continue;
      }
      inbound.set(resolved, (inbound.get(resolved) ?? 0) + 1);
    }

    const mdLinks = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
    for (const [, raw] of mdLinks) {
      if (isExternalUrl(raw) || raw.startsWith('#')) {
        continue;
      }
      const target = raw.split('#')[0].trim();
      const resolved = resolveMarkdownTarget(rel, target, index);
      if (!resolved) {
        continue;
      }
      inbound.set(resolved, (inbound.get(resolved) ?? 0) + 1);
    }
  }

  return inbound;
}

function detectNearDuplicates(contentCache) {
  const titleMap = new Map();
  for (const rel of contentCache.keys()) {
    const title = normalizeTitle(path.posix.basename(rel, '.md'));
    if (!titleMap.has(title)) {
      titleMap.set(title, []);
    }
    titleMap.get(title).push(rel);
  }

  const near = [];
  let gid = 0;

  for (const group of titleMap.values()) {
    if (group.length < 2) {
      continue;
    }

    const sorted = [...group].sort();
    const canonical = sorted[0];
    const a = normalizeText(contentCache.get(canonical) || '');

    for (let i = 1; i < sorted.length; i += 1) {
      const candidate = sorted[i];
      const b = normalizeText(contentCache.get(candidate) || '');
      const sim = jaccardSimilarity(tokenize(a), tokenize(b));
      if (sim >= 0.92) {
        gid += 1;
        near.push({
          group_id: `near-${gid}`,
          canonical,
          duplicate: candidate,
          similarity: Number(sim.toFixed(4)),
        });
      }
    }
  }

  return near;
}

async function pickCanonical(paths) {
  const scored = [];
  for (const rel of paths) {
    const abs = path.join(ROOT, toNative(rel));
    const content = await fs.readFile(abs, 'utf8');
    const created = extractCreatedDate(content);
    const stat = await fs.stat(abs);
    const fallback = formatDate(stat.birthtime);
    scored.push({ rel, created: created || fallback || '9999-99-99' });
  }

  scored.sort((a, b) => {
    if (a.created === b.created) {
      return a.rel.localeCompare(b.rel);
    }
    return a.created.localeCompare(b.created);
  });

  return scored[0].rel;
}

async function findBrokenLinks() {
  const mdFiles = await scanAllMarkdown();
  const index = buildMdIndex(mdFiles);
  const broken = [];

  for (const rel of mdFiles) {
    if (rel.startsWith('04_Archives/')) {
      continue;
    }
    if (rel === '00_Inbox/INDEX.md' || rel === '00_Inbox/文档格式.md') {
      continue;
    }

    const abs = path.join(ROOT, toNative(rel));
    const text = await fs.readFile(abs, 'utf8');

    for (const [, inner] of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const target = inner.split('|')[0].split('#')[0].trim();
      if (!target) {
        continue;
      }
      const explicitPathLike = target.includes('/') || target.startsWith('.') || target.toLowerCase().endsWith('.md');
      if (!explicitPathLike) {
        continue;
      }
      const ext = path.posix.extname(toPosix(target)).toLowerCase();
      if (ext && ext !== '.md') {
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
      const target = raw.split('#')[0].trim();
      if (!target || target.startsWith('/')) {
        continue;
      }
      const ext = path.posix.extname(toPosix(target)).toLowerCase();
      if (ext && ext !== '.md') {
        continue;
      }
      const resolved = resolveMarkdownTarget(rel, target, index);
      if (!resolved) {
        broken.push({ source: rel, type: 'markdown', target: raw });
      }
    }
  }

  return broken;
}

async function countNamingViolations() {
  const roots = ['00_Inbox', '01_Project', '02_Areas', '03_Resource'];
  let count = 0;
  for (const root of roots) {
    const files = await walkFiles(path.join(ROOT, root));
    for (const abs of files) {
      const rel = toPosix(path.relative(ROOT, abs));
      if (rel.startsWith('03_Resource/Templates/')) {
        continue;
      }
      if (rel.startsWith('01_Project/para_standardization/')) {
        continue;
      }
      if (path.basename(rel).startsWith('.')) {
        continue;
      }
      const base = path.basename(abs, path.extname(abs));
      if (isUnnamed(base) || normalizeBaseName(base) !== base) {
        count += 1;
      }
    }
  }
  return count;
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

function normalizeBaseName(base) {
  let out = base;
  const replacements = new Map([
    ['，', ','],
    ['。', '.'],
    ['：', ':'],
    ['；', ';'],
    ['？', '?'],
    ['！', '!'],
    ['（', '('],
    ['）', ')'],
    ['【', '['],
    ['】', ']'],
    ['“', '"'],
    ['”', '"'],
    ['‘', "'"],
    ['’', "'"],
    ['、', '-'],
    ['／', '-'],
    ['　', ' '],
    ['－', '-'],
    ['—', '-'],
    ['–', '-'],
    ['‒', '-'],
    ['﹣', '-'],
  ]);

  for (const [from, to] of replacements.entries()) {
    out = out.split(from).join(to);
  }

  out = out.replace(/[_\s]+/g, '-');
  out = out.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
  out = out.replace(/[\u200B-\u200D\uFEFF]/g, '');
  out = out.replace(/\.+$/g, '');
  out = out.replace(/-+/g, '-');
  out = out.replace(/^[-.]+|[-.]+$/g, '');

  if (out.length > 120) {
    out = out.slice(0, 120).replace(/[-.]+$/g, '');
  }

  return out;
}

function isUnnamed(base) {
  return /^未命名(?:\s*\d+)?$/i.test(base.trim());
}

function containsFullwidthPunctuation(s) {
  return /[，。：；？！（）【】“”‘’、／　－—–‒﹣]/.test(s);
}

function hasMixedSeparators(s) {
  return /[_-].*[_-]/.test(s) && s.includes('_') && s.includes('-');
}

async function deriveDateForUnnamed(rel) {
  const abs = path.join(ROOT, toNative(rel));
  if (rel.toLowerCase().endsWith('.md')) {
    const text = await fs.readFile(abs, 'utf8');
    const created = extractCreatedDate(text);
    if (created) {
      return created;
    }
  }
  const stat = await fs.stat(abs);
  return formatDate(stat.birthtime) || todayDate();
}

function extractCreatedDate(content) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    return '';
  }
  const m = fm[1].match(/^创建时间:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})$/m);
  return m?.[1] ?? '';
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

async function scanAllMarkdown(options = {}) {
  const files = await walkFiles(ROOT);
  const md = [];

  for (const abs of files) {
    const rel = toPosix(path.relative(ROOT, abs));
    if (rel.startsWith('.git/')) {
      continue;
    }
    if (rel.startsWith('.obsidian/')) {
      continue;
    }
    if (rel.startsWith('.space/')) {
      continue;
    }
    if (rel.startsWith('.trash/')) {
      continue;
    }
    if (options.excludeArchives && rel.startsWith('04_Archives/')) {
      continue;
    }
    if (rel.toLowerCase().endsWith('.md')) {
      md.push(rel);
    }
  }

  return md.sort();
}

async function scanRelativeFiles() {
  const files = await walkFiles(ROOT);
  return files.map((abs) => toPosix(path.relative(ROOT, abs)));
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

async function existingDirs(relDirs) {
  for (const rel of relDirs) {
    const abs = path.join(ROOT, toNative(rel));
    const ok = await pathExists(abs);
    if (!ok) {
      return false;
    }
    const stat = await fs.stat(abs);
    if (!stat.isDirectory()) {
      return false;
    }
  }
  return true;
}

function formatManualReview(items) {
  const lines = ['# Phase3 Manual Review', '', `总计: ${items.length}`, ''];
  for (const item of items) {
    lines.push(`- ${item.file_path || '(missing file_path)'} | reason=${item.reason} | confidence=${item.confidence || 'n/a'} | target=${item.target_dir || 'n/a'}`);
  }
  return `${lines.join('\n')}\n`;
}

function containsAny(text, words) {
  return words.some((w) => text.includes(w.toLowerCase()));
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/[\s\-_.，。！？!?,、（）()\[\]【】]/g, '');
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  const tokens = new Set();
  const src = text.slice(0, 5000);
  for (let i = 0; i < src.length - 2; i += 1) {
    tokens.add(src.slice(i, i + 3));
  }
  return tokens;
}

function jaccardSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let inter = 0;
  for (const token of a) {
    if (b.has(token)) {
      inter += 1;
    }
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
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

async function writeJsonl(file, rows) {
  const lines = rows.map((row) => JSON.stringify(row, null, 0));
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${lines.join('\n')}\n`, 'utf8');
}

async function writeLog(phase, mode, body) {
  const file = path.join(LOG_DIR, `${phase}-${mode}.log`);
  await fs.writeFile(file, `${body}\n`, 'utf8');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sha1(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

function formatDate(dateLike) {
  if (!dateLike) {
    return '';
  }
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayDate() {
  return formatDate(new Date());
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
