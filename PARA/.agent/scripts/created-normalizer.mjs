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

function normalizeCreatedValue(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^\"|\"$/g, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(unquoted)) {
    return null;
  }
  const match = unquoted.match(/^(\d{4}-\d{2}-\d{2})[ T]\d{2}:\d{2}(:\d{2})?$/);
  if (!match) return null;
  return match[1];
}

const filesToProcess = [];
for (const topDir of Object.keys(config.paraMap)) {
  const absDir = path.join(root, topDir);
  if (!fs.existsSync(absDir)) continue;
  filesToProcess.push(...listMarkdownFiles(absDir));
}

let changed = 0;
let unchanged = 0;

for (const file of filesToProcess) {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter, body } = splitFrontmatter(content);
  if (!frontmatter) {
    unchanged += 1;
    continue;
  }

  const lines = frontmatter.split(/\r?\n/);
  let updated = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^(\s*created\s*:\s*)(.*)$/);
    if (!match) continue;
    const prefix = match[1];
    const currentValue = match[2];
    const normalized = normalizeCreatedValue(currentValue);
    if (!normalized) break;
    lines[i] = prefix + normalized;
    updated = true;
    break;
  }

  if (!updated) {
    unchanged += 1;
    continue;
  }

  const newFrontmatter = lines.join('\n');
  const newContent = '---\n' + newFrontmatter + '\n---\n' + body;
  const rel = path.relative(root, file);
  const label = apply ? '[APPLY]' : '[DRY RUN]';
  console.log(label + ' normalize created -> ' + rel);
  changed += 1;

  if (apply) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
}

console.log('Scan complete. Changed: ' + changed + ', Unchanged: ' + unchanged + '.');
if (!apply) {
  console.log('Dry run only. Re-run with --apply to write changes.');
}
