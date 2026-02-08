import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Contact Entity Configuration
 *
 * API: /contacts
 * Response keys: contact (singular), contacts (plural) — NOT transaction/transactions
 * This is the first non-transaction entity; uses custom wrapper keys.
 * Archive/unarchive is handled by separate custom tools (contact-archive.ts),
 * NOT the factory status tool, because the API expects { is_archived: boolean }
 * instead of { status: string }.
 * List filter: status accepts ALL, ACTIVE, or INACTIVE values.
 * List filter: type accepts customer, supplier, or employee values.
 */
export const contactConfig: CrudEntityConfig = {
  entity: "contact",
  apiBasePath: "/contacts",
  singularKey: "contact",
  pluralKey: "contacts",
  description: "contact",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: ["group_id", "status", "type", "is_myinvois_ready"],
  businessRules: {
    delete:
      "Only contacts with no linked transactions can be deleted. Archive instead if the contact has transaction history.",
  },
};
