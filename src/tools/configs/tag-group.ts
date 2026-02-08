import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Tag Group Entity Configuration
 *
 * API: /tags/groups and /tags/groups/{id}
 * Response keys: tag_group (singular), tag_groups (plural)
 *
 * Tag groups organize tags into categories. The list response includes nested tag arrays.
 * API paths are consistent (plural for all operations), so full CRUD is enabled.
 */
export const tagGroupConfig: CrudEntityConfig = {
  entity: "tag-group",
  apiBasePath: "/tags/groups",
  singularKey: "tag_group",
  pluralKey: "tag_groups",
  description:
    "tag group for organizing tags into categories. Tag groups contain tags as children — the list response includes nested tag arrays for each group.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: ["include_archived"],
  businessRules: {
    delete:
      "API may restrict deletion if tag group contains tags or is referenced by transactions. Archive instead, or manually delete child tags first.",
  },
};
