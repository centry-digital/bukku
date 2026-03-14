# Roadmap: Bukku MCP Server

**Created:** 2026-02-06

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-02-09)
- ✅ **v1.1 npm Package Release** — Phases 8-11 (shipped 2026-02-10)
- 🔄 **v2.0 Monorepo + CLI** — Phases 12-16 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) — SHIPPED 2026-02-09</summary>

- [x] Phase 1: Foundation Infrastructure (5 plans) — completed 2026-02-07
- [x] Phase 2: Sales Category (3 plans) — completed 2026-02-08
- [x] Phase 3: Purchases Category (3 plans) — completed 2026-02-08
- [x] Phase 4: Banking & Contacts (2 plans) — completed 2026-02-08
- [x] Phase 5: Products & Lists (4 plans) — completed 2026-02-08
- [x] Phase 6: Accounting (4 plans) — completed 2026-02-08
- [x] Phase 7: Files & Control Panel (4 plans) — completed 2026-02-09

**Total:** 80 requirements, 25 plans, 169 MCP tools
**Archive:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 npm Package Release (Phases 8-11) — SHIPPED 2026-02-10</summary>

- [x] Phase 8: Package Configuration (1 plan) — completed 2026-02-09
- [x] Phase 9: Build & Distribution (1 plan) — completed 2026-02-09
- [x] Phase 10: CI/CD Automation (1 plan) — completed 2026-02-09
- [x] Phase 11: Documentation (1 plan) — completed 2026-02-10

