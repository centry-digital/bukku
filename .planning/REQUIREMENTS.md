# Requirements: Bukku

**Defined:** 2026-03-14
**Core Value:** Users can read and write accounting data in Bukku efficiently — through AI conversation (MCP) or direct commands (CLI) — instead of manual data entry in the web UI.

## v2.0 Requirements

Requirements for monorepo restructure + CLI tool. Each maps to roadmap phases.

### Monorepo

- [x] **MONO-01**: Repository restructured into npm workspaces with packages/core, packages/mcp, packages/cli
- [x] **MONO-02**: Shared core package contains BukkuClient, types, tool configs, validation, and error transforms
- [x] **MONO-03**: MCP server relocated to packages/mcp with identical published behavior (zero regression)
- [x] **MONO-04**: TypeScript project references with composite builds across packages
- [x] **MONO-05**: Node.js minimum version bumped to 20
- [x] **MONO-06**: CI/CD updated for multi-package testing and publishing
- [x] **MONO-07**: npm pack tarball verified identical for @centry-digital/bukku-mcp before/after restructure

### CLI Auth

- [x] **AUTH-01**: CLI resolves credentials via three-tier precedence: CLI flags > env vars > config file
- [x] **AUTH-02**: Config file at ~/.bukkurc with INI format storing api_token and company_subdomain
- [x] **AUTH-03**: Config file created with secure permissions (0o600) and warns on insecure permissions
- [x] **AUTH-04**: `bukku config set <key> <value>` writes to config file
- [x] **AUTH-05**: `bukku config show` displays current resolved config (token masked)

### CLI Core

- [x] **CORE-01**: CLI entry point with nested subcommands (bukku <group> <resource> <action>)
- [x] **CORE-02**: --help available at every command level with usage examples
- [x] **CORE-03**: --version flag showing package version
- [x] **CORE-04**: Non-zero exit codes on all errors (API, auth, validation)
- [x] **CORE-05**: All errors and diagnostics go to stderr, only data to stdout
- [x] **CORE-06**: Structured error JSON to stderr when errors occur

### CLI Output

- [x] **OUT-01**: JSON output to stdout by default for all commands
- [x] **OUT-02**: --format table flag for human-readable tabular output
- [x] **OUT-03**: Sensible per-resource table column definitions (id, date, contact, total, status etc.)
- [ ] **OUT-04**: --dry-run flag on mutation commands showing request details without executing
- [x] **OUT-05**: Consistent flag naming across all subcommands (--format, --limit, --page)

### CLI Commands

- [x] **CMD-01**: All list commands with pagination (--limit, --all) and filtering flags
- [x] **CMD-02**: All get commands returning single resource by ID
- [x] **CMD-03**: All create commands accepting JSON via `--data` flag or stdin pipe
- [x] **CMD-04**: All update commands accepting JSON via `--data` flag or stdin pipe
- [x] **CMD-05**: All delete commands by resource ID
- [x] **CMD-06**: All status update commands (approve, void, etc.)
- [x] **CMD-07**: File upload command accepting file path
- [ ] **CMD-08**: Full parity with all 169 MCP tool operations

### Distribution

- [ ] **DIST-01**: Published as @centry-digital/bukku-cli on npm
- [ ] **DIST-02**: npx @centry-digital/bukku-cli zero-install execution
- [ ] **DIST-03**: README with installation, configuration, and usage examples

## Future Requirements

### Shell Completion

- **COMP-01**: `bukku completion bash|zsh|fish` generates shell completion scripts
- **COMP-02**: Tab-complete subcommands and flags at every level

## Out of Scope

| Feature | Reason |
|---------|--------|
| Interactive prompts for inputs | Breaks non-interactive use (scripts, CI, n8n). Use --help and examples instead |
| Watch/streaming mode | Bukku API is request-response, no streaming support |
| Built-in report generation | Out of scope for CLI; use Bukku web UI or MCP + Claude |
| Auto-retry on failure | Silent retries can double-create accounting records (idempotency risk) |
| --output file flag | Redundant with shell redirection (`> file.json`) |
| Multiple company profiles | Config complexity not justified; use env vars or direnv |
| GUI/TUI mode | Inconsistent with JSON-first design; web UI exists for interactive use |
| Shell completion | Deferred to v2.1 — command structure must stabilize first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MONO-01 | Phase 12 | Complete (12-01) |
| MONO-02 | Phase 12 | Complete (12-01) |
| MONO-03 | Phase 12 | Complete |
| MONO-04 | Phase 12 | Complete (12-01) |
| MONO-05 | Phase 12 | Complete (12-01) |
| MONO-06 | Phase 12 | Complete |
| MONO-07 | Phase 12 | Complete |
| AUTH-01 | Phase 13 | Complete |
| AUTH-02 | Phase 13 | Complete |
| AUTH-03 | Phase 13 | Complete |
| AUTH-04 | Phase 13 | Complete |
| AUTH-05 | Phase 13 | Complete |
| CORE-01 | Phase 13 | Complete |
| CORE-02 | Phase 13 | Complete |
| CORE-03 | Phase 13 | Complete |
| CORE-04 | Phase 13 | Complete (13-02) |
| CORE-05 | Phase 13 | Complete (13-02) |
| CORE-06 | Phase 13 | Complete (13-02) |
| OUT-01 | Phase 13 | Complete (13-02) |
| OUT-05 | Phase 13 | Complete (13-02) |
| CMD-01 | Phase 14 | Complete (14-01) |
| CMD-02 | Phase 14 | Complete (14-01) |
| OUT-02 | Phase 14 | Complete (14-02) |
| OUT-03 | Phase 14 | Complete (14-02) |
| CMD-03 | Phase 15 | Complete |
| CMD-04 | Phase 15 | Complete |
| CMD-05 | Phase 15 | Complete |
| CMD-06 | Phase 15 | Complete |
| CMD-07 | Phase 15 | Complete |
| CMD-08 | Phase 15 | Pending |
| OUT-04 | Phase 15 | Pending |
| DIST-01 | Phase 16 | Pending |
| DIST-02 | Phase 16 | Pending |
| DIST-03 | Phase 16 | Pending |

**Coverage:**
- v2.0 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation (Phases 12-16)*
