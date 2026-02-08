import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * Journal Entry Entity Configuration
 *
 * API: /journal_entries
 * Response keys: transaction (singular), transactions (plural)
 * Operations: list, get, delete ONLY
 * - Create and update are handled by custom tools (journal-entry-tools.ts)
 *   because they require double-entry validation (debits == credits)
 * - Status updates use standard factory pattern (hasStatusUpdate: true)
 * Status lifecycle: draft -> ready (posted), ready -> void (final)
 * Delete constraint: Only draft and void entries can be deleted
 */
export const journalEntryConfig: CrudEntityConfig = {
  entity: "journal-entry",
  apiBasePath: "/journal_entries",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "journal entry",
  operations: ["list", "get", "delete"],
  hasStatusUpdate: true,
  listFilters: [],
  businessRules: {
    delete:
      "Only draft and void journal entries can be deleted. Ready journal entries cannot be deleted -- use update-journal-entry-status to void a ready entry instead.",
    statusTransitions:
      "Valid transitions: draft -> ready, ready -> void. A void entry is final and cannot be changed.",
  },
};