**Total:** 13 requirements, 4 plans, 8 tasks
**Archive:** [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

### v2.0 Monorepo + CLI

- [x] **Phase 12: Monorepo Foundation** — Restructure into npm workspaces with shared core; preserve MCP package with zero regression (completed 2026-03-14)
- [x] **Phase 13: CLI Foundation + Auth** — Entry point, auth resolution chain, output contract, config subcommand (completed 2026-03-14)
- [x] **Phase 14: CLI Read Commands** — All list and get operations across all 8 categories with table output (completed 2026-03-14)
- [x] **Phase 15: CLI Write Commands** — All create, update, delete, status, file upload, and --dry-run (completed 2026-03-14)
- [x] **Phase 16: Distribution** — Publish @centry-digital/bukku-cli, npx support, README (completed 2026-03-14)

## Phase Details

### Phase 12: Monorepo Foundation
**Goal**: The repository is restructured into three npm workspace packages (core/mcp/cli) with TypeScript project references, and the published @centry-digital/bukku-mcp package is provably identical to v1.x from a consumer's perspective.
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: MONO-01, MONO-02, MONO-03, MONO-04, MONO-05, MONO-06, MONO-07
**Success Criteria** (what must be TRUE):
  1. `npm run build` at the repo root compiles all three packages in dependency order (core first, then mcp and cli) without errors
  2. `npm pack` output for packages/mcp contains an identical file list to the pre-restructure tarball — no files added, removed, or renamed
  3. `npx @centry-digital/bukku-mcp` executes the MCP server and responds to a tool call without error (zero regression smoke test)
  4. `npx depcheck` run inside packages/mcp and packages/cli reports no phantom dependencies
  5. GitHub Actions CI passes for all three packages, and the publish workflow is updated to use `--workspace packages/mcp`
**Plans:** 3/3 plans complete
Plans:
- [x] 12-01-PLAN.md — Workspace root + packages/core (move shared code, refactor logger, add cliGroup)
- [x] 12-02-PLAN.md — packages/mcp + import rewiring (move MCP files, esbuild bundling)
- [x] 12-03-PLAN.md — CLI skeleton + CI update + tarball verification
**Brief**: [briefs/v2.0/PHASE-12-BRIEF.md](briefs/v2.0/PHASE-12-BRIEF.md)

### Phase 13: CLI Foundation + Auth
**Goal**: The `bukku` CLI binary is executable, resolves credentials via a three-tier chain, and enforces the stdout/stderr output contract — every command inherits correct behavior by construction.
**Depends on**: Phase 12
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, OUT-01, OUT-05
**Success Criteria** (what must be TRUE):
  1. `bukku --help` prints usage; `bukku --version` prints the package version; `bukku <group> --help` prints group-level usage with examples
  2. `bukku config set api_token <token>` writes to `~/.bukkurc` with 0o600 permissions; `bukku config show` prints the resolved config with the token masked
  3. When credentials are missing, `bukku` exits non-zero and writes a structured JSON error to stderr with no output on stdout
  4. Any successful command writes only valid JSON to stdout — `JSON.parse(stdout)` succeeds for every command that produces output
  5. Auth resolves correctly across all three tiers: CLI flags override env vars, env vars override `~/.bukkurc`
**Plans:** 2/2 plans complete
Plans:
- [x] 13-01-PLAN.md — CLI entry point + Commander.js setup + auth resolution + config subcommand
- [x] 13-02-PLAN.md — Output contract + withAuth wrapper + exit codes + tests
**Brief**: [briefs/v2.0/PHASE-13-BRIEF.md](briefs/v2.0/PHASE-13-BRIEF.md)

### Phase 14: CLI Read Commands
**Goal**: Every list and get operation across all 8 Bukku API categories is accessible from the CLI, returning correct data in both JSON and human-readable table formats.
**Depends on**: Phase 13
**Requirements**: CMD-01, CMD-02, OUT-02, OUT-03
**Success Criteria** (what must be TRUE):
  1. `bukku <category> <resource> list` works for all resources across all 8 categories (sales, purchases, banking, contacts, products, accounting, files, control-panel), with `--limit` and `--all` pagination flags
  2. `bukku <category> <resource> get <id>` returns the full resource JSON for any valid resource ID
  3. `bukku <category> <resource> list --format table` renders a human-readable table with sensible per-resource columns (id, date, contact, total, status as applicable)
  4. All list commands exit with code 0 on success and non-zero on API or auth errors, with no output mixed onto stdout when an error occurs
**Plans:** 2/2 plans complete
Plans:
- [x] 14-01-PLAN.md — CLI command factory (list + get generation) + group mapping + standard flags
- [x] 14-02-PLAN.md — Table formatter + per-resource columns + reference data commands + custom overrides
**Brief**: [briefs/v2.0/PHASE-14-BRIEF.md](briefs/v2.0/PHASE-14-BRIEF.md)

### Phase 15: CLI Write Commands
**Goal**: Every create, update, delete, status-change, and file upload operation is accessible from the CLI, with --dry-run support giving users a safe inspection path before executing mutations.
**Depends on**: Phase 14
**Requirements**: CMD-03, CMD-04, CMD-05, CMD-06, CMD-07, CMD-08, OUT-04
**Success Criteria** (what must be TRUE):
  1. `bukku <category> <resource> create` and `update` accept JSON via `--data` flag or piped to stdin and return the created/updated resource as JSON
  2. `bukku <category> <resource> delete <id>` removes the resource and exits zero; API validation errors are written to stderr as structured JSON with a non-zero exit code
  3. `bukku <category> <resource> <status-verb> <id>` (approve, void, etc.) executes the status transition and returns the updated resource
  4. `bukku files upload <path>` uploads the file and returns the file metadata as JSON
  5. Every mutation command supports `--dry-run` and prints the full request details (method, URL, body) to stdout without executing the API call
**Plans:** 3/3 plans complete
Plans:
- [x] 15-01-PLAN.md — Factory extension for create/update/delete + stdin JSON input
- [x] 15-02-PLAN.md — Status + archive/unarchive + journal entry validation + file upload
- [x] 15-03-PLAN.md — --dry-run support + parity verification
**Brief**: [briefs/v2.0/PHASE-15-BRIEF.md](briefs/v2.0/PHASE-15-BRIEF.md)

### Phase 16: Distribution
**Goal**: The @centry-digital/bukku-cli package is published on npm, executable via npx with no installation, and documented with enough detail for a new user to be productive without reading source code.
**Depends on**: Phase 15
**Requirements**: DIST-01, DIST-02, DIST-03
**Success Criteria** (what must be TRUE):
  1. `npm install -g @centry-digital/bukku-cli` installs the `bukku` binary and `bukku --version` prints the correct version
  2. `npx @centry-digital/bukku-cli --help` executes without prior installation and prints top-level usage
  3. The README contains: installation instructions, configuration steps (env vars and ~/.bukkurc), and at least one working end-to-end usage example per command category
**Plans:** 1/1 plans complete
Plans:
- [ ] 16-01-PLAN.md — Package finalization + CI/CD + npx verification + README
**Brief**: [briefs/v2.0/PHASE-16-BRIEF.md](briefs/v2.0/PHASE-16-BRIEF.md)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation Infrastructure | v1.0 | 5/5 | ✓ Complete | 2026-02-07 |
| 2. Sales Category | v1.0 | 3/3 | ✓ Complete | 2026-02-08 |
| 3. Purchases Category | v1.0 | 3/3 | ✓ Complete | 2026-02-08 |
| 4. Banking & Contacts | v1.0 | 2/2 | ✓ Complete | 2026-02-08 |
| 5. Products & Lists | v1.0 | 4/4 | ✓ Complete | 2026-02-08 |
| 6. Accounting | v1.0 | 4/4 | ✓ Complete | 2026-02-08 |
| 7. Files & Control Panel | v1.0 | 4/4 | ✓ Complete | 2026-02-09 |
| 8. Package Configuration | v1.1 | 1/1 | ✓ Complete | 2026-02-09 |
| 9. Build & Distribution | v1.1 | 1/1 | ✓ Complete | 2026-02-09 |
| 10. CI/CD Automation | v1.1 | 1/1 | ✓ Complete | 2026-02-09 |
| 11. Documentation | v1.1 | 1/1 | ✓ Complete | 2026-02-10 |
| 12. Monorepo Foundation | v2.0 | 3/3 | ✓ Complete | 2026-03-14 |
| 13. CLI Foundation + Auth | v2.0 | 2/2 | ✓ Complete | 2026-03-14 |
| 14. CLI Read Commands | v2.0 | 2/2 | ✓ Complete | 2026-03-14 |
| 15. CLI Write Commands | v2.0 | 3/3 | ✓ Complete | 2026-03-14 |
| 16. Distribution | 1/1 | Complete   | 2026-03-14 | -- |
