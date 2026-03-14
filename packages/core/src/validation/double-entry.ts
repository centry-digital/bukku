/**
 * Double-Entry Validation for Journal Entries
 *
 * Validates that journal entry line items follow the fundamental accounting
 * rule: total debits must equal total credits.
 *
 * This validation runs client-side (before API submission) to provide
 * immediate, conversational error messages to Claude rather than waiting
 * for raw API errors.
 */

export interface JournalEntryLine {
  debit_amount?: number;
  credit_amount?: number;
  [key: string]: unknown;  // Allow other fields to pass through
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate double-entry accounting rule: debits must equal credits
 *
 * @param lines - Journal entry line items
 * @param minLines - Minimum number of lines required (default: 2)
 * @returns Validation result with detailed error message if invalid
 *
 * @example
 * ```typescript
 * // Balanced entry
 * validateDoubleEntry([
 *   { debit_amount: 100, account_id: 1 },
 *   { credit_amount: 100, account_id: 2 }
 * ]); // { valid: true }
 *
 * // Unbalanced entry
 * validateDoubleEntry([
 *   { debit_amount: 1500 },
 *   { credit_amount: 1450 }
 * ]);
 * // {
 * //   valid: false,
 * //   error: "Journal entry is unbalanced. Total debits: 1500.00, Total credits: 1450.00. Difference: 50.00. Debits must equal credits in double-entry accounting."
 * // }
 * ```
 */
export function validateDoubleEntry(
  lines: JournalEntryLine[],
  minLines: number = 2
): ValidationResult {
  // Check minimum line count
  if (lines.length < minLines) {
    const lineWord = lines.length === 1 ? "line" : "lines";
    return {
      valid: false,
      error: `Journal entries require at least ${minLines} line items (minimum one debit and one credit). This entry has ${lines.length} ${lineWord}.`,
    };
  }

  // Sum debits and credits
  let totalDebits = 0;
  let totalCredits = 0;

  for (const line of lines) {
    totalDebits += line.debit_amount || 0;
    totalCredits += line.credit_amount || 0;
  }

  // Compare with epsilon tolerance (1 cent)
  // Using 0.01 instead of Number.EPSILON because currency precision
  // is 2 decimal places, and differences smaller than 1 cent are
  // acceptable rounding artifacts
  const difference = Math.abs(totalDebits - totalCredits);
  const EPSILON = 0.01;

  if (difference >= EPSILON) {
    return {
      valid: false,
      error: `Journal entry is unbalanced. Total debits: ${totalDebits.toFixed(2)}, Total credits: ${totalCredits.toFixed(2)}. Difference: ${difference.toFixed(2)}. Debits must equal credits in double-entry accounting.`,
    };
  }

  return { valid: true };
}
