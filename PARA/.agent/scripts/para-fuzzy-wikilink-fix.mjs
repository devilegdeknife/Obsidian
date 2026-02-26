#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();

async function main() {
  const mdFiles = await scanAllMarkdown();
  const byBase = new Map();
  const byNorm = new Map();

  for (const rel of mdFiles) {
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

  let touchedFiles = 0;
  let replacedLinks = 0;

  for (const rel of mdFiles) {
    const abs = path.join(ROOT, toNative(rel));
    const original = await fs.readFile(abs, 'utf8');

    let localReplaced = 0;
    const next = original.replace(/\[\[([^\]]+)\]\]/g, (full, inner) => {
      const [targetAndHeading, alias = ''] = inner.split('|');
      const [targetRaw, heading = ''] = targetAndHeading.split('#');
      const target = targetRaw.trim();

      if (!shouldFuzzyMatch(target)) {
        return full;
      }

      const exact = byBase.get(target) || [];
      if (exact.length === 1) {
        return full;
      }

      const norm = normalizeTitle(target);
      const candidates = byNorm.get(norm) || [];
      if (candidates.length !== 1) {
        return full;
      }

      const newBase = path.posix.basename(candidates[0], '.md');
      if (!newBase || newBase === target) {
        return full;
      }

      localReplaced += 1;
      return `[[${newBase}${heading ? `#${heading}` : ''}${alias ? `|${alias}` : ''}]]`;
    });

    if (next !== original) {
      await fs.writeFile(abs, next, 'utf8');
      touchedFiles += 1;
      replacedLinks += localReplaced;
    }
  }

  console.log(`touched_files=${touchedFiles}`);
  console.log(`replaced_links=${replacedLinks}`);
}

function shouldFuzzyMatch(target) {
  if (!target) {
    return false;
  }
  if (target.includes('/') || target.includes('\\')) {
    return false;
  }
  if (target.startsWith('.') || target.startsWith('^')) {
    return false;
  }
  if (/^\d+$/.test(target)) {
    return false;
  }
  if (/^(链接|link|todo|tbd)$/i.test(target)) {
    return false;
  }
  return true;
}

function normalizeTitle(text) {
  return text
    .toLowerCase()
    .replace(/[《》【】\[\]（）()]/g, '')
    .replace(/[\s\-_.，。！？!?,、:：;；"'`]/g, '')
    .replace(/%/g, '');
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
