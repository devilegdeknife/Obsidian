import fs from 'fs';
import path from 'path';

const rootArgIndex = process.argv.indexOf('--root');
const root = rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : process.cwd();

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

function parseYamlTags(frontmatter) {
  if (!frontmatter) return [];
  const tags = [];
  const lines = frontmatter.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^tags:\s*\[/.test(line)) {
      const inner = line.replace(/^tags:\s*\[/, '').replace(/\]\s*$/, '');
      inner.split(',').forEach((part) => {
        const cleaned = part.trim();
        if (cleaned) tags.push(cleaned);
      });
      continue;
    }
    if (/^tags:\s*$/.test(line)) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const next = lines[j];
        if (!/^\s*-\s+/.test(next)) break;
        const cleaned = next.replace(/^\s*-\s+/, '').trim();
        if (cleaned) tags.push(cleaned);
      }
      continue;
    }
    if (/^tags:\s+/.test(line)) {
      const cleaned = line.replace(/^tags:\s+/, '').trim();
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

function parseField(frontmatter, fieldName) {
  if (!frontmatter) return null;
  const lines = frontmatter.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith(fieldName + ':')) {
      return line.replace(fieldName + ':', '').trim();
    }
  }
  return null;
}

function expectedPara(filePath) {
  const rel = path.relative(root, filePath);
  const top = rel.split(path.sep)[0];
  return config.paraMap[top] || null;
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

function areaVocabulary() {
  const areasRoot = path.join(root, '02_Areas');
  if (!fs.existsSync(areasRoot)) return new Set();
  const entries = fs.readdirSync(areasRoot, { withFileTypes: true });
  const vocab = new Set();
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    const segment = normalizeSegment(entry.name);
    if (!segment) continue;
    vocab.add(config.areaTagPrefix + segment);
  }
  return vocab;
}

const areaTags = areaVocabulary();
const filesToProcess = [];
for (const topDir of Object.keys(config.paraMap)) {
  const absDir = path.join(root, topDir);
  if (!fs.existsSync(absDir)) continue;
  filesToProcess.push(...listMarkdownFiles(absDir));
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const issues = [];

for (const file of filesToProcess) {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter } = splitFrontmatter(content);
  const rel = path.relative(root, file);

  const paraValue = parseField(frontmatter, 'para');
  const expected = expectedPara(file);
  if (!paraValue) {
    issues.push(rel + ' -> missing para');
  } else if (!config.allowedPara.includes(paraValue)) {
    issues.push(rel + ' -> invalid para value (' + paraValue + ')');
  } else if (expected && paraValue !== expected) {
    issues.push(rel + ' -> para mismatch (expected ' + expected + ', got ' + paraValue + ')');
  }

  const created = parseField(frontmatter, 'created');
  const hasTemplate = created && /<%.*%>/.test(created);
  if (created && !hasTemplate && !dateRegex.test(created)) {
    issues.push(rel + ' -> created format invalid (' + created + ')');
  }

  const updated = parseField(frontmatter, 'updated');
  if (updated && !dateRegex.test(updated)) {
    issues.push(rel + ' -> updated format invalid (' + updated + ')');
  }

  const tagsRaw = parseYamlTags(frontmatter);
  const tags = tagsRaw.map(normalizeTag).filter(Boolean);
  for (const tag of tags) {
    if (tag.startsWith(config.areaTagPrefix) && !areaTags.has(tag)) {
      issues.push(rel + ' -> unknown area tag ' + tag);
    }
  }
}

let output = '';
output += '# Tag Consistency Report\n\n';
output += 'Total files scanned: ' + filesToProcess.length + '\n';
output += 'Total issues: ' + issues.length + '\n\n';
if (issues.length) {
  output += '## Issues\n';
  for (const issue of issues) {
    output += '- ' + issue + '\n';
  }
}

const outputPath = path.join(root, '.agent', 'outputs', 'tag-consistency-report.md');
fs.writeFileSync(outputPath, output, 'utf8');

console.log('Wrote ' + outputPath);
console.log('Issues: ' + issues.length);
