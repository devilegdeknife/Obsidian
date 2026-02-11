# Repository Guidelines

## Project Structure & Module Organization
This is an Obsidian PARA vault. Top-level folders are `00_Inbox`, `01_Project`, `02_Areas`, `03_Resource`, `04_Archives`, `Daily`, `Templates`, and `.obsidian`. Navigation uses `_INDEX.md` notes. Templates live in `Templates/` (for example, `Daily Note.md`, `yaml.md`). Assets are stored alongside notes or in `_assets/` where present.

## Build, Test, and Development Commands
There is no build system. To work locally, open the vault in Obsidian. Daily notes are configured in `.obsidian/daily-notes.json` (template: `Templates/Daily Note`). For quick scans, use filesystem search tools (for example, `find`) or Obsidian search.

## Coding Style & Naming Conventions
Use Markdown with YAML frontmatter. Prefer 2-space indentation in YAML lists. Daily notes follow `Daily/YYYY-MM-DD.md`. Many source notes use `标题_作者_YYYY-MM-DD.md`. Keep tags hierarchical and consistent (for example, `#para/area/健康`).

## Testing Guidelines
Validate changes by opening the vault in Obsidian: check Properties rendering, Dataview blocks, and `_INDEX.md` links. If structure changes, confirm backlinks and graph navigation behave as expected.

## Tagging Automation
Tagging tooling lives in `.agent/`. Use `node .agent/scripts/tag-sample.mjs` to sample tags and `node .agent/scripts/yaml-injector.mjs` for dry-run YAML injection (add `--apply` to write). Normalize legacy `created` timestamps with `node .agent/scripts/created-normalizer.mjs` (add `--apply` to write). Consistency checks run via `node .agent/scripts/tag-consistency-check.mjs`. Configuration is in `.agent/tagging-config.json`, outputs in `.agent/outputs/`.

## Commit & Pull Request Guidelines
No Git history is present in this repository. If you use Git, prefer conventional commits, for example: `docs(vault): update indexes`. PRs should include a summary, list of moved or renamed notes, and screenshots if structure or graph behavior changes.

## Obsidian Configuration Notes
Plugin configs live in `.obsidian/`. Avoid editing these files unless you intend to change vault behavior. Active plugins include Templater, Dataview, Periodic Notes, and QuickAdd.

# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.
