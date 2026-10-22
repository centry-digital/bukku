/**
 * Write-Body Validation for Entity Create and Update
 *
 * Checks request bodies against Bukku API rules that the API changed in a
 * breaking way, so callers get an immediate, specific error instead of a raw
 * API validation error or a silently ignored field.
 *
 * - Sales quotes and orders: Bukku announced that payment terms move from a
 *   top-level `term_id` to `term_items` (changelog: production 21 October
 *   2026). A live check on 22 October 2026 found the API still storing the
 *   top-level `term_id` and silently ignoring `term_items`, so both are
 *   accepted, but not together.
 * - Contacts: `contact_code` is required on create and update (Bukku API,
 *   production 23 July 2026).
 */

import type { ValidationResult } from "./double-entry.js";

/**
 * Validate payment terms on a sales quote or sales order body.
 *
 * Accepts either a top-level `term_id` or `term_items`, but refuses both in
 * one body (the API would honour only one of them). Checks that each
 * `term_items` entry has a `payment_due` and either a `term_id` or a `date`.
 * Bodies without payment terms pass (terms are optional).
 */
export function validateSalesTermItems(body: Record<string, unknown>): ValidationResult {
  const termItems = body.term_items;
  if ("term_id" in body && termItems !== undefined) {
    return {
      valid: false,
      error:
        'Send payment terms as either a top-level term_id or term_items, not both. Bukku currently applies the top-level term_id (e.g. "term_id": 1) and is moving to term_items (e.g. "term_items": [{"term_id": 1, "payment_due": "100%"}]). Use list-terms (CLI: ref-data terms) to find term IDs.',
    };
  }

  if (termItems === undefined) return { valid: true };

  if (!Array.isArray(termItems)) {
    return { valid: false, error: "term_items must be an array of payment term items." };
  }

  for (const [index, item] of termItems.entries()) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return { valid: false, error: `term_items[${index}] must be an object.` };
    }
    const entry = item as Record<string, unknown>;
    if (entry.payment_due == null || entry.payment_due === "") {
      return { valid: false, error: `term_items[${index}] is missing payment_due.` };
    }
    if (entry.term_id == null && (entry.date == null || entry.date === "")) {
      return {
        valid: false,
        error: `term_items[${index}] needs either a term_id (an existing payment term) or a custom date (YYYY-MM-DD).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate that a contact body carries a non-empty `contact_code`.
 *
 * The API requires it on both create and update. For an update, read the
 * contact first and send its existing code back if it is not changing.
 */
export function validateContactCode(body: Record<string, unknown>): ValidationResult {
  const code = body.contact_code;
  if (typeof code !== "string" || code.trim() === "") {
    return {
      valid: false,
      error:
        "contact_code is required when creating or updating a contact. For an update, get the contact first and send its existing contact_code if you are not changing it.",
    };
  }
  return { valid: true };
}
