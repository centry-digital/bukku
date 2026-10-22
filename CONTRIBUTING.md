# Contributing

This guide covers how every change to this repository is verified: locally, in CI, and by driving the real binaries.

## Setup

```bash
npm ci        # also installs the lefthook pre-commit hook
npm run build
```

Use Node 22 (`.nvmrc`), the version CI runs.

## 1. Before you push: `npm run verify`

It runs, in order, everything CI checks on a pull request:

| Step      | Command                 | What it catches                                                                              |
| --------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| Format    | `npm run format:check`  | Prettier formatting. `npm run format` fixes it.                                              |
| Lint      | `npm run lint`          | ESLint, zero warnings allowed. `npm run lint:fix` fixes most problems.                       |
| Build     | `npm run build`         | Type errors in source (`tsc --build`) and bundling problems (esbuild).                       |
| Typecheck | `npm run typecheck`     | Type errors in test files and `scripts/`, which the build skips.                             |
| Test      | `npm test`              | Unit and integration tests in every package, including runs of the built CLI and MCP server. |
| Parity    | `npm run verify:parity` | An MCP tool without a matching CLI command.                                                  |

The pre-commit hook checks formatting and lint on staged files. Don't skip it.

## 2. Tests

Tests use Node's built-in runner (`node:test` and `node:assert`).

- Put tests next to the code, named `*.test.ts`. Each package's `npm test` finds them.
- In `core`, import the module under test with its `.ts` extension (tests run with `--experimental-strip-types`). In `mcp` and `cli`, import with `.js`, as the source does (tests run through `tsx`).
- Tests that run a built binary (`packages/cli/src/commands/integration.test.ts`, `packages/mcp/src/startup.test.ts`) need `npm run build` first.
- Tests never call the real Bukku API. Use a dummy token, and only exercise code that fails or returns before a request is sent.
- Run one package's tests with `npm test --workspace packages/core`.

## 3. Live verification: the `verify-bukku` skill

Tests prove the code; the verify skill proves the product. For any change a user could notice (a command, a flag, output, an MCP tool, packaging), after `npm run verify` passes, drive the real binaries with [`.claude/skills/verify-bukku`](.claude/skills/verify-bukku/SKILL.md) for the features the change touches, and keep the evidence:

```bash
V=.claude/skills/verify-bukku
$V/scripts/verify.sh launch
$V/scripts/verify.sh doctor
$V/scripts/verify.sh cli journal-entry/unbalanced -- --api-token tok_verify_123 --company-subdomain demo \
  accounting journal-entries create --dry-run --data '{"date":"2026-10-22","journal_items":[{"account_id":1,"debit_amount":100},{"account_id":2,"credit_amount":90}]}'
$V/scripts/verify.sh cleanup   # evidence stays in .verify/evidence/<run id>/
```

- Recipes for each feature are in [`features/`](.claude/skills/verify-bukku/features/README.md). Add or update the matching file in the same branch as the change.
- Offline by default. Live calls need a Bukku **test company** token; writes need a second, explicit opt-in. Never use a client's books.
- In Claude Code: `/create-verification-skill` generates a verify skill for a new surface, and `/maintain-verification-skill` audits the existing one against the code (run it after a feature lands or the CLI/MCP surface changes).

## 4. Pull requests

1. Branch from `main` (`feat/…`, `fix/…`, `chore/…`, `docs/…`). Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
2. Run `npm run verify`, then the verify skill for user-facing changes.
3. Open a PR and fill in the template. The **Verification evidence** section is required: the `pr-hygiene` check fails if it is missing or empty. For a change with no user-facing behaviour, say so and why.
4. CI must be green: `format`, `lint`, `typecheck`, `unit`, `build`, `parity`, `deps-audit`, `secret-scan` and `pr-hygiene`.
5. Claude reviews every PR. Resolve every review thread (fix it, or reply with reasoning) before merging. PRs are squash-merged.

### Definition of done

- [ ] All CI checks are green.
- [ ] New behaviour and bug fixes have tests (a bug fix's test fails without the fix).
- [ ] User-facing changes have verify-skill evidence in the PR, and the matching `features/` file is up to date.
- [ ] READMEs are updated if user-facing behaviour changed.
- [ ] Package versions are bumped if the change will be released.

## Releasing

See the comments at the top of [`.github/workflows/publish.yml`](.github/workflows/publish.yml). Publishing to npm runs `npm run verify` again first. After publishing, check the release works with `npx @centry-digital/bukku-mcp@<version>` (it should print the setup checklist, not a `SyntaxError`) and `npx @centry-digital/bukku-cli@<version> --version`.
