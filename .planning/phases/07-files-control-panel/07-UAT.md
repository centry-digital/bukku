---
status: diagnosed
phase: 07-files-control-panel
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md
started: 2026-02-09T12:00:00Z
updated: 2026-02-09T02:44:00Z
---

## Current Test

[testing complete]

## Tests

### 1. List Files
expected: Using the `list-files` tool returns file records from your Bukku account with metadata (name, type, ID).
result: pass

### 2. Get File by ID
expected: Using `get-file` with a valid file ID returns detailed metadata for that specific file (name, size, type, URL/path).
result: pass

### 3. Upload File
expected: Using `upload-file` with a local file path uploads the file to Bukku. The tool returns the new file's metadata including its assigned ID.
result: pass

### 4. List Locations
expected: Using `list-locations` returns location records from your Bukku account. Each location includes name and ID. The `include_archived` filter parameter is available.
result: pass

### 5. Create and Get Location
expected: Using `create-location` with a name creates a new location. Using `get-location` with the returned ID retrieves the same location details.
result: skipped
reason: Bukku subscription plan does not include location management (create returns "not included in your subscription plan", get returns 404 for existing ID)

### 6. Update and Delete Location
expected: Using `update-location` modifies a location's name. Using `delete-location` removes it (only if not referenced by transactions).
result: skipped
reason: Bukku subscription plan does not include location management (update returns unknown status code error)

### 7. Archive and Unarchive Location
expected: Using `archive-location` sets the location as archived. Using `unarchive-location` restores it. Archived locations are hidden from default listing but visible with `include_archived` filter.
result: skipped
reason: Bukku subscription plan does not include location management (PATCH /location/{id} returns unknown status code). Note: unlike tags/tag groups, the PATCH endpoint IS defined in the API spec for locations.

### 8. List Tag Groups
expected: Using `list-tag-groups` returns tag group records. Each group includes name, ID, and may include nested tags. The `include_archived` filter is available.
result: pass

### 9. Create and Manage Tag Group
expected: Using `create-tag-group` with a name creates a new tag group. `get-tag-group`, `update-tag-group`, and `delete-tag-group` work for CRUD operations on the group.
result: pass

### 10. Archive and Unarchive Tag Group
expected: Using `archive-tag-group` archives the group. Using `unarchive-tag-group` restores it.
result: issue
reported: "archive-tag-group returns fallback error (unknown status code). API spec (control-panel.yaml) defines PATCH only for /location/{id}, NOT for /tags/groups/{id}. The PATCH endpoint does not exist for tag groups."
severity: major

### 11. Create and Manage Tags
expected: Using `create-tag` with a name and `tag_group_id` creates a tag within a group. `list-tags`, `get-tag`, `update-tag`, and `delete-tag` provide full CRUD. The tool description guides users to find tag_group_id via `list-tag-groups`.
result: pass

### 12. Archive and Unarchive Tag
expected: Using `archive-tag` archives the tag. Using `unarchive-tag` restores it.
result: issue
reported: "archive-tag fails with Zod validation error (id expected number, received string) AND the underlying PATCH /tags/{id} endpoint does not exist in the API spec. Same issue as tag groups — API only defines PATCH for /location/{id}."
severity: major

## Summary

total: 12
passed: 6
issues: 2
pending: 0
skipped: 3

## Gaps

- truth: "archive-tag-group and unarchive-tag-group toggle is_archived on tag groups"
  status: failed
  reason: "PATCH /tags/groups/{id} endpoint does not exist in Bukku API. API spec only defines PATCH for /location/{id}. Archive tools for tag groups use a non-existent endpoint."
  severity: major
  test: 10
  root_cause: "Bukku API does not define PATCH endpoints for /tags/groups/{id}. The tagPatch requestBody schema exists in control-panel.yaml (line 466) but is orphaned — not referenced by any path. No tagGroupPatch schema exists at all. The archive pattern was incorrectly assumed to apply uniformly to all control panel entities."
  artifacts:
    - path: "src/tools/custom/control-panel-archive.ts"
      issue: "Lines 150-209: archive-tag-group and unarchive-tag-group call PATCH on non-existent endpoint"
    - path: "src/tools/registry.ts"
      issue: "registerControlPanelArchiveTools returns 6 but should return 2 after removing tag/tag-group archive tools"
  missing:
    - "Remove archive-tag-group and unarchive-tag-group tool definitions from control-panel-archive.ts"
    - "Update registerControlPanelArchiveTools return count from 6 to 2"
    - "Update registry JSDoc tool counts (Phase 7: 24 -> 20, Total: 173 -> 169)"
  debug_session: ".planning/debug/tag-archive-no-patch-endpoint.md"

- truth: "archive-tag and unarchive-tag toggle is_archived on tags"
  status: failed
  reason: "PATCH /tags/{id} endpoint does not exist in Bukku API. Additionally, archive-tag has Zod type coercion issue (id received as string). API spec only defines PATCH for /location/{id}."
  severity: major
  test: 12
  root_cause: "Same as test 10 — Bukku API does not define PATCH for /tags/{id}. The tagPatch schema is orphaned. Secondary issue: z.number() in archive-tag is fragile when LLM sends id as string; z.coerce.number() would be more resilient but this is moot since the tools need removal."
  artifacts:
    - path: "src/tools/custom/control-panel-archive.ts"
      issue: "Lines 88-148: archive-tag and unarchive-tag call PATCH on non-existent endpoint"
  missing:
    - "Remove archive-tag and unarchive-tag tool definitions from control-panel-archive.ts"
  debug_session: ".planning/debug/tag-archive-patch-missing.md"
