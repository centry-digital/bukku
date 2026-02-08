# Phase 7: Files & Control Panel - Research

**Researched:** 2026-02-09
**Domain:** File attachments and company configuration (locations, tags, tag groups)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### File operations scope
- Include file upload (POST /files) in addition to list and read metadata — expands beyond original FILE-01/FILE-02 requirements
- File upload uses multipart/form-data (binary) — different from all other JSON-based tools. Claude's discretion on input method (file path vs base64)
- File tool descriptions should mention that files are typically attached to sales/purchase transactions — helps Claude understand when to suggest file operations
- File list filters should match whatever the API supports (discover during research), not just pagination

#### Archive behavior for locations & tags
- Custom archive/unarchive tools for locations, tags, and tag groups — same pattern as contacts (Phase 4) and products (Phase 5)
- Archive tools use PATCH with is_archived boolean, consistent with established project pattern

#### Tag-to-group relationship
- Tags require tag_group_id — Claude decides on the right level of workflow guidance in tool descriptions
- Tag groups include children (tags) in response — Claude decides whether both list-tags and list-tag-groups should exist or if one suffices

#### Completion & verification
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

### Deferred Ideas (OUT OF SCOPE)
- **Tool consolidation / reduction** — Combine multiple per-entity tools (list, get, create, update, delete, update-status) into fewer tools with action parameters. Reduces total tool count significantly. Target: v1.1 milestone after v1 is complete.
- **npm publishing and README polish** — Packaging for distribution. Separate from v1 completion.

</user_constraints>

## Summary

Phase 7 completes full Bukku API surface coverage by adding file attachment tools (list, get metadata, upload) and company configuration tools (locations, tags, tag groups). This is the final phase delivering all 80 v1 requirements. Research confirms these entities follow established patterns with two notable exceptions: files require custom multipart/form-data upload handling (the only non-JSON operation in the entire API), and the singular/plural path inconsistency for locations (/location/{id} vs /locations).

**File operations:** The Bukku API provides three file endpoints: GET /files (list), GET /files/{id} (metadata), and POST /files (upload). Files use a unique multipart/form-data request format requiring special client method implementation. The list endpoint has no query parameters beyond what GET inherently supports — no pagination, no filters, no search. Files are typically attached to sales/purchase transactions via file_ids arrays.

**Control panel entities:** Locations, tags, and tag groups provide organizational metadata for multi-branch accounting and transaction categorization. All three follow the standard CRUD pattern with custom response wrapper keys and archive operations via PATCH with is_archived boolean (identical to contacts and products). Tags have a required parent-child relationship with tag groups via tag_group_id. The tag groups list endpoint includes nested children arrays containing full tag objects, making it the authoritative source for the complete tag hierarchy.

**API path inconsistency:** Locations use singular /location/{id} for get/update/patch/delete but plural /locations for create/list — the only entity with this inconsistency. All other entities use consistent singular or plural paths.

**Primary recommendation:** Use factory pattern for all entities except file upload. Implement custom upload-file tool with multipart/form-data handling using Node.js native FormData and File APIs (Node 18+ support). Both list-tags and list-tag-groups should exist: list-tags for flat tag arrays (quick lookups), list-tag-groups for hierarchical views with nested children. Add custom archive/unarchive tools for locations, tags, and tag groups following the established pattern from contacts and products.

## Standard Stack

Phase 7 builds entirely on existing infrastructure — zero new dependencies required.

### Existing Infrastructure (from Phase 1)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| CRUD Factory | `src/tools/factory.ts` | Generates up to 6 tools per entity config | Complete, tested with 25+ entities (149 tools) |
| BukkuClient | `src/client/bukku-client.ts` | HTTP client with get/post/put/patch/delete methods | Complete — needs postMultipart addition for file upload |
| Error Transformer | `src/errors/transform.ts` | Converts HTTP errors to conversational messages | Complete, handles all status codes |
| Type System | `src/types/bukku.ts` | CrudEntityConfig, BukkuPaginatedResponse, etc. | Complete, supports factory pattern |
| Tool Registry | `src/tools/registry.ts` | Orchestrates tool registration | Complete — needs Phase 7 imports |

### What Phase 7 Adds

