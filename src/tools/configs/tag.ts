import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Tag Entity Configuration
 *
 * API: /tags and /tags/{id}
 * Response keys: tag (singular), tags (plural)
 *
 * Tags enable transaction categorization and must belong to a tag group.
 * API paths are consistent (plural for all operations), so full CRUD is enabled.
 */
export const tagConfig: CrudEntityConfig = {
  entity: "tag",
  apiBasePath: "/tags",
  singularKey: "tag",
  pluralKey: "tags",
  description:
    "tag for categorizing transactions and documents. Tags must belong to a tag group — use list-tag-groups to find available groups and their tag_group_id before creating a tag.",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: [],
  businessRules: {
    delete:
      "API may restrict deletion if tag is referenced by transactions. Archive the tag instead if deletion fails.",
  },
};
