import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Location Entity Configuration
 *
 * API: /locations (list, create) and /location/{id} (get, update, delete)
 * Response keys: location (singular), locations (plural)
 *
 * API PATH INCONSISTENCY:
 * - List/create use /locations (plural)
 * - Get/update/delete use /location/{id} (singular)
 *
 * The factory generates tools based on apiBasePath, which would produce:
 * - /locations for list/create ✓
 * - /locations/{id} for get/update/delete ✗ (incorrect)
 *
 * Therefore, this config only enables list and create operations.
 * Get/update/delete operations are handled by custom tools in location-tools.ts
 * which use the correct /location/{id} singular path.
 */
export const locationConfig: CrudEntityConfig = {
  entity: "location",
  apiBasePath: "/locations",
  singularKey: "location",
  pluralKey: "locations",
  description:
    "location for multi-branch accounting. Use locations to track which branch or office a transaction belongs to.",
  operations: ["list", "create"],
  hasStatusUpdate: false,
  listFilters: ["include_archived"],
};