**File Entity Configuration:** 1 CrudEntityConfig for files with list/get operations only (create handled by custom tool)

**Control Panel Configurations:** 3 CrudEntityConfig objects for locations, tags, tag groups (standard CRUD operations)

**Custom File Upload Tool:** Standalone tool handling multipart/form-data using Node.js native FormData/File APIs

**Custom Archive Tools:** 6 tools (archive/unarchive for locations, tags, tag groups) following Phase 4/5 pattern

**BukkuClient Extension:** Add postMultipart method for file upload handling

**No new npm dependencies required.** Node.js 18+ includes native FormData and File support for multipart uploads.

## Architecture Patterns

### Pattern 1: File Entity Configuration (List & Get Only)

**What:** CrudEntityConfig for files with operations limited to list and get — no create/update/delete in factory

**Why different:** File creation requires multipart/form-data, not JSON. The factory's generic z.record(z.string(), z.unknown()) schema doesn't handle binary file uploads.

**Structure verified from OpenAPI files.yaml:**
```typescript
// Source: .api-specs/files.yaml + src/tools/configs/contact.ts pattern

export const fileConfig: CrudEntityConfig = {
  entity: "file",
  apiBasePath: "/files",
  singularKey: "file",
  pluralKey: "files",
  description: "file. Files are typically attached to sales and purchase transactions using file_ids arrays.",
  operations: ["list", "get"],  // No create — handled by custom upload-file tool
  hasStatusUpdate: false,
  listFilters: [],  // API spec shows no query parameters for GET /files
  businessRules: {
    // Files have no delete endpoint in API — must be permanent
  },
};
```

**Key API characteristics discovered:**
- **List endpoint (GET /files):** Returns array of file objects with no pagination support, no filtering, no search — returns ALL files
- **Get endpoint (GET /files/{fileId}):** Returns single file metadata (id, filename, url, mime_type, size, timestamps)
- **Response wrapper:** Uses `file` (singular) and `files` (plural) — NOT transaction/transactions
- **No delete:** API spec has no DELETE /files endpoint — files are permanent once uploaded
- **No update:** API spec has no PUT or PATCH endpoints — files are immutable after upload

### Pattern 2: Custom File Upload Tool with Multipart/Form-Data

**What:** Standalone MCP tool handling binary file upload using Node.js native FormData

**Why custom:** File upload is the only multipart/form-data operation in the entire Bukku API. All other 149 tools use JSON. Factory pattern doesn't support binary uploads.

**Critical implementation requirements:**
1. **Use file path input:** MCP context makes local file paths most practical — Claude can reference files by path
2. **Node.js native APIs:** Use built-in FormData and File (Node 18+) — no external dependencies
3. **Don't set Content-Type header manually:** Let fetch set multipart/form-data boundary automatically
4. **MIME type detection:** Use file extension or fallback to application/octet-stream
5. **Error handling:** Reuse transformHttpError/transformNetworkError pattern

**Example structure:**
```typescript
// Source: Verified from files.yaml + Node.js multipart patterns
// Location: src/tools/custom/file-upload.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

export function registerFileUploadTool(
  server: McpServer,
  client: BukkuClient
): number {
  server.tool(
    "upload-file",
    "Upload a file to Bukku. Returns file object with id, url, and metadata. Use the returned file id in transaction file_ids arrays to attach files to sales/purchase documents.",
    {
      file_path: z.string().describe("Absolute path to the file on disk"),
    },
    async (params) => {
      try {
        // Implementation uses client.postMultipart (new method)
        const result = await client.postMultipart("/files", params.file_path);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "upload-file");
        }
        return transformNetworkError(error, "upload-file");
      }
    }
  );
  log("Registered tool: upload-file");
  return 1;
}
```

**BukkuClient extension needed:**
```typescript
// Source: Derived from bukku-client.ts pattern + Node.js FormData pattern
// Location: src/client/bukku-client.ts (add method)

/**
 * POST request with multipart/form-data for file upload.
 * Uses Node.js native FormData and File APIs (Node 18+).
 */
async postMultipart(path: string, filePath: string): Promise<unknown> {
  const url = this.buildUrl(path);

  // Read file and create FormData
  const fileBuffer = await readFile(filePath);
  const fileName = basename(filePath);
  const ext = extname(filePath);
  const mimeType = getMimeType(ext) || "application/octet-stream";

  const file = new File([fileBuffer], fileName, { type: mimeType });
  const form = new FormData();
  form.append("file", file);

  // Get headers WITHOUT Content-Type — fetch sets it with boundary
  const headers = this.getHeaders(false);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    throw response;
  }

  return response.json();
}
```

