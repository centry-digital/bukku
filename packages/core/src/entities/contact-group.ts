import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Contact Group Entity Configuration
 *
 * API: /contacts/groups
 * Response keys: group (singular), groups (plural)
 * Groups organize contacts into categories.
 * Simplest entity config — no status operations, no entity-specific filters,
 * no business rules. Factory provides base pagination parameters.
 */
export const contactGroupConfig: CrudEntityConfig = {
  entity: "contact-group",
  apiBasePath: "/contacts/groups",
  singularKey: "group",
  pluralKey: "groups",
  description: "contact group",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: [],
  cliGroup: "contacts",
};
