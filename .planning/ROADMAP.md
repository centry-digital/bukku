# Roadmap: Bukku MCP Server

**Created:** 2026-02-06

## Milestones

- ✅ **v1.0 MVP** - Phases 1-7 (shipped 2026-02-09)
- ✅ **v1.1 npm Package Release** - Phases 8-11 (shipped 2026-02-10)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) - SHIPPED 2026-02-09</summary>

- [x] Phase 1: Foundation Infrastructure (5 plans) -- completed 2026-02-07
- [x] Phase 2: Sales Category (3 plans) -- completed 2026-02-08
- [x] Phase 3: Purchases Category (3 plans) -- completed 2026-02-08
- [x] Phase 4: Banking & Contacts (2 plans) -- completed 2026-02-08
- [x] Phase 5: Products & Lists (4 plans) -- completed 2026-02-08
- [x] Phase 6: Accounting (4 plans) -- completed 2026-02-08
- [x] Phase 7: Files & Control Panel (4 plans) -- completed 2026-02-09

**Total:** 80 requirements, 25 plans, 169 MCP tools
**Archive:** [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### ✅ v1.1 npm Package Release (Shipped 2026-02-10)

**Milestone Goal:** Publish @centry-digital/bukku-mcp on npm with CI/CD automation and npx support for zero-install usage.

#### Phase 8: Package Configuration
**Goal**: Package is ready for npm publication under @centry-digital scope
**Depends on**: Nothing (starts v1.1)
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04
**Success Criteria** (what must be TRUE):
  1. Package has scoped name @centry-digital/bukku-mcp configured in package.json
  2. Package metadata (author, repository, homepage, keywords) is complete and accurate
  3. .npmignore excludes planning/dev files and only ships build output + essentials
  4. Package declares minimum Node.js version requirement
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md — Configure package.json metadata and create .npmignore

#### Phase 9: Build & Distribution
**Goal**: Users can install and run the package via npm or npx
**Depends on**: Phase 8
**Requirements**: DIST-01, DIST-02, DIST-03
**Success Criteria** (what must be TRUE):
  1. User can run `npm install -g @centry-digital/bukku-mcp` and execute the server
  2. User can run `npx @centry-digital/bukku-mcp` with zero prior installation
  3. Built output includes correct shebang and bin mapping for CLI execution
**Plans**: 1 plan

Plans:
- [x] 09-01-PLAN.md — Add lifecycle scripts and verify end-to-end distribution flow

#### Phase 10: CI/CD Automation
**Goal**: GitHub Actions automates testing on PRs and publishing on releases
**Depends on**: Phase 9
**Requirements**: CICD-01, CICD-02, CICD-03
**Success Criteria** (what must be TRUE):
  1. Pull requests to main trigger automated test runs in GitHub Actions
  2. Creating a GitHub release tag automatically publishes the package to npm
  3. Version bumps can be created via npm version commands (patch/minor/major)
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — CI/CD workflows for PR testing and npm publish on release

#### Phase 11: Documentation
**Goal**: README provides complete installation, configuration, and usage guidance
**Depends on**: Phase 10
**Requirements**: DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):
  1. README explains both npm global install and npx usage with example commands
  2. README documents environment variable setup and Claude Desktop/Code configuration
  3. README includes tool categories overview and usage examples
**Plans**: 1 plan

Plans:
- [x] 11-01-PLAN.md — Restructure README around npm distribution with Quick Start, config, and usage docs

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 8. Package Configuration | v1.1 | 1/1 | ✓ Complete | 2026-02-09 |
| 9. Build & Distribution | v1.1 | 1/1 | ✓ Complete | 2026-02-09 |
| 10. CI/CD Automation | v1.1 | 1/1 | ✓ Complete | 2026-02-09 |
| 11. Documentation | v1.1 | 1/1 | ✓ Complete | 2026-02-10 |