**MIME type helper:**
```typescript
// Simple extension-to-MIME mapping
function getMimeType(ext: string): string | null {
  const types: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".xml": "application/xml",
    ".zip": "application/zip",
  };
  return types[ext.toLowerCase()] || null;
}
```

### Pattern 3: Location Entity Configuration

**What:** Standard CrudEntityConfig with API path inconsistency handling

**API path quirk:** Locations use /locations for list/create but /location/{id} (singular) for get/update/patch/delete

**Structure verified from OpenAPI control-panel.yaml:**
```typescript
// Source: .api-specs/control-panel.yaml
// Note: Factory uses apiBasePath for list/create, then appends /{id} for single-item operations
// The singular path /location/{id} is automatically constructed by factory pattern

export const locationConfig: CrudEntityConfig = {
  entity: "location",
  apiBasePath: "/locations",  // Factory uses this for list
  singularKey: "location",
  pluralKey: "locations",
  description: "location for multi-branch accounting",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,  // Archive handled by custom tools
  listFilters: ["include_archived"],
  businessRules: {
    delete: "API may restrict deletion if location is referenced by transactions. Archive instead if deletion fails.",
  },
};
```

**Critical factory adjustment needed:**
The factory currently uses `${config.apiBasePath}/${params.id}` for get/update/delete operations. For locations, this produces `/locations/{id}`, but the API expects `/location/{id}` (singular). Two solutions:

**Solution 1 (Recommended):** Custom location tools for get/update/delete operations
**Solution 2:** Add singularPath field to CrudEntityConfig and update factory logic

**Recommendation:** Use Solution 1 (custom tools) to avoid factory complexity. The pattern already exists for archive operations.

### Pattern 4: Tag & Tag Group Configurations

**What:** Standard CrudEntityConfig with parent-child relationship via tag_group_id

**Tag groups include children:** The list-tag-groups endpoint returns tag groups with nested children arrays containing full tag objects — this is the complete hierarchical view.

**Both list endpoints needed:**
- `list-tags`: Flat array for quick lookups and filtering
- `list-tag-groups`: Hierarchical view with nested children for organization

**Structure verified from OpenAPI control-panel.yaml:**
```typescript
// Source: .api-specs/control-panel.yaml

export const tagConfig: CrudEntityConfig = {
  entity: "tag",
  apiBasePath: "/tags",
  singularKey: "tag",
  pluralKey: "tags",
  description: "tag for categorizing transactions and documents. Tags must belong to a tag group — use list-tag-groups to find available groups and get tag_group_id.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,  // Archive handled by custom tools
  listFilters: [],  // API spec shows no filters for list-tags
  businessRules: {
    delete: "API may restrict deletion if tag is referenced by transactions. Archive instead if deletion fails.",
  },
};

export const tagGroupConfig: CrudEntityConfig = {
  entity: "tag-group",
  apiBasePath: "/tags/groups",
  singularKey: "tag_group",
  pluralKey: "tag_groups",
  description: "tag group for organizing tags. Tag groups contain multiple tags as children.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,  // Archive handled by custom tools
  listFilters: ["include_archived"],
  businessRules: {
    delete: "API may restrict deletion if tag group contains tags or is referenced by transactions. Consider archiving instead.",
  },
};
```

**Tag creation workflow guidance:**
The create-tag description mentions using list-tag-groups to find valid tag_group_id values. This helps Claude understand the workflow: list groups first, then create tags within those groups.

### Pattern 5: Custom Archive Tools for Control Panel Entities

**What:** 6 custom tools (archive/unarchive for locations, tags, tag groups) following Phase 4/5 pattern

**Why custom:** Control panel entities use PATCH with is_archived boolean, not the factory's status update pattern (which uses { status: string }).

