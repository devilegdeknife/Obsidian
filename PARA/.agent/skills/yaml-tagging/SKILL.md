# yaml-tagging

Use this skill to run tagging automation scripts in this vault.

## Commands
    node .agent/scripts/tag-sample.mjs
    node .agent/scripts/yaml-injector.mjs
    node .agent/scripts/yaml-injector.mjs --apply
    node .agent/scripts/created-normalizer.mjs
    node .agent/scripts/created-normalizer.mjs --apply
    node .agent/scripts/tag-consistency-check.mjs

## Notes
- Default is dry-run unless --apply is set
- Config lives in .agent/tagging-config.json
- Outputs are written to .agent/outputs/
