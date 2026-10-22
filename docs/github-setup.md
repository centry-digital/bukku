# GitHub set-up guide

This guide configures `centry-digital/bukku` on GitHub so that `main` is always releasable. Do these steps once; they need a **repository admin** or **organisation owner**. It follows the same pattern as centry-app's guide, minus what doesn't apply here (self-hosted runners, databases, Docker, end-to-end tests).

**This repository is public.** That changes three things compared with the private repositories: CI must only ever run on GitHub's own machines (free for public repositories), pull requests from forks need approval before their workflows run, and GitHub's secret scanning, push protection and CodeQL are free here.

GitHub occasionally renames menu items. If a label doesn't match exactly, look for the closest equivalent on the same page.

> **When to do each part.** Parts 1, 2, 3 and 5 can be done now. Part 4 (required checks) can only be finished after the CI pull request has run once, because GitHub only lets you pick checks it has already seen.

---

## Part 1: Claude GitHub App and secret

`/install-github-app` was run on 22 Oct 2026 (PR #3), so this part is about checking it.

1. **App installed.** [Organisation settings → GitHub Apps](https://github.com/organizations/centry-digital/settings/installations) should list **Claude** with access to `bukku`.
2. **Secret.** [Settings → Secrets and variables → Actions](https://github.com/centry-digital/bukku/settings/secrets/actions) should have the repository secret `CLAUDE_CODE_OAUTH_TOKEN`. If it's missing or expired, run `claude setup-token` in Claude Code, then **New repository secret** with that name. Never add an `ANTHROPIC_API_KEY`.
3. Workflows started by Dependabot or by a fork's pull request can't read this secret, so the Claude review skips those PRs; CI still checks them.
4. **Issue triage** (`claude-issue-triage.yml`) runs on every new issue, from anyone, using the workflow's own short-lived token limited to reading code and writing issues; its replies come from `github-actions[bot]`. Fixes need a collaborator's `@claude fix this` (`claude.yml`), which can push `claude/` branches and open PRs but never merge: the `main protection` ruleset still applies. Its PRs also have to pass `guarded-paths` (`guarded-paths.yml`), which fails if Claude changed workflows, dependencies, build, lint or security settings, `CLAUDE.md` or the skills, so a merge on your say-so can only change product code and tests. `guarded-paths` only appears in the check list after it has run once, so add it to the ruleset after its first run.

## Part 2: Actions permissions

Go to [Settings → Actions → General](https://github.com/centry-digital/bukku/settings/actions). If a setting is greyed out, the organisation controls it: make the change in [Organisation settings → Actions → General](https://github.com/organizations/centry-digital/settings/actions).

1. **Actions permissions:** "Allow _organisation_, and select non-_organisation_, actions and reusable workflows", then:
   - tick **Allow actions created by GitHub** (`actions/checkout`, `actions/setup-node`, `actions/github-script`);
   - leave **Allow actions by Marketplace verified creators** unticked;
   - in **Allow specified actions and reusable workflows**, enter `anthropics/claude-code-action@*, oven-sh/setup-bun@*` (`setup-bun` is used inside the Claude action).
     gitleaks runs as a Docker image, so it needs no entry. If a later PR adds an action, it must add it here and to this document.
2. **Require actions to be pinned to a full-length commit SHA:** turn on if offered. Every workflow pins its actions to SHAs, and Dependabot keeps the pins up to date.
3. **Fork pull request workflows from outside collaborators:** "Require approval for all external contributors". On a public repository this stops strangers running workflows without you looking first.
4. **Workflow permissions:** "Read repository contents and packages permissions". Untick "Allow GitHub Actions to create and approve pull requests".

## Part 3: Merge settings

Go to [Settings → General → Pull Requests](https://github.com/centry-digital/bukku/settings).

1. Untick **Allow merge commits** and **Allow rebase merging**. Tick **Allow squash merging**, default message "Pull request title and description".
2. Tick **Always suggest updating pull request branches** and **Automatically delete head branches**.
3. **Allow auto-merge** is optional.

## Part 4: Ruleset for `main`

Go to [Settings → Rules → Rulesets → New branch ruleset](https://github.com/centry-digital/bukku/settings/rules/new?target=branch).

1. **Name:** `main protection`. **Enforcement status:** Active.
2. **Bypass list:** empty.
3. **Target branches:** Add target → Include default branch.
4. **Rules**, ticked:
   - **Restrict deletions** and **Block force pushes**
   - **Require linear history**
   - **Require a pull request before merging**, with **Required approvals: 0** (you are the only human reviewer and can't approve your own PRs; raise to 1 when a second developer joins), **Dismiss stale approvals** on, **Require conversation resolution before merging** on (this is what enforces the Claude review), **Allowed merge methods:** Squash.
   - **Require status checks to pass**, with **Require branches to be up to date** off, and these checks added (names must match exactly):

     | Required check  | What it proves                                                                        |
     | --------------- | ------------------------------------------------------------------------------------- |
     | `format`        | Prettier formatting is clean                                                          |
     | `lint`          | ESLint passes with zero warnings                                                      |
     | `typecheck`     | Source, tests and scripts type-check                                                  |
     | `unit`          | All package tests pass, including runs of the built binaries                          |
     | `build`         | Both packages build, publish without the internal `core` dependency, and start        |
     | `parity`        | Every MCP tool has a CLI command                                                      |
     | `deps-audit`    | No high or critical advisories in production dependencies                             |
     | `secret-scan`   | gitleaks finds no committed secrets in the full history                               |
     | `pr-hygiene`    | The PR description has a non-empty "Verification evidence" section                    |
     | `guarded-paths` | A Claude-written PR doesn't touch workflows, dependencies, build or security settings |

     Don't add `claude-review` or `claude`: subscription rate limits could block merges.
5. Click **Create**. Then check it: a test PR's **Merge** button stays disabled until every check is green and every conversation is resolved.

The old CI job was called `CI`. If an earlier branch protection rule requires `CI`, remove that rule (Settings → Branches) once the ruleset is active, or every PR will wait for a check that no longer runs.

## Part 5: Security features

Go to [Settings → Advanced Security](https://github.com/centry-digital/bukku/settings/security_analysis) (may be called **Code security**). All free on a public repository; turn on:

- **Dependency graph**, **Dependabot alerts**, **Dependabot security updates** and **Grouped security updates**. Version updates come from `.github/dependabot.yml` (npm and GitHub Actions, weekly on Mondays).
- **Secret scanning** and **Push protection**, which stops a secret before it's pushed (gitleaks in CI catches anything that gets through at PR time).
- **Code scanning → CodeQL analysis → Set up → Default**. Then add **Require code scanning results** (CodeQL, "High or higher") to the `main protection` ruleset.
- **Private vulnerability reporting**, so people can report security issues without opening a public issue.

## Part 6: npm publishing

`publish.yml` publishes both packages with npm trusted publishing (OIDC) when a GitHub release is published. On [npmjs.com](https://www.npmjs.com/), each package's **Settings → Trusted publishing** must name `centry-digital/bukku` and the workflow file `publish.yml`. Check this before the next release; no npm token secret is needed.

## Part 7: Check it all

- [ ] Claude app installed and `CLAUDE_CODE_OAUTH_TOKEN` exists.
- [ ] Actions allow-list: GitHub-made actions plus `anthropics/claude-code-action@*` and `oven-sh/setup-bun@*`; fork PRs need approval; workflow permissions read-only.
- [ ] Squash merging only; head branches deleted automatically.
- [ ] `main protection` ruleset active, no bypass, conversation resolution on, the 9 required checks above, and no leftover rule requiring `CI`.
- [ ] Dependabot, secret scanning with push protection, CodeQL and private vulnerability reporting on.
- [ ] Trusted publishing set for both npm packages.
- [ ] A test PR can't merge while a check is red or a review thread is open.
