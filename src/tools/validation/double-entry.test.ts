import { describe, it } from "node:test";
import assert from "node:assert";
import { validateDoubleEntry } from "./double-entry.js";

describe("validateDoubleEntry", () => {
  describe("balanced entries", () => {
    it("accepts simple balanced entry (single debit, single credit)", () => {
      const result = validateDoubleEntry([
        { debit_amount: 100 },
        { credit_amount: 100 }
      ]);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.error, undefined);
    });

    it("accepts multi-line balanced entry", () => {
      const result = validateDoubleEntry([
        { debit_amount: 33.33 },
        { debit_amount: 33.33 },
        { debit_amount: 33.34 },
        { credit_amount: 100 }
      ]);
      assert.strictEqual(result.valid, true);
    });

    it("accepts floating-point values with epsilon tolerance", () => {
      const result = validateDoubleEntry([
        { debit_amount: 1.20 },
        { debit_amount: 1.30 },
        { credit_amount: 2.50 }
      ]);
      assert.strictEqual(result.valid, true);
    });

    it("accepts zero amounts", () => {
      const result = validateDoubleEntry([
        { debit_amount: 0 },
        { credit_amount: 0 }
      ]);
      assert.strictEqual(result.valid, true);
    });

    it("treats missing debit_amount/credit_amount as zero", () => {
      const result = validateDoubleEntry([
        {},
        {}
      ]);
      assert.strictEqual(result.valid, true);
    });

    it("accepts line with both debit and credit", () => {
      const result = validateDoubleEntry([
        { debit_amount: 100, credit_amount: 50 },
        { credit_amount: 50 }
      ]);
      assert.strictEqual(result.valid, true);
    });

    it("ignores other fields on line items", () => {
      const result = validateDoubleEntry([
        { debit_amount: 100, account_id: 123, description: "Test" },
        { credit_amount: 100, account_id: 456, description: "Test 2" }
      ]);
      assert.strictEqual(result.valid, true);
    });
  });

  describe("unbalanced entries", () => {
    it("rejects unbalanced entry with detailed error", () => {
      const result = validateDoubleEntry([
        { debit_amount: 1500 },
        { credit_amount: 1450 }
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes("1500.00"));
      assert.ok(result.error?.includes("1450.00"));
      assert.ok(result.error?.includes("50.00"));
      assert.ok(result.error?.includes("unbalanced"));
    });

    it("shows difference when credits exceed debits", () => {
      const result = validateDoubleEntry([
        { debit_amount: 1000 },
        { credit_amount: 1100 }
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes("100.00"));
    });
  });

  describe("minimum line count validation", () => {
    it("rejects entry with fewer than 2 lines (default)", () => {
      const result = validateDoubleEntry([
        { debit_amount: 100 }
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes("at least 2 line items"));
      assert.ok(result.error?.includes("1 line"));
    });

    it("rejects empty entry", () => {
      const result = validateDoubleEntry([]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes("at least 2 line items"));
      assert.ok(result.error?.includes("0 line"));
    });

    it("respects custom minimum line count", () => {
      const result = validateDoubleEntry([
        { debit_amount: 100 },
        { credit_amount: 100 }
      ], 3);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes("at least 3 line items"));
    });

    it("accepts entry meeting custom minimum", () => {
      const result = validateDoubleEntry([
        { debit_amount: 50 },
        { debit_amount: 50 },
        { credit_amount: 100 }
      ], 3);
      assert.strictEqual(result.valid, true);
    });
  });

  describe("edge cases", () => {
    it("handles very small floating-point differences (below epsilon)", () => {
      const result = validateDoubleEntry([
        { debit_amount: 1.001 },
        { credit_amount: 1.000 }
      ]);
      // 0.001 is below 0.01 epsilon, should pass
      assert.strictEqual(result.valid, true);
    });

    it("rejects differences at epsilon boundary", () => {
      const result = validateDoubleEntry([
        { debit_amount: 1.01 },
        { credit_amount: 1.00 }
      ]);
      // Exactly 0.01 difference - should fail (epsilon is <, not <=)
      assert.strictEqual(result.valid, false);
    });

    it("handles large amounts", () => {
      const result = validateDoubleEntry([
        { debit_amount: 1000000.00 },
        { credit_amount: 1000000.00 }
      ]);
      assert.strictEqual(result.valid, true);
    });

    it("handles many line items", () => {
      const lines = [];
      // 50 debit lines of $20 each = $1000
      for (let i = 0; i < 50; i++) {
        lines.push({ debit_amount: 20 });
      }
      // 1 credit line of $1000
      lines.push({ credit_amount: 1000 });

      const result = validateDoubleEntry(lines);
      assert.strictEqual(result.valid, true);
    });
  });
});
