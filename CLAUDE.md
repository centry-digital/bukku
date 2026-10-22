# CLAUDE.md

Rules for working on this repository. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Repository

- npm workspaces monorepo: `packages/core` (internal API client, entities, validation; bundled, never published), `packages/mcp` (`@centry-digital/bukku-mcp`) and `packages/cli` (`@centry-digital/bukku-cli`). Both published packages are public on npm.
- TypeScript, ESM, Node 22. Tests use `node:test`. Bundled with esbuild (`esbuild.config.mjs`).
- The Bukku API is at `https://api.bukku.my`. Amounts are MYR. Never call it from tests.
- This repository is **public**: never commit real tokens, company subdomains or client data, and never point CI at self-hosted runners.
- British English in docs, comments and messages.

## Commands

- Verify everything: `npm run verify` (format, lint, build, typecheck, tests, parity). Run it before declaring any task done.
- Format: `npm run format`. Lint fixes: `npm run lint:fix`.

## Quality gates

- Never commit to `main`. One branch and one focused PR per change; PRs are squash-merged.
- CI (`.github/workflows/ci.yml`) runs separately named checks: `format`, `lint`, `typecheck`, `unit`, `build`, `parity`, `deps-audit`, `secret-scan`, plus `pr-hygiene` (`.github/workflows/pr-hygiene.yml`). All are required on `main` (see [docs/github-setup.md](docs/github-setup.md)). Known gitleaks false positives are allowed, narrowly and with a reason, in `.gitleaks.toml`.
- Fix locally, push once: collect every CI failure, reproduce and fix them with `npm run verify`, then push together.
- Every new MCP tool needs a CLI command (the `parity` check) and keeps a kebab-case name (the registry test).
- Ask before adding dependencies.

## Live verification

- For any user-facing change (CLI commands, flags or output, MCP tools, packaging): after `npm run verify` passes, run `.claude/skills/verify-bukku` for the affected features and put the run id and key evidence in the PR's **Verification evidence** section. Evidence lives in `.verify/evidence/` (git-ignored).
- Add or update the matching file under `.claude/skills/verify-bukku/features/` in the same branch.
- Live calls only against a Bukku test company, and live writes only when the owner has approved them for that run.
- After a feature lands, suggest running `/maintain-verification-skill`.
- `.claude/skills/create-verification-skill` and `maintain-verification-skill` are copied from upstream: don't edit them.