**Structure verified from contact-archive.ts and product-archive.ts:**
```typescript
// Source: Derived from src/tools/custom/contact-archive.ts pattern
// Location: src/tools/custom/control-panel-archive.ts

export function registerControlPanelArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Archive location
  server.tool(
    "archive-location",
    "Archive a location (hide from active lists). Use this for locations referenced by transactions instead of deleting them.",
    { id: z.number().describe("The location ID") },
    async (params) => {
      try {
        const result = await client.patch(`/location/${params.id}`, {
          is_archived: true,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "archive-location");
        }
        return transformNetworkError(error, "archive-location");
      }
    }
  );
  log("Registered tool: archive-location");

  // Unarchive location
  server.tool(
    "unarchive-location",
    "Unarchive a location (restore to active lists).",
    { id: z.number().describe("The location ID") },
    async (params) => {
      try {
        const result = await client.patch(`/location/${params.id}`, {
          is_archived: false,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "unarchive-location");
        }
        return transformNetworkError(error, "unarchive-location");
      }
    }
  );
  log("Registered tool: unarchive-location");

  // Archive tag (uses /tags/{id} path)
  server.tool(
    "archive-tag",
    "Archive a tag (hide from active lists). Use this for tags referenced by transactions instead of deleting them.",
    { id: z.number().describe("The tag ID") },
    async (params) => {
      try {
        const result = await client.patch(`/tags/${params.id}`, {
          is_archived: true,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "archive-tag");
        }
        return transformNetworkError(error, "archive-tag");
      }
    }
  );
  log("Registered tool: archive-tag");

  // Unarchive tag
  server.tool(
    "unarchive-tag",
    "Unarchive a tag (restore to active lists).",
    { id: z.number().describe("The tag ID") },
    async (params) => {
      try {
        const result = await client.patch(`/tags/${params.id}`, {
          is_archived: false,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "unarchive-tag");
        }
        return transformNetworkError(error, "unarchive-tag");
      }
    }
  );
  log("Registered tool: unarchive-tag");

  // Archive tag group (uses /tags/groups/{id} path)
  server.tool(
    "archive-tag-group",
    "Archive a tag group (hide from active lists). Use this for tag groups referenced by tags or transactions instead of deleting them.",
    { id: z.number().describe("The tag group ID") },
    async (params) => {
      try {
        const result = await client.patch(`/tags/groups/${params.id}`, {
          is_archived: true,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "archive-tag-group");
        }
        return transformNetworkError(error, "archive-tag-group");
      }
    }
  );
  log("Registered tool: archive-tag-group");

  // Unarchive tag group
  server.tool(
    "unarchive-tag-group",
    "Unarchive a tag group (restore to active lists).",
    { id: z.number().describe("The tag group ID") },
    async (params) => {
      try {
        const result = await client.patch(`/tags/groups/${params.id}`, {
          is_archived: false,
        });
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "unarchive-tag-group");
        }
        return transformNetworkError(error, "unarchive-tag-group");
      }
    }
  );
  log("Registered tool: unarchive-tag-group");

  return 6;
}
```

**Note on PATCH paths:** Locations use singular `/location/{id}`, but tags and tag groups use plural `/tags/{id}` and `/tags/groups/{id}`. The API is inconsistent here.

### Anti-Patterns to Avoid

**Don't manually set Content-Type for multipart uploads:** Let fetch handle the multipart/form-data boundary automatically. Setting it manually breaks the upload.

**Don't use base64 encoding for file uploads:** MCP context makes local file paths more practical. Base64 would add encoding overhead with no benefit.

**Don't create custom tools for location get/update/delete without checking factory first:** The factory may already handle path construction correctly. Only create custom tools if factory produces incorrect paths.

**Don't assume file list endpoint has pagination:** The API spec shows no query parameters for GET /files — it returns all files in one response. No page/page_size support.

**Don't assume tag group delete cascades to children:** Research found no documentation of cascade behavior. Add warning in description but don't implement automatic tag deletion.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MIME type detection | Full MIME type registry | Simple extension map or mime-types package if needed | File uploads only need common types; extensive registry is overkill |
| FormData construction | Custom multipart encoder | Node.js native FormData | Node 18+ has full FormData support; no external dependency needed |
| File reading | Streaming chunks for large files | node:fs/promises readFile | Bukku file uploads are typically documents/images (KB-MB range), not large media files |
| Archive cascade logic | Automatic child deletion | Explicit warnings in tool descriptions | API doesn't document cascade behavior; let users decide |

