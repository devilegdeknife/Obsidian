import fs from 'fs';
import path from 'path';

const rootArgIndex = process.argv.indexOf('--root');
const root = rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : process.cwd();

const topDirs = [
  '00_Inbox',
  '01_Project',
  '02_Areas',
  '03_Resource',
  '04_Archives',
  'Daily',
];

const targetCounts = new Map([
  ['00_Inbox', 4],
  ['01_Project', 3],
  ['02_Areas', 4],
  ['03_Resource', 3],
  ['04_Archives', 3],
  ['Daily', 3],
]);

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

function stripWrappingQuotes(value) {
  if (!value) return value;
  const singleQuote = '\x27';
  const doubleQuote = '\x22';
  if (
    (value.startsWith(singleQuote) && value.endsWith(singleQuote)) ||
    (value.startsWith(doubleQuote) && value.endsWith(doubleQuote))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseYamlTags(frontmatter) {
  if (!frontmatter) return [];
  const tags = [];
  const lines = frontmatter.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^tags:\s*\[/.test(line)) {
      const inner = line.replace(/^tags:\s*\[/, '').replace(/\]\s*$/, '');
      inner.split(',').forEach((part) => {
        const cleaned = stripWrappingQuotes(part.trim());
        if (cleaned) tags.push(cleaned);
      });
      continue;
    }
    if (/^tags:\s*$/.test(line)) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const next = lines[j];
        if (!/^\s*-\s+/.test(next)) break;
        const cleaned = stripWrappingQuotes(next.replace(/^\s*-\s+/, '').trim());
        if (cleaned) tags.push(cleaned);
      }
      continue;
    }
    if (/^tags:\s+/.test(line)) {
      const cleaned = stripWrappingQuotes(line.replace(/^tags:\s+/, '').trim());
      if (cleaned) tags.push(cleaned);
    }
  }
  return tags;
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

function normalizeSegment(name) {
  let segment = name.trim().normalize('NFKC');
  segment = segment.replace(/\s+/g, '-');
  segment = segment.replace(/\/{2,}/g, '/');
  segment = segment.replace(/^\/+|\/+$/g, '');
  segment = segment.replace(/^-+|-+$/g, '');
  segment = segment.toLowerCase();
  return segment;
}

function getAreaVocabulary(areasRoot) {
  if (!fs.existsSync(areasRoot)) return [];
  const entries = fs.readdirSync(areasRoot, { withFileTypes: true });
  const vocab = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    const segment = normalizeSegment(entry.name);
    if (!segment) continue;
    vocab.push({ name: entry.name, tag: '#para/area/' + segment });
  }
  return vocab.sort((a, b) => a.name.localeCompare(b.name));
}

function pickSamples(allFilesByDir) {
  const selected = [];
  const remaining = new Map();
  for (const [dir, files] of allFilesByDir.entries()) {
    const sorted = [...files].sort((a, b) => a.localeCompare(b));
    const target = targetCounts.get(dir) ?? 0;
    const picked = sorted.slice(0, Math.min(target, sorted.length));
    selected.push(...picked.map((file) => ({ dir, file })));
    remaining.set(dir, sorted.slice(picked.length));
  }

  let totalTarget = 0;
  for (const count of targetCounts.values()) totalTarget += count;
  let deficit = totalTarget - selected.length;
  if (deficit > 0) {
    const dirsByRemaining = Array.from(remaining.entries())
      .filter(([, files]) => files.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
    let index = 0;
    while (deficit > 0 && dirsByRemaining.length > 0) {
      const [dir, files] = dirsByRemaining[index % dirsByRemaining.length];
      const next = files.shift();
      if (next) {
        selected.push({ dir, file: next });
        deficit -= 1;
      } else {
        dirsByRemaining.splice(index % dirsByRemaining.length, 1);
      }
      index += 1;
    }
  }

  return selected;
}

const filesByDir = new Map();
for (const dir of topDirs) {
  const absDir = path.join(root, dir);
  if (!fs.existsSync(absDir)) continue;
  const files = listMarkdownFiles(absDir);
  filesByDir.set(dir, files);
}

const samples = pickSamples(filesByDir);

const results = samples.map(({ dir, file }) => {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter, body } = splitFrontmatter(content);
  const yamlTagsRaw = parseYamlTags(frontmatter);
  const inlineTagsRaw = extractInlineTags(body);
  const normalized = uniqueSorted([
    ...yamlTagsRaw.map(normalizeTag).filter(Boolean),
    ...inlineTagsRaw.map(normalizeTag).filter(Boolean),
  ]);
  return {
    dir,
    file: path.relative(root, file),
    yamlTags: uniqueSorted(yamlTagsRaw.map(normalizeTag).filter(Boolean)),
    inlineTags: uniqueSorted(inlineTagsRaw.map(normalizeTag).filter(Boolean)),
    normalized,
  };
});

const areaVocab = getAreaVocabulary(path.join(root, '02_Areas'));

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const dateStr = yyyy + '-' + mm + '-' + dd;

let output = '';
output += '# Tag Sample Extract\n\n';
output += 'Generated: ' + dateStr + '\n\n';
output += '## Sample Coverage\n';
output += '- Target: ' + samples.length + ' files across ' + topDirs.length + ' PARA folders\n';
for (const dir of topDirs) {
  const count = samples.filter((item) => item.dir === dir).length;
  output += '- ' + dir + ': ' + count + '\n';
}
output += '\n## Normalization Rules\n';
output += '- NFKC normalization (fullwidth to halfwidth where possible)\n';
output += '- Lowercase\n';
output += '- Whitespace to hyphen\n';
output += '- Collapse duplicate slashes\n';
output += '- Trim leading or trailing slashes and hyphens\n';
output += '- Ensure leading #\n\n';
output += '## Samples\n';
for (const item of results) {
  output += '- ' + item.file + '\n';
  output += '  - yaml_tags: ' + (item.yamlTags.length ? item.yamlTags.join(', ') : '[]') + '\n';
  output += '  - inline_tags: ' + (item.inlineTags.length ? item.inlineTags.join(', ') : '[]') + '\n';
  output += '  - normalized: ' + (item.normalized.length ? item.normalized.join(', ') : '[]') + '\n';
}
output += '\n## Area Vocabulary (from 02_Areas)\n';
for (const entry of areaVocab) {
  output += '- ' + entry.name + ' -> ' + entry.tag + '\n';
}

const outputPath = path.join(root, '.agent', 'outputs', 'tag-sample.md');
fs.writeFileSync(outputPath, output, 'utf8');

console.log('Wrote ' + outputPath);
