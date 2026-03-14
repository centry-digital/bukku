import type { CrudEntityConfig } from "../types/bukku.js";

/**
 * Goods Received Note Entity Configuration
 *
 * API: /purchases/goods_received_notes
 * Response keys: transaction (singular), transactions (plural)
 */
export const goodsReceivedNoteConfig: CrudEntityConfig = {
  entity: "goods-received-note",
  apiBasePath: "/purchases/goods_received_notes",
  singularKey: "transaction",
  pluralKey: "transactions",
  description: "goods received note",
  operations: ["list", "get", "create", "update", "delete"],
  hasStatusUpdate: true,
  listFilters: ["contact_id", "email_status", "transfer_status"],
  businessRules: {
    delete: "Only draft and void goods received notes can be deleted. Ready or pending approval goods received notes cannot be deleted — use update-goods-received-note-status to void a ready goods received note instead.",
    statusTransitions: "Valid transitions: draft -> pending_approval, draft -> ready, pending_approval -> ready, ready -> void. A void goods received note is final and cannot be changed. There is no way to revert from ready, pending_approval, or void back to draft.",
  },
  cliGroup: "purchases",
};