**Key insight:** Phase 7 tools are the simplest in the project — mostly standard CRUD with two custom implementations (file upload and archive tools). Don't overcomplicate what the API keeps simple.

## Common Pitfalls

### Pitfall 1: Location API Path Inconsistency

**What goes wrong:** Factory generates `/locations/{id}` for get/update/delete, but API expects `/location/{id}` (singular)

**Why it happens:** Locations are the only entity with singular/plural path inconsistency. All other entities use consistent paths.

**How to avoid:** Create custom tools for location get/update/delete operations OR add singularPath field to CrudEntityConfig and update factory logic. Recommendation: custom tools for minimal factory impact.

**Warning signs:** 404 errors when calling get-location, update-location, or delete-location despite entity existing

### Pitfall 2: Missing Trailing CRLF in Multipart Requests

**What goes wrong:** File upload returns HTTP 422 Unprocessable Entity despite valid file and correct FormData structure

**Why it happens:** Older Node.js versions (18.0.0 through 23.6.0) omit the trailing CRLF from multipart requests, while many servers expect it per HTTP conventions

**How to avoid:** Ensure Node.js runtime uses undici 7.1.0+ (included in Node 24+), which adds the trailing CRLF to match HTTP client conventions. For older Node versions, update undici separately.

**Warning signs:** File uploads fail with 422 errors, server logs show "unexpected end of multipart data" or similar boundary parsing errors

### Pitfall 3: Setting Content-Type Manually for Multipart

**What goes wrong:** File upload fails with 400 Bad Request or multipart boundary errors

**Why it happens:** Manually setting `Content-Type: multipart/form-data` without the correct boundary parameter breaks the request. Fetch automatically sets the header with the correct boundary when given FormData.

**How to avoid:** Never manually set Content-Type header for multipart uploads. Use `this.getHeaders(false)` to exclude Content-Type from headers object.

**Warning signs:** Server logs show "no multipart boundary found" or "invalid boundary parameter"

### Pitfall 4: Assuming File List Has Pagination

**What goes wrong:** Tool description claims pagination support, but passing page/page_size parameters has no effect

**Why it happens:** The API spec shows no query parameters for GET /files — it returns all files in one response, unlike every other list endpoint in the API

**How to avoid:** Check listFilters in file config — it should be empty array. Don't add pagination parameters to tool description.

**Warning signs:** User confusion when pagination parameters are ignored, potential performance issues if file count grows large

### Pitfall 5: Tag Workflow Confusion

**What goes wrong:** User tries to create tag without tag_group_id, or doesn't understand tags must belong to groups

**Why it happens:** Tags have a required parent-child relationship with tag groups that isn't obvious without workflow context

**How to avoid:** Add workflow guidance to create-tag description: "Tags must belong to a tag group — use list-tag-groups to find available groups and get tag_group_id."

**Warning signs:** API returns 400/422 errors for tag creation with missing or invalid tag_group_id

## Code Examples

Verified patterns from OpenAPI specs and established project patterns:

### File Upload with Multipart/Form-Data

```typescript
// Source: Derived from Node.js FormData pattern + .api-specs/files.yaml
// Location: src/client/bukku-client.ts (new method)

import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

/**
 * POST request with multipart/form-data for file upload.
 * Uses Node.js native FormData and File APIs (Node 18+).
 */
async postMultipart(path: string, filePath: string): Promise<unknown> {
  const url = this.buildUrl(path);

  // Read file and prepare FormData
  const fileBuffer = await readFile(filePath);
  const fileName = basename(filePath);
  const mimeType = getMimeType(extname(filePath)) || "application/octet-stream";

  const file = new File([fileBuffer], fileName, { type: mimeType });
  const form = new FormData();
  form.append("file", file);  // API expects "file" field name

  // CRITICAL: Don't set Content-Type — fetch handles boundary
  const headers = this.getHeaders(false);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    throw response;
  }

  return response.json();
}
```

### File Entity Configuration (List & Get Only)

