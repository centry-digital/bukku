#!/usr/bin/env bash
# Verification harness for the bukku CLI and MCP server.
# Usage: see .claude/skills/verify-bukku/SKILL.md
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
EVIDENCE_ROOT="$REPO_ROOT/.verify/evidence"
RUN_ROOT="$REPO_ROOT/.verify/run"
CURRENT_FILE="$RUN_ROOT/current"
CLI_ENTRY="$REPO_ROOT/packages/cli/build/index.js"
MCP_ENTRY="$REPO_ROOT/packages/mcp/build/index.js"
MCP_CALL="$REPO_ROOT/.claude/skills/verify-bukku/scripts/mcp-call.mjs"

die() { echo "verify: $*" >&2; exit 1; }

load_run() {
  RUN_ID="${VERIFY_RUN_ID:-$(cat "$CURRENT_FILE" 2>/dev/null || true)}"
  [ -n "$RUN_ID" ] || die "no active run; run '$0 launch' first"
  RUN_DIR="$EVIDENCE_ROOT/$RUN_ID"
  SANDBOX="$RUN_ROOT/$RUN_ID"
  [ -d "$RUN_DIR" ] || die "evidence dir $RUN_DIR missing"
}

# Environment for every drive: a sandbox HOME so ~/.bukkurc is never the user's.
# Live credentials are only passed through when VERIFY_LIVE=1.
drive_env() {
  local -a env=(env -i "PATH=$PATH" "HOME=$SANDBOX/home" "TMPDIR=$SANDBOX/tmp")
  if [ "${VERIFY_LIVE:-0}" = "1" ]; then
    env+=("BUKKU_API_TOKEN=${BUKKU_API_TOKEN:-}" "BUKKU_COMPANY_SUBDOMAIN=${BUKKU_COMPANY_SUBDOMAIN:-}")
  fi
  printf '%s\0' "${env[@]}"
}

# record <label> <cmd...>: runs cmd with stdin passed through, saves a transcript.
record() {
  local label="$1"; shift
  local out="$RUN_DIR/$label"
  mkdir -p "$(dirname "$out")"
  local -a envcmd; mapfile -d '' envcmd < <(drive_env)
  printf '%q ' "$@" > "$out.cmd"; echo >> "$out.cmd"
  local code=0
  "${envcmd[@]}" "$@" > "$out.stdout" 2> "$out.stderr" || code=$?
  echo "$code" > "$out.exit"
  cat "$out.stdout"; cat "$out.stderr" >&2
  echo "[verify] $label exit=$code evidence=$out.{cmd,stdout,stderr,exit}" >&2
  return 0
}

cmd_launch() {
  (cd "$REPO_ROOT" && npm run build >/dev/null) || die "build failed"
  RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-$$"
  mkdir -p "$EVIDENCE_ROOT/$RUN_ID" "$RUN_ROOT/$RUN_ID/home" "$RUN_ROOT/$RUN_ID/tmp"
  echo "$RUN_ID" > "$CURRENT_FILE"
  echo "run=$RUN_ID"
  echo "evidence=$EVIDENCE_ROOT/$RUN_ID"
  echo "ready"
}

cmd_doctor() {
  load_run
  local ok=1 version expected
  check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; ok=0; fi; }
  check "node >= 20.19 ($(node -v))" 'node -e "const [a,b]=process.versions.node.split(\".\").map(Number);process.exit(a>20||(a===20&&b>=19)?0:1)"'
  check "CLI bundle exists" '[ -f "$CLI_ENTRY" ]'
  check "MCP bundle exists" '[ -f "$MCP_ENTRY" ]'
  check "MCP bundle has a single hashbang" '[ "$(head -2 "$MCP_ENTRY" | grep -c "^#!")" = "1" ]'
  check "bundles newer than sources" '[ -z "$(find "$REPO_ROOT/packages" -path "*/src/*.ts" ! -name "*.test.ts" -newer "$CLI_ENTRY" -print -quit)" ]'
  expected="$(node -p "require('$REPO_ROOT/packages/cli/package.json').version")"
  version="$(HOME="$SANDBOX/home" node "$CLI_ENTRY" --version 2>/dev/null || true)"
  check "CLI --version is $expected (got '$version')" '[ "$version" = "$expected" ]'
  check "sandbox HOME is not the real HOME" '[ -d "$SANDBOX/home" ] && [ "$SANDBOX/home" != "$HOME" ]'
  if [ "${VERIFY_LIVE:-0}" = "1" ]; then
    check "live credentials set" '[ -n "${BUKKU_API_TOKEN:-}" ] && [ -n "${BUKKU_COMPANY_SUBDOMAIN:-}" ]'
  else
    echo "info offline mode (set VERIFY_LIVE=1 with BUKKU_API_TOKEN and BUKKU_COMPANY_SUBDOMAIN for live drives)"
  fi
  echo "run=$RUN_ID evidence=$RUN_DIR"
  [ "$ok" = 1 ] || die "doctor failed"
}

# Live writes change a real company's books, so they need an explicit second opt-in.
guard_live_write() {
  [ "${VERIFY_LIVE:-0}" = "1" ] || return 0
  [ "${VERIFY_ALLOW_WRITES:-0}" = "1" ] && return 0
  local arg write=0 dry=0
  for arg in "$@"; do
    case "$arg" in
      create|update|delete|status|archive|unarchive|upload) write=1 ;;
      --dry-run) dry=1 ;;
    esac
  done
  if [ "$write" = 1 ] && [ "$dry" = 0 ]; then
    die "refusing a live write without --dry-run; set VERIFY_ALLOW_WRITES=1 only for a test company, with the owner's approval"
  fi
}

cmd_cli() {
  load_run
  local label="$1"; shift
  [ "${1:-}" = "--" ] && shift
  guard_live_write "$@"
  record "$label" node "$CLI_ENTRY" "$@"
}

cmd_mcp() {
  load_run
  local label="$1"; shift
  [ "${1:-}" = "--" ] && shift
  if [ "${1:-}" = "call" ] && [ "${VERIFY_LIVE:-0}" = "1" ] && [ "${VERIFY_ALLOW_WRITES:-0}" != "1" ]; then
    case "${2:-}" in
      list-*|get-*|search-*) ;;
      *) die "refusing live MCP tool '${2:-}': only list-*, get-* and search-* run without VERIFY_ALLOW_WRITES=1" ;;
    esac
  fi
  record "$label" node "$MCP_CALL" "$MCP_ENTRY" "$@"
}

cmd_cleanup() {
  load_run
  rm -rf "$SANDBOX"
  rm -f "$CURRENT_FILE"
  echo "removed sandbox for $RUN_ID; evidence kept at $RUN_DIR"
  ls "$RUN_DIR" >/dev/null || die "evidence missing after cleanup"
}

case "${1:-}" in
  launch) cmd_launch ;;
  doctor) cmd_doctor ;;
  cli) shift; [ $# -ge 1 ] || die "usage: cli <label> -- <bukku args>"; cmd_cli "$@" ;;
  mcp) shift; [ $# -ge 1 ] || die "usage: mcp <label> -- list | call <tool> [json-args]"; cmd_mcp "$@" ;;
  cleanup) cmd_cleanup ;;
  *) die "usage: $0 launch | doctor | cli <label> -- <args> | mcp <label> -- <args> | cleanup" ;;
esac
