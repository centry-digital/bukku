---
phase: 07-files-control-panel
plan: 02
subsystem: control-panel
tags: [entity-configs, custom-tools, archive, location, tag, tag-group]
dependency_graph:
  requires: [01-core-infrastructure]
  provides: [location-crud, tag-crud, tag-group-crud, control-panel-archive]
  affects: [registry]
tech_stack:
  added: []
  patterns: [custom-tools-for-path-inconsistency, archive-via-patch]
key_files:
  created:
    - src/tools/configs/location.ts
    - src/tools/configs/tag.ts
    - src/tools/configs/tag-group.ts
    - src/tools/custom/location-tools.ts
    - src/tools/custom/control-panel-archive.ts
  modified: []
decisions: []
metrics:
  duration: 141 seconds
  completed: 2026-02-08T16:40:02Z
---

# Phase 07 Plan 02: Control Panel Entity Configs & Custom Tools Summary

**One-liner:** Entity configs for locations, tags, and tag groups with custom tools for location path inconsistency (/location/{id} singular) and archive operations via PATCH is_archived

## What Was Built

Created complete CRUD tooling for three control panel entities:

**Entity Configs:**
1. **locationConfig** - List and create only (get/update/delete handled by custom tools due to API path inconsistency)
2. **tagConfig** - Full CRUD operations (paths consistent)
3. **tagGroupConfig** - Full CRUD operations (paths consistent)

**Custom Tools:**
1. **location-tools.ts** - 3 tools (get-location, update-location, delete-location) using singular `/location/{id}` path
2. **control-panel-archive.ts** - 6 tools for archive/unarchive operations across all three entities using PATCH with `is_archived: boolean`

## Key Implementation Details

### Location API Path Inconsistency

The Bukku API has an inconsistent path pattern for locations:
- List/Create: `/locations` (plural)
- Get/Update/Delete: `/location/{id}` (singular)

This breaks the factory pattern assumption that all single-item operations use `{apiBasePath}/{id}`. Solution:
- Location config only enables `["list", "create"]` operations
- Custom tools in `location-tools.ts` handle get/update/delete with the correct singular path

### Archive Pattern

All three entities use `PATCH {path}/{id}` with `{ is_archived: boolean }` for archive/unarchive operations:
- Locations: `PATCH /location/{id}`
- Tags: `PATCH /tags/{id}`
- Tag Groups: `PATCH /tags/groups/{id}`

This differs from the factory status update pattern, requiring custom tools.

### Business Rules

**Tags:**
- Must belong to a tag group
- Tool description guides users to `list-tag-groups` to find `tag_group_id`
- Delete may fail if referenced by transactions (archive instead)

**Tag Groups:**
- Contain tags as children
- List response includes nested tag arrays
- Delete may fail if contains tags or referenced by transactions

**Locations:**
- Enable multi-branch accounting
- Delete may fail if referenced by transactions (archive instead)

## Task Breakdown

### Task 1: Create Entity Configs
**Files:** `location.ts`, `tag.ts`, `tag-group.ts`
**Commit:** `17d6e6a`

Created three `CrudEntityConfig` objects:
- locationConfig: list + create operations, include_archived filter
- tagConfig: full CRUD, empty listFilters, delete business rule
- tagGroupConfig: full CRUD, include_archived filter, delete business rule

All configs follow `CrudEntityConfig` type with proper descriptions and business rules.

### Task 2: Create Custom Tools
**Files:** `location-tools.ts`, `control-panel-archive.ts`
**Commit:** `12e54d0`

Created 9 custom tools total:
- 3 location tools (get/update/delete) using `/location/${id}` singular path
- 6 archive tools (2 per entity) using PATCH with `is_archived` boolean

All tools follow project error handling patterns with `transformHttpError` and `transformNetworkError`.

## Verification Results

**TypeScript Compilation:** ✓ Passed (`npx tsc --noEmit`)

**Config Verification:**
- ✓ Location config has operations: ["list", "create"] only
- ✓ Tag config has full CRUD operations
- ✓ Tag group config has full CRUD operations
- ✓ Tag description mentions using list-tag-groups for tag_group_id

**Custom Tools Verification:**
- ✓ Location tools use `/location/${params.id}` (singular path)
- ✓ Archive tools use correct paths per entity
- ✓ All archive tools send `{ is_archived: boolean }` via PATCH

## Deviations from Plan

None - plan executed exactly as written.

## Tool Count Impact

**Total new tools when wired:** 21 tools
- Location: 2 factory (list, create) + 3 custom (get, update, delete) + 2 archive = 7 tools
- Tag: 5 factory (list, get, create, update, delete) + 2 archive = 7 tools
- Tag Group: 5 factory (list, get, create, update, delete) + 2 archive = 7 tools

**Current state:** Tools created but not yet wired into registry (next plan: 07-03).

## Next Steps

Plan 07-03 will wire these configs and custom tools into the registry alongside file entity tools from plan 07-01.

## Self-Check: PASSED

**Created files verified:**
```
FOUND: src/tools/configs/location.ts
FOUND: src/tools/configs/tag.ts
FOUND: src/tools/configs/tag-group.ts
FOUND: src/tools/custom/location-tools.ts
FOUND: src/tools/custom/control-panel-archive.ts
```

**Commits verified:**
```
FOUND: 17d6e6a - Task 1: Entity configs
FOUND: 12e54d0 - Task 2: Custom tools
```

**Export verification:**
- ✓ locationConfig exported from location.ts
- ✓ tagConfig exported from tag.ts
- ✓ tagGroupConfig exported from tag-group.ts
- ✓ registerLocationTools exported from location-tools.ts (returns 3)
- ✓ registerControlPanelArchiveTools exported from control-panel-archive.ts (returns 6)
