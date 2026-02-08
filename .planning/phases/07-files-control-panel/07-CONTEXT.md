# Phase 7: Files & Control Panel - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

File attachment tools (list, read metadata, upload) and company configuration tools (locations, tags, tag groups) completing full API surface coverage. This is the final phase — delivers all 80 v1 requirements. Current tool count is 149; Phase 7 adds new tools using the existing CRUD factory pattern.

</domain>

<decisions>
## Implementation Decisions

### File operations scope
- Include file upload (POST /files) in addition to list and read metadata — expands beyond original FILE-01/FILE-02 requirements
- File upload uses multipart/form-data (binary) — different from all other JSON-based tools. Claude's discretion on input method (file path vs base64)
- File tool descriptions should mention that files are typically attached to sales/purchase transactions — helps Claude understand when to suggest file operations
- File list filters should match whatever the API supports (discover during research), not just pagination

### Archive behavior for locations & tags
- Custom archive/unarchive tools for locations, tags, and tag groups — same pattern as contacts (Phase 4) and products (Phase 5)
- Archive tools use PATCH with is_archived boolean, consistent with established project pattern

### Tag-to-group relationship
- Tags require tag_group_id — Claude decides on the right level of workflow guidance in tool descriptions
- Tag groups include children (tags) in response — Claude decides whether both list-tags and list-tag-groups should exist or if one suffices

### Completion & verification
- Full tool inventory audit after wiring — verify complete tool count and all 80 requirements covered
- Full end-to-end UAT across all 80 requirements as final v1 validation (not just new Phase 7 tools)

### Claude's Discretion
- File upload input method (file path on disk vs base64 string) — pick most practical for MCP context
- Tag group archive cascade behavior — investigate during research, document in descriptions if relevant
- List defaults for include_archived filter — follow API's default behavior
- Delete constraints for locations, tags, tag groups — investigate during research, add guidance if warranted
- Tag workflow guidance level in create-tag description
- Whether both list-tags and list-tag-groups are needed or if one covers both use cases
- Tag tool naming convention (tag-group vs other) — follow existing project patterns
- Business context in tag descriptions — decide based on LLM tool selection usefulness

</decisions>

<specifics>
## Specific Ideas

- Tool consolidation (combining multiple action tools into one tool with action parameter) is a known concern at 149+ tools, but deferred to post-v1
- This phase follows established patterns from Phases 4-6: factory configs + custom archive tools + registry wiring
- Locations use singular path for single resource (/location/{id}) but plural for list (/locations) — watch for this API inconsistency

</specifics>

<deferred>
## Deferred Ideas

- **Tool consolidation / reduction** — Combine multiple per-entity tools (list, get, create, update, delete, update-status) into fewer tools with action parameters. Reduces total tool count significantly. Target: v1.1 milestone after v1 is complete.
- **npm publishing and README polish** — Packaging for distribution. Separate from v1 completion.

</deferred>

---

*Phase: 07-files-control-panel*
*Context gathered: 2026-02-09*
