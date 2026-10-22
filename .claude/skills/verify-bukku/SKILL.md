---
name: verify-bukku
description: Build the bukku CLI (`bukku`) and MCP server (`bukku-mcp`) and drive them the way a user does, in a sandboxed HOME, capturing command transcripts and exit codes as evidence. Offline by default (dry-runs, validation, config, startup); live read-only calls against a Bukku test company when credentials are given. Use it to prove a user-facing change works (CONTRIBUTING.md "Verification evidence"), to reproduce a bug, or whenever you need to see the real binaries run.
---

# Verify bukku

The product has two surfaces, both thin layers over `packages/core` and the Bukku REST API at `https://api.bukku.my` (hard-coded, no local stand-in):

- **CLI** `bukku` (`packages/cli`, published as `@centry-digital/bukku-cli`). Short-lived: one process per command, JSON on stdout, a JSON error and a non-zero exit code on failure. Credentials come from `--api-token`/`--company-subdomain`, then `BUKKU_API_TOKEN`/`BUKKU_COMPANY_SUBDOMAIN`, then `~/.bukkurc`.
- **MCP server** `bukku-mcp` (`packages/mcp`, published as `@centry-digital/bukku-mcp`). Spoken to over stdio by an AI client. It needs both env vars and calls the API to validate the token **before** it lists any tools, so without real credentials only its startup error can be driven.

All helpers live in `.claude/skills/verify-bukku/scripts/`. Run them from the repo root. Below, `V=.claude/skills/verify-bukku`.

## Launch

Prerequisites: Node 22 (`.nvmrc`), `npm ci` done.

```bash
$V/scripts/verify.sh launch
```

- Runs `npm run build`, creates a run id, an evidence folder `.verify/evidence/<run id>/` and a sandbox `.verify/run/<run id>/` holding a throwaway `HOME` (so `~/.bukkurc` is never the user's) and `TMPDIR`.
- Ready when it prints `ready`. The run id is saved in `.verify/run/current`; every other command uses it (or `VERIFY_RUN_ID` if set).
- There is no server to keep alive: each `cli` or `mcp` drive below is its own process. Runs don't share state, but only one run is "current" per checkout.

**Live mode.** By default every drive runs with no Bukku credentials in its environment. For a live drive, export `BUKKU_API_TOKEN` and `BUKKU_COMPANY_SUBDOMAIN` for a **test company** (never a client's books) and set `VERIFY_LIVE=1`. Even then the harness refuses any CLI write that lacks `--dry-run` and any MCP tool other than `list-*`, `get-*` and `search-*`, unless `VERIFY_ALLOW_WRITES=1` is also set. Set that only when the repo owner has approved writes to that test company for this run.

## Doctor

```bash
$V/scripts/verify.sh doctor
```

Read-only. Checks Node, that both bundles exist and are newer than every source file, that the MCP bundle has exactly one hashbang (two made the published 2.0.3 crash on start), that `bukku --version` matches `packages/cli/package.json`, that the sandbox `HOME` is not the real one, and in live mode that credentials are set. Any `FAIL` means relaunch (or rebuild) before driving. Run it first, and again after any drive that surprised you.

## Drive

```bash
$V/scripts/verify.sh cli <label> -- <bukku args...>        # stdin is passed through
$V/scripts/verify.sh mcp <label> -- list                   # tool names and count
$V/scripts/verify.sh mcp <label> -- call <tool> '<json>'   # one tool call
$V/scripts/verify.sh install                               # pack and install the npm tarballs
```

- `<label>` names the evidence files, e.g. `journal-entry/unbalanced`. Use `<feature-id>/<step>`.
- `cli` runs `node packages/cli/build/index.js <args>`; `mcp` spawns `node packages/mcp/build/index.js` through `scripts/mcp-call.mjs`, a minimal MCP SDK client (exit 2 if the server never connected, 1 if the tool returned an error).
- `install` packs both published packages and installs the tarballs into the sandbox. Then `VERIFY_INSTALLED=1` makes `cli`, `mcp` and `doctor` drive the installed packages instead of the repo build (see `features/packaging.md`).
- Pass JSON bodies to write commands with `--data '<json>'` (a JSON string, not a file path) or on stdin.
- Results are JSON on stdout; errors are JSON on **stderr** (`{"error","code","details"}`). Assert on stable handles: exit codes (0 ok, 1 general, 2 auth, 3 API, 4 validation; `packages/cli/src/output/error.ts`), the JSON `code` field (`AUTH_MISSING`, `VALIDATION_ERROR`, …), command names and MCP tool names. Not on free-text messages.

## Evidence

Every drive writes four files to `.verify/evidence/<run id>/<label>.*`: `.cmd` (the exact command), `.stdout`, `.stderr` and `.exit`. A one-line `[verify] <label> exit=N evidence=…` goes to stderr.

Proof standards:

- Drive the real binary as a user would. Calling `core` functions or test helpers is not proof.
- Capture the action and the result: for a write, the dry-run request body, plus (live) a second read-only `get` showing the stored record.
- A dry-run must be shown to skip the network: it prints the request and exits 0 with no credentials check against the API. Don't infer that from the flag name.
- Tokens are masked (`abc****`) in dry-run output and `config show`. Never paste a real token into a label, PR or evidence.

For a PR's **Verification evidence**, list the run id, the labels you drove and what each proves, and paste the key `.stdout` lines.

## Cleanup

```bash
$V/scripts/verify.sh cleanup
```

Deletes this run's sandbox (`.verify/run/<run id>/`, including any `.bukkurc` written there) and the `current` pointer. **Evidence in `.verify/evidence/` is kept** (git-ignored). Nothing else needs stopping: drives don't outlive their command. If a live drive created records in the test company, delete them with the matching `delete` command (live writes allowed) and record that in the evidence.

## Helpers

| Helper                                                    | Does                                                    |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `scripts/verify.sh launch`                                | Build, create run id, evidence folder and sandbox       |
| `scripts/verify.sh doctor`                                | Read-only health check of build and sandbox             |
| `scripts/verify.sh cli <label> -- …`                      | Run the CLI in the sandbox and record it                |
| `scripts/verify.sh mcp <label> -- list \| call …`         | Run the MCP server through `mcp-call.mjs` and record it |
| `scripts/verify.sh install`                               | Pack and install the npm tarballs into the sandbox      |
| `scripts/verify.sh cleanup`                               | Remove the sandbox, keep evidence                       |
| `scripts/mcp-call.mjs <entry> list \| call <tool> [json]` | Minimal MCP stdio client (used by `verify.sh mcp`)      |

## Feature map

Recipes live in [`features/`](features/README.md). Read the index first. Keep it current with `/maintain-verification-skill`.
