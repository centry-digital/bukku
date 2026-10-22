import { describe, it } from "node:test";
import assert from "node:assert";
import {
  canonicalJson,
  decodeJsString,
  diffSnapshots,
  extractChangelogEntries,
  findBundleUrl,
  findSpecPaths,
  hasChanges,
  sha256,
} from "./snapshot.ts";
import { formatChangeIssue, formatState, parseState } from "./report.ts";
import { firstTermId, probeQuoteBody, termItemsHonoured } from "./term-items-probe.ts";

/** How a bundler embeds a JSON file: a single-quoted JS string inside JSON.parse. */
function embed(value: unknown): string {
  const literal = JSON.stringify(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `e.exports=JSON.parse('${literal}')`;
}

const ENTRY = {
  $schema: "../changelog.schema.json",
  date: "2026-10-21",
  title: "Quotes use term_items",
  changes: [
    { type: "breaking", text: "Sales quotes don't accept term_id; it's \"term_items\" now" },
  ],
};

describe("findBundleUrl", () => {
  it("finds the main bundle linked from the page", () => {
    const html = '<script defer="defer" src="/static/js/main.3f2a91c4.js"></script>';
    assert.strictEqual(
      findBundleUrl(html),
      "https://developers.bukku.my/static/js/main.3f2a91c4.js",
    );
  });

  it("returns null when there is none", () => {
    assert.strictEqual(findBundleUrl("<html></html>"), null);
  });
});

describe("decodeJsString", () => {
  it("undoes JS string escapes", () => {
    assert.strictEqual(decodeJsString("it\\'s \\\\ \\n \\u00e9 \\x41"), "it's \\ \n é A");
  });
});

describe("extractChangelogEntries", () => {
  it("reads changelog entries and skips other embedded JSON", () => {
    const js = `var a=1;${embed({ other: true })};${embed(ENTRY)};var b='x';`;
    const entries = extractChangelogEntries(js);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].label, "2026-10-21: Quotes use term_items");
    assert.deepStrictEqual(entries[0].content, {
      date: ENTRY.date,
      title: ENTRY.title,
      changes: ENTRY.changes,
    });
  });

  it("gives an entry the same id whatever its key order, and a new id when edited", () => {
    const [a] = extractChangelogEntries(embed(ENTRY));
    const [b] = extractChangelogEntries(embed(Object.fromEntries(Object.entries(ENTRY).reverse())));
    const [c] = extractChangelogEntries(embed({ ...ENTRY, title: "Edited" }));
    assert.strictEqual(a.id, b.id);
    assert.notStrictEqual(a.id, c.id);
  });
});

describe("canonicalJson", () => {
  it("sorts keys at every level", () => {
    assert.strictEqual(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] }), '{"a":[{"c":3,"d":2}],"b":1}');
  });
});

describe("findSpecPaths", () => {
  it("finds spec files in the bundle", () => {
    const js = 'fetch("/specs/sales.yaml");x="specs/contacts.yaml"';
    assert.deepStrictEqual(findSpecPaths(js), ["contacts.yaml", "sales.yaml"]);
  });

  it("follows relative $refs within /specs/", () => {
    const yaml = [
      "$ref: './schemas/quote.yaml#/Quote'",
      "$ref: ../general-error.yaml",
      '$ref: "#/components/x"',
    ].join("\n");
    assert.deepStrictEqual(findSpecPaths(yaml, "sales/sales.yaml"), [
      "general-error.yaml",
      "sales/schemas/quote.yaml",
    ]);
  });
});

describe("diffSnapshots", () => {
  const before = { entries: { a: "A" }, specs: { "s.yaml": "1", "gone.yaml": "2" } };

  it("reports new entries and changed, added and removed specs", () => {
    const after = { entries: { a: "A", b: "B" }, specs: { "s.yaml": "9", "new.yaml": "3" } };
    const diff = diffSnapshots(before, after);
    assert.deepStrictEqual(diff, {
      newEntries: ["b"],
      changedSpecs: ["s.yaml"],
      addedSpecs: ["new.yaml"],
      removedSpecs: ["gone.yaml"],
    });
    assert.ok(hasChanges(diff));
  });

  it("reports nothing for the same snapshot, nor for an entry Bukku removed", () => {
    assert.ok(!hasChanges(diffSnapshots(before, { ...before, entries: {} })));
  });
});

describe("state issue", () => {
  it("round-trips the snapshot", () => {
    const snapshot = { entries: { a: "2026-10-21: A" }, specs: { "s.yaml": "abc" } };
    assert.deepStrictEqual(parseState(formatState(snapshot, "2026-10-22T01:00:00Z")), snapshot);
  });

  it("fits a thousand spec files in one issue body", () => {
    const specs = Object.fromEntries(
      Array.from({ length: 1000 }, (_, i) => [
        `sales/schemas/some-long-schema-name-${i}.yaml`,
        sha256(String(i)).slice(0, 16),
      ]),
    );
    const body = formatState({ entries: {}, specs }, "2026-10-22T01:00:00Z");
    assert.ok(body.length < 65_536, `${body.length} characters`);
    assert.deepStrictEqual(parseState(body)?.specs, specs);
  });

  it("returns null for a body without a snapshot", () => {
    assert.strictEqual(parseState("edited by hand"), null);
  });
});

describe("formatChangeIssue", () => {
  it("names the entries and links changed specs", () => {
    const [entry] = extractChangelogEntries(embed(ENTRY));
    const { title, body } = formatChangeIssue(
      { newEntries: [entry.id], changedSpecs: ["sales.yaml"], addedSpecs: [], removedSpecs: [] },
      [entry],
    );
    assert.strictEqual(
      title,
      "Bukku API update: 1 changelog entry and API spec changes (2026-10-21: Quotes use term_items)",
    );
    assert.match(body, /### 2026-10-21: Quotes use term_items/);
    assert.match(body, /\[sales\.yaml\]\(https:\/\/developers\.bukku\.my\/specs\/sales\.yaml\)/);
  });
});

describe("term_items probe", () => {
  it("builds a draft quote with terms only in term_items", () => {
    const body = probeQuoteBody(
      { id: 1, contact_id: 5, form_items: [{ account_id: 20 }] },
      7,
      "2026-10-22",
    );
    assert.strictEqual(body.status, "draft");
    assert.strictEqual("term_id" in body, false);
    assert.deepStrictEqual(body.term_items, [{ term_id: 7, payment_due: "100%" }]);
    assert.strictEqual(body.form_items[0].account_id, 20);
  });

  it("refuses a template quote without a contact or account", () => {
    assert.throws(() => probeQuoteBody({ id: 1, form_items: [] }, 7, "2026-10-22"));
  });

  it("tells an applied term from an ignored one", () => {
    assert.ok(termItemsHonoured({ id: 1, term_items: [{ term_id: 7 }] }, 7));
    assert.ok(!termItemsHonoured({ id: 1, term_items: [{ term_id: null }] }, 7));
    assert.ok(!termItemsHonoured({ id: 1 }, 7));
  });

  it("finds the first payment term in either list shape", () => {
    assert.strictEqual(firstTermId([{ id: 1, name: "COD" }, { id: 7 }]), 1);
    assert.strictEqual(firstTermId({ items: [{ id: 6 }] }), 6);
    assert.strictEqual(firstTermId([]), undefined);
    assert.strictEqual(firstTermId(undefined), undefined);
  });
});
