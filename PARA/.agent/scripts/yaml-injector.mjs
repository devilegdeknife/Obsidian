import fs from 'fs';
import path from 'path';

const rootArgIndex = process.argv.indexOf('--root');
const root = rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : process.cwd();
const apply = process.argv.includes('--apply');

const configPath = path.join(root, '.agent', 'tagging-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const excludedDirs = new Set(['.agent', '.obsidian', 'Templates', '_assets', '.git']);

function listMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      files.push(...listMarkdownFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function splitFrontmatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  if (!match) return { frontmatter: null, body: text };
  return {
    frontmatter: match[1],
    body: text.slice(match[0].length),
  };
}

function normalizeTag(raw) {
  if (!raw) return null;
  let tag = raw.trim();
  tag = tag.replace(/^#+/, '');
  tag = tag.normalize('NFKC');
  tag = tag.replace(/\s+/g, '-');
  tag = tag.replace(/\/{2,}/g, '/');
  tag = tag.replace(/^\/+|\/+$/g, '');
  tag = tag.replace(/^-+|-+$/g, '');
  tag = tag.toLowerCase();
  if (!tag) return null;
  return '#' + tag;
}

function extractInlineTags(body) {
  const tags = [];
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const regex = /(^|[\s\(\[])(#([\p{L}\p{N}_\/-]+))/gu;
    let match;
    while ((match = regex.exec(line)) !== null) {
      tags.push(match[2]);
    }
  }
  return tags;
}

function uniqueSorted(list) {
  return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function expectedPara(filePath) {
  const rel = path.relative(root, filePath);
  const top = rel.split(path.sep)[0];
  return config.paraMap[top] || null;
}

function parseFrontmatterLines(frontmatter) {
  if (!frontmatter) return [];
  return frontmatter.split(/\r?\n/);
}

function hasField(lines, field) {
  return lines.some((line) => line.startsWith(field + ':'));
}

function buildTagsField(tags) {
  if (!tags.length) return ['tags: []'];
  const lines = ['tags:'];
  for (const tag of tags) {
    lines.push('  - ' + tag);
  }
  return lines;
}

const filesToProcess = [];
for (const topDir of Object.keys(config.paraMap)) {
  const absDir = path.join(root, topDir);
  if (!fs.existsSync(absDir)) continue;
  filesToProcess.push(...listMarkdownFiles(absDir));
}

const now = new Date();
const updatedValue = formatDate(now);

let changed = 0;
let unchanged = 0;

for (const file of filesToProcess) {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter, body } = splitFrontmatter(content);
  const lines = parseFrontmatterLines(frontmatter);

  const missingPara = !hasField(lines, 'para');
  const missingTags = !hasField(lines, 'tags');
  const missingCreated = !hasField(lines, 'created');
  const missingUpdated = !hasField(lines, 'updated');

  if (!missingPara && !missingTags && !missingCreated && !missingUpdated) {
    unchanged += 1;
    continue;
  }

  const newLines = [...lines];
  const additions = [];

  if (missingPara) {
    const paraValue = expectedPara(file);
    if (paraValue) additions.push('para: ' + paraValue);
  }

  if (missingTags) {
    const inlineTags = extractInlineTags(body).map(normalizeTag).filter(Boolean);
    const tags = uniqueSorted(inlineTags);
    additions.push(...buildTagsField(tags));
  }

  if (missingCreated) {
    const stat = fs.statSync(file);
    const createdDate = stat.birthtime && stat.birthtime.getFullYear() > 1980 ? stat.birthtime : stat.mtime;
    additions.push('created: ' + formatDate(createdDate));
  }

  if (missingUpdated) {
    additions.push('updated: ' + updatedValue);
  }

  if (additions.length) {
    newLines.push(...additions);
  }

  const newFrontmatter = newLines.join('\n');
  const newContent = '---\n' + newFrontmatter + '\n---\n' + body;

  const rel = path.relative(root, file);
  const summary = [];
  if (missingPara) summary.push('para');
  if (missingTags) summary.push('tags');
  if (missingCreated) summary.push('created');
  if (missingUpdated) summary.push('updated');

  const label = apply ? '[APPLY]' : '[DRY RUN]';
  console.log(label + ' add ' + summary.join(', ') + ' -> ' + rel);
  changed += 1;

  if (apply) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
}

console.log('Scan complete. Changed: ' + changed + ', Unchanged: ' + unchanged + '.');
if (!apply) {
  console.log('Dry run only. Re-run with --apply to write changes.');
}
