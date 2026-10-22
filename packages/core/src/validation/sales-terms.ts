/**
 * Payment Terms on Sales Quotes and Orders: Old and New Format
 *
 * Bukku announced that quotes and orders move from a top-level `term_id` to
 * `term_items` (changelog: production 21 October 2026). A live check on
 * 22 October 2026 found the API still applying `term_id` and silently
 * dropping `term_items`, even when both are sent. The switch may happen
 * without notice, so writes are made to work either way:
 *
 * 1. `prepareSalesTerms` sends both forms when they mean the same thing (one
 *    existing term for 100%), so whichever one Bukku honours, the term sticks.
 * 2. `sendSalesTerms` retries once without `term_id` if Bukku refuses it.
 * 3. `sendSalesTerms` compares the stored `term_items` with the request and
 *    adds a `warnings` entry to the result when they differ, because Bukku
 *    drops unsupported terms silently rather than failing.
 */

type Body = Record<string, unknown>;

function isObject(value: unknown): value is Body {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Add the equivalent second form of the payment terms to a write body.
 *
 * - A top-level `term_id` alone also gets `term_items: [{ term_id, payment_due: "100%" }]`.
 * - A single `term_items` entry with a `term_id` for 100% (and no description or
 *   date) also gets a top-level `term_id`.
 *
 * Any other body (no terms, split or custom-date terms, both forms already) is
 * returned unchanged. Run it after `validateSalesTermItems`.
 */
export function prepareSalesTerms(body: Body): Body {
  const hasTermId = body.term_id != null;
  const termItems = body.term_items;

  if (hasTermId && termItems === undefined) {
    return { ...body, term_items: [{ term_id: body.term_id, payment_due: "100%" }] };
  }

  if (!("term_id" in body) && Array.isArray(termItems) && termItems.length === 1) {
    const [item] = termItems;
    if (
      isObject(item) &&
      item.term_id != null &&
      item.payment_due === "100%" &&
      item.date == null &&
      item.description == null
    ) {
      return { ...body, term_id: item.term_id };
    }
  }

  return body;
}

/** True when a 422 response body names `term_id` among its field errors. */
async function refusesTermId(error: unknown): Promise<boolean> {
  if (!(error instanceof Response) || error.status !== 422) return false;
  // Read a clone so callers can still read the original body.
  const payload = await error
    .clone()
    .json()
    .catch(() => null);
  return isObject(payload) && isObject(payload.errors) && "term_id" in payload.errors;
}

/** Describe how the stored term items differ from the requested ones, if they do. */
function termsMismatch(requested: unknown[], stored: unknown): string | undefined {
  if (!Array.isArray(stored) || stored.length !== requested.length) {
    return "a different number of payment term items";
  }
  for (const [index, want] of requested.entries()) {
    const got = stored[index];
    if (!isObject(want) || !isObject(got)) continue;
    if (want.term_id != null && Number(got.term_id) !== Number(want.term_id)) {
      return `term_items[${index}] missing term_id ${String(want.term_id)}`;
    }
    if (want.term_id == null && want.date != null && got.date !== want.date) {
      return `term_items[${index}] missing date ${String(want.date)}`;
    }
    if (want.payment_due != null && got.payment_due !== want.payment_due) {
      return `term_items[${index}] with payment_due ${String(got.payment_due)}`;
    }
  }
  return undefined;
}

/**
 * Send a quote or order create/update and make the payment terms stick.
 *
 * `send` performs the request (POST or PUT) with the given body. The body
 * should already have been through `prepareSalesTerms`. Errors other than a
 * refused `term_id` are rethrown unchanged.
 */
export async function sendSalesTerms(
  send: (body: Body) => Promise<unknown>,
  body: Body,
): Promise<unknown> {
  let sent = body;
  let result: unknown;
  try {
    result = await send(sent);
  } catch (error) {
    if (!Array.isArray(body.term_items) || !(await refusesTermId(error))) throw error;
    const { term_id: _dropped, ...withoutTermId } = body;
    sent = withoutTermId;
    result = await send(sent);
  }

  const requested = sent.term_items;
  if (!Array.isArray(requested) || !isObject(result)) return result;
  const record = Object.values(result).find((value) => isObject(value) && "term_items" in value) as
    Body | undefined;
  if (!record) return result;

  const mismatch = termsMismatch(requested, record.term_items);
  if (!mismatch) return result;
  return {
    ...result,
    warnings: [
      `Bukku saved this record with ${mismatch}, so the requested payment terms did not stick. As of 22 October 2026 Bukku applies only a single top-level term_id on quotes and orders and drops split or custom-date term_items. Check term_items above and update the record if needed.`,
    ],
  };
}