```typescript
// Source: .api-specs/files.yaml + src/tools/configs/contact.ts pattern
// Location: src/tools/configs/file.ts

import type { CrudEntityConfig } from "../../types/bukku.js";

export const fileConfig: CrudEntityConfig = {
  entity: "file",
  apiBasePath: "/files",
  singularKey: "file",
  pluralKey: "files",
  description: "file. Files are typically attached to sales and purchase transactions using file_ids arrays.",
  operations: ["list", "get"],  // No create — handled by upload-file custom tool
  hasStatusUpdate: false,
  listFilters: [],  // No filters — API returns all files
  businessRules: {
    // No delete endpoint in API — files are permanent
  },
};
```

### Location Entity Configuration (Path Inconsistency)

```typescript
// Source: .api-specs/control-panel.yaml
// Location: src/tools/configs/location.ts

import type { CrudEntityConfig } from "../../types/bukku.js";

export const locationConfig: CrudEntityConfig = {
  entity: "location",
  apiBasePath: "/locations",  // Factory uses this for list/create
  singularKey: "location",
  pluralKey: "locations",
  description: "location for multi-branch accounting",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,  // Archive handled by custom tools
  listFilters: ["include_archived"],
  businessRules: {
    delete: "API may restrict deletion if location is referenced by transactions. Archive instead if deletion fails.",
  },
};

// NOTE: get/update/delete use /location/{id} (singular), not /locations/{id}
// Factory may need adjustment OR custom tools for these operations
```

### Tag & Tag Group Configurations

```typescript
// Source: .api-specs/control-panel.yaml
// Location: src/tools/configs/tag.ts and src/tools/configs/tag-group.ts

export const tagConfig: CrudEntityConfig = {
  entity: "tag",
  apiBasePath: "/tags",
  singularKey: "tag",
  pluralKey: "tags",
  description: "tag for categorizing transactions and documents. Tags must belong to a tag group — use list-tag-groups to find available groups and get tag_group_id.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: [],
  businessRules: {
    delete: "API may restrict deletion if tag is referenced by transactions. Archive instead if deletion fails.",
  },
};

export const tagGroupConfig: CrudEntityConfig = {
  entity: "tag-group",
  apiBasePath: "/tags/groups",
  singularKey: "tag_group",
  pluralKey: "tag_groups",
  description: "tag group for organizing tags. Tag groups contain multiple tags as children.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: ["include_archived"],
  businessRules: {
    delete: "API may restrict deletion if tag group contains tags or is referenced by transactions. Consider archiving instead.",
  },
};
```

### Custom Archive Tool Pattern

