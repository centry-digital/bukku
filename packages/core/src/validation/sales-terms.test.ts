import { describe, it } from "node:test";
import assert from "node:assert";
import { prepareSalesTerms, sendSalesTerms } from "./sales-terms.ts";

describe("prepareSalesTerms", () => {
  it("adds term_items for a top-level term_id", () => {
    assert.deepStrictEqual(prepareSalesTerms({ contact_id: 1, term_id: 7 }), {
      contact_id: 1,
      term_id: 7,
      term_items: [{ term_id: 7, payment_due: "100%" }],
    });
  });

  it("adds a top-level term_id for a single 100% term item", () => {
    const body = { term_items: [{ term_id: 7, payment_due: "100%" }] };
    assert.deepStrictEqual(prepareSalesTerms(body), { ...body, term_id: 7 });
  });

  it("leaves split, custom-date and described terms unchanged", () => {
    const split = {
      term_items: [
        { term_id: 1, payment_due: "50%" },
        { date: "2026-12-31", payment_due: "50%" },
      ],
    };
    const dated = { term_items: [{ date: "2026-12-31", payment_due: "100%" }] };
    const described = { term_items: [{ term_id: 7, payment_due: "100%", description: "Net" }] };
    for (const body of [split, dated, described, { contact_id: 1 }]) {
      assert.deepStrictEqual(prepareSalesTerms(body), body);
    }
  });
});

function stored(termItems: unknown[]) {
  return { transaction: { id: 9, term_items: termItems } };
}

function refusal(errors: Record<string, string[]>) {
  return new Response(JSON.stringify({ message: "The given data was invalid.", errors }), {
    status: 422,
  });
}

describe("sendSalesTerms", () => {
  const body = prepareSalesTerms({ contact_id: 1, term_id: 7 });

  it("returns the result unchanged when the stored terms match", async () => {
    const result = stored([{ term_id: 7, date: "2026-10-25", payment_due: "100%" }]);
    assert.deepStrictEqual(await sendSalesTerms(async () => result, body), result);
  });

  it("retries without term_id when Bukku refuses it", async () => {
    const sent: Record<string, unknown>[] = [];
    const result = stored([{ term_id: 7, date: "2026-10-25", payment_due: "100%" }]);
    const out = await sendSalesTerms(async (b) => {
      sent.push(b);
      if (sent.length === 1) throw refusal({ term_id: ["The term id field is prohibited."] });
      return result;
    }, body);
    assert.deepStrictEqual(out, result);
    assert.strictEqual(sent.length, 2);
    assert.ok(!("term_id" in sent[1]!));
    assert.deepStrictEqual(sent[1]!.term_items, [{ term_id: 7, payment_due: "100%" }]);
  });

  it("rethrows other API errors without retrying", async () => {
    let calls = 0;
    const error = refusal({ number: ["The number field is required."] });
    await assert.rejects(
      sendSalesTerms(async () => {
        calls++;
        throw error;
      }, body),
      (thrown) => thrown === error,
    );
    assert.strictEqual(calls, 1);
  });

  it("warns when Bukku drops split terms", async () => {
    const split = {
      term_items: [
        { term_id: 1, payment_due: "50%" },
        { date: "2026-12-31", payment_due: "50%" },
      ],
    };
    const out = (await sendSalesTerms(
      async () => stored([{ term_id: null, date: null, payment_due: "100%" }]),
      split,
    )) as { warnings?: string[] };
    assert.strictEqual(out.warnings?.length, 1);
    assert.match(out.warnings![0]!, /did not stick/);
  });

  it("warns when the stored term differs from the requested one", async () => {
    const out = (await sendSalesTerms(
      async () => stored([{ term_id: null, date: null, payment_due: "100%" }]),
      body,
    )) as { warnings?: string[] };
    assert.match(out.warnings![0]!, /missing term_id 7/);
  });

  it("does not check a body without payment terms", async () => {
    const result = stored([{ term_id: null, payment_due: "100%" }]);
    assert.deepStrictEqual(await sendSalesTerms(async () => result, { contact_id: 1 }), result);
  });
});
