import { describe, it } from "node:test";
import assert from "node:assert";
import { validateSalesTermItems, validateContactCode } from "./write-rules.ts";

describe("validateSalesTermItems", () => {
  it("accepts a body without payment terms", () => {
    assert.deepStrictEqual(validateSalesTermItems({ contact_id: 1 }), { valid: true });
  });

  it("accepts term_items using an existing term_id", () => {
    const result = validateSalesTermItems({ term_items: [{ term_id: 3, payment_due: "100%" }] });
    assert.strictEqual(result.valid, true);
  });

  it("accepts term_items using a custom date", () => {
    const result = validateSalesTermItems({
      term_items: [{ date: "2026-11-30", payment_due: "100%", description: "Balance" }],
    });
    assert.strictEqual(result.valid, true);
  });

  it("accepts a top-level term_id, which the live API still applies", () => {
    assert.deepStrictEqual(validateSalesTermItems({ term_id: 3 }), { valid: true });
  });

  it("refuses a top-level term_id together with term_items", () => {
    const result = validateSalesTermItems({
      term_id: 3,
      term_items: [{ term_id: 3, payment_due: "100%" }],
    });
    assert.strictEqual(result.valid, false);
    assert.match(result.error!, /not both/);
  });

  it("refuses term_items that is not an array", () => {
    const result = validateSalesTermItems({ term_items: { term_id: 3, payment_due: "100%" } });
    assert.strictEqual(result.valid, false);
  });

  it("refuses an item without payment_due", () => {
    const result = validateSalesTermItems({ term_items: [{ term_id: 3 }] });
    assert.strictEqual(result.valid, false);
    assert.match(result.error!, /term_items\[0\].*payment_due/);
  });

  it("refuses an item with neither term_id nor date", () => {
    const result = validateSalesTermItems({
      term_items: [{ term_id: 3, payment_due: "50%" }, { payment_due: "50%" }],
    });
    assert.strictEqual(result.valid, false);
    assert.match(result.error!, /term_items\[1\]/);
  });
});

describe("validateContactCode", () => {
  it("accepts a non-empty contact_code", () => {
    assert.deepStrictEqual(validateContactCode({ contact_code: "C0001", legal_name: "Acme" }), {
      valid: true,
    });
  });

  it("refuses a missing contact_code", () => {
    const result = validateContactCode({ legal_name: "Acme" });
    assert.strictEqual(result.valid, false);
    assert.match(result.error!, /contact_code is required/);
  });

  it("refuses a blank contact_code", () => {
    assert.strictEqual(validateContactCode({ contact_code: "  " }).valid, false);
  });
});