```typescript
// Source: Derived from src/tools/custom/contact-archive.ts
// Location: src/tools/custom/control-panel-archive.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BukkuClient } from "../../client/bukku-client.js";
import { transformHttpError, transformNetworkError } from "../../errors/transform.js";
import { log } from "../../utils/logger.js";

export function registerControlPanelArchiveTools(
  server: McpServer,
  client: BukkuClient
): number {
  // Archive location
  server.tool(
    "archive-location",
    "Archive a location (hide from active lists). Use this for locations referenced by transactions instead of deleting them.",
    {
      id: z.number().describe("The location ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/location/${params.id}`, {
          is_archived: true,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "archive-location");
        }
        return transformNetworkError(error, "archive-location");
      }
    }
  );
  log("Registered tool: archive-location");

  // Unarchive location
  server.tool(
    "unarchive-location",
    "Unarchive a location (restore to active lists).",
    {
      id: z.number().describe("The location ID"),
    },
    async (params) => {
      try {
        const result = await client.patch(`/location/${params.id}`, {
          is_archived: false,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Response) {
          const body = await error.json().catch(() => null);
          return transformHttpError(error.status, body, "unarchive-location");
        }
        return transformNetworkError(error, "unarchive-location");
      }
    }
  );
  log("Registered tool: unarchive-location");

  // ... Similar patterns for archive-tag, unarchive-tag, archive-tag-group, unarchive-tag-group

  return 6;  // Total tools: 2 location + 2 tag + 2 tag group
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| form-data npm package | Node.js native FormData | Node 18+ (2022) | Zero dependency for multipart uploads, native File API support |
| Manually construct multipart boundaries | Let fetch handle boundaries | Always (web standard) | Eliminates boundary mismatch errors |
| Separate tools for nested hierarchies | Single endpoint with nested children | Bukku API design | list-tag-groups returns complete hierarchy with nested tags |
| node-fetch polyfill | Native fetch | Node 18+ (2022) | No polyfill needed, native Promise-based HTTP |

**Deprecated/outdated:**
- **form-data package:** No longer needed with Node 18+ native FormData support
- **Explicit boundary construction:** Modern fetch API handles this automatically

## Open Questions

### 1. Location API Path Handling

**What we know:** Locations use /locations for list/create but /location/{id} for get/update/patch/delete

**What's unclear:** Whether the factory pattern currently handles this inconsistency or if custom tools are needed

**Recommendation:** Test factory-generated tools first. If paths are incorrect (404 errors), create custom location tools for get/update/delete operations following the archive tool pattern.

### 2. Tag Group Delete Cascade Behavior

**What we know:** Tag groups can contain multiple tags via children array. Delete endpoint exists for both tags and tag groups.

**What's unclear:** If deleting a tag group automatically deletes its child tags, or if the API prevents deletion when children exist

**Recommendation:** Add warning in delete-tag-group description: "API may restrict deletion if tag group contains tags. Consider archiving instead or manually delete child tags first." Let testing reveal actual API behavior.

### 3. File Upload Size Limits

**What we know:** API accepts multipart/form-data uploads via POST /files

**What's unclear:** Maximum file size limit, if any, imposed by Bukku API

**Recommendation:** Don't impose artificial limits in tool. Let API return 413 Payload Too Large if file exceeds limits. Tool description can note "API may have file size limits" without specifying exact values.

### 4. File List Scalability

**What we know:** GET /files has no pagination parameters — returns all files in one response

**What's unclear:** How Bukku handles large file lists (hundreds or thousands of files)

**Recommendation:** Implement list-files as simple GET with no pagination. If performance issues arise, revisit with caching or custom pagination. Most users won't have hundreds of attached files.

## Sources

### Primary (HIGH confidence)
- `.api-specs/files.yaml` - File endpoints and multipart/form-data schema (lines 1-159)
- `.api-specs/control-panel.yaml` - Locations, tags, tag groups endpoints and schemas (lines 1-892)
- `src/tools/factory.ts` - Existing CRUD factory implementation (273 lines)
- `src/tools/configs/contact.ts` - Non-transaction entity config pattern (28 lines)
- `src/tools/custom/contact-archive.ts` - Archive tool pattern (90 lines)
- `src/tools/custom/product-archive.ts` - Archive tool pattern with 4 tools (152 lines)
- `src/client/bukku-client.ts` - Existing HTTP client methods (166 lines)
- `src/types/bukku.ts` - CrudEntityConfig type definition (109 lines)

### Secondary (MEDIUM confidence)
- [Troubles with multipart form data and fetch in Node.js](https://philna.sh/blog/2025/01/14/troubles-with-multipart-form-data-fetch-node-js/) - Node.js multipart upload patterns and trailing CRLF issue (January 2025)
- [SEP-1306: Binary Mode Elicitation for File Uploads](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1306) - MCP protocol file upload proposal (August 2025)

### Tertiary (LOW confidence)
- None — all critical findings verified with primary sources (OpenAPI specs and existing codebase)

## Metadata

**Confidence breakdown:**
- File entity patterns: HIGH - Verified from files.yaml OpenAPI spec and existing config patterns
- Control panel entities: HIGH - Verified from control-panel.yaml OpenAPI spec
- Multipart upload implementation: HIGH - Verified from official Node.js documentation and established patterns
- Archive tool pattern: HIGH - Verified from existing contact-archive.ts and product-archive.ts implementations
- Location path inconsistency: HIGH - Verified from control-panel.yaml paths (line 65: `/location/{id}`, line 12: `/locations`)

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days — stable infrastructure phase)

**Tool count projection:**
- File tools: 3 (list-files, get-file, upload-file)
- Location tools: 7 (5 factory + 2 archive)
- Tag tools: 7 (5 factory + 2 archive)
- Tag group tools: 7 (5 factory + 2 archive)
- **Total Phase 7 tools:** 24 tools
- **Project total:** 149 (current) + 24 (Phase 7) = **173 tools** delivering all 80 v1 requirements
