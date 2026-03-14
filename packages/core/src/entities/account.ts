import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Account Entity Configuration
 *
 * API: /accounts
 * Response keys: account (singular), accounts (plural)
 * Operations: get, create, update, delete ONLY — NO list operation
 * - List omitted because Phase 5's list-accounts reference data tool already
 *   occupies that tool name (provides cached quick lookup)
 * - Use search-accounts (custom tool in account-tools.ts) for filtered search
 *   of the chart of accounts
 * - Archive/unarchive handled by custom tools (account-tools.ts), not status
 *   update, because API expects { is_archived: boolean }
 * Delete constraint: Only accounts with no children, not in locked system type,
 * and not used in transactions can be deleted
 */
export const accountConfig: CrudEntityConfig = {
  entity: "account",
  apiBasePath: "/accounts",
  singularKey: "account",
  pluralKey: "accounts",
  description: "account",
  operations: ["get", "create", "update", "delete"],
  hasStatusUpdate: false,
  listFilters: [],
  businessRules: {
    delete:
      "Only accounts that are not assigned to locked system type, have no children, and are not used in transactions can be deleted. Use archive-account instead if the account has transaction history.",
  },
  cliGroup: "accounting",
};
