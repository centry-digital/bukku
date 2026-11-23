import { describe, test, afterEach } from "node:test";
import assert from "node:assert";
import { outputJson } from "./json.js";
import { outputTable } from "./table.js";
import { mapExitCode, ExitCode } from "./error.js";

describe("outputJson", () => {
  const originalWrite = process.stdout.write;

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  test("writes valid JSON to stdout", () => {
    let captured = "";
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as typeof process.stdout.write;

    outputJson({ ok: true, count: 42 });

    const parsed = JSON.parse(captured);
    assert.strictEqual(parsed.ok, true);
    assert.strictEqual(parsed.count, 42);
  });

  test("writes pretty-printed JSON with newline", () => {
    let captured = "";
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as typeof process.stdout.write;

    outputJson({ a: 1 });

    assert.ok(captured.endsWith("\n"), "should end with newline");
    assert.ok(captured.includes("\n  "), "should be pretty-printed");
  });
});

describe("mapExitCode", () => {
  test("AUTH_MISSING maps to exit code 2", () => {
    assert.strictEqual(mapExitCode("AUTH_MISSING"), ExitCode.AUTH);
    assert.strictEqual(mapExitCode("AUTH_MISSING"), 2);
  });

  test("API_ERROR maps to exit code 3", () => {
    assert.strictEqual(mapExitCode("API_ERROR"), ExitCode.API);
    assert.strictEqual(mapExitCode("API_ERROR"), 3);
  });

  test("API_HTTP_ERROR maps to exit code 3", () => {
    assert.strictEqual(mapExitCode("API_HTTP_ERROR"), 3);
  });

  test("VALIDATION_ERROR maps to exit code 4", () => {
    assert.strictEqual(mapExitCode("VALIDATION_ERROR"), ExitCode.VALIDATION);
    assert.strictEqual(mapExitCode("VALIDATION_ERROR"), 4);
  });

  test("unknown code maps to exit code 1", () => {
    assert.strictEqual(mapExitCode("SOME_RANDOM_CODE"), ExitCode.GENERAL);
    assert.strictEqual(mapExitCode("SOME_RANDOM_CODE"), 1);
  });
});

describe("outputTable contacts", () => {
  const originalWrite = process.stdout.write;

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  test("shows the emails and phones arrays", () => {
    let captured = "";
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as typeof process.stdout.write;

    outputTable(
      [{ id: 1, name: "Alpha", emails: ["a@x.my", "b@x.my"], phones: ["60312345678"], type: "x" }],
      ["contact"],
    );

    assert.ok(captured.includes("a@x.my, b@x.my"));
    assert.ok(captured.includes("60312345678"));
  });

  test("falls back to the older email and phone_no fields", () => {
    let captured = "";
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as typeof process.stdout.write;

    outputTable(
      [{ id: 2, name: "Beta", email: "old@x.my", phone_no: "60398765432", type: "x" }],
      ["contact"],
    );

    assert.ok(captured.includes("old@x.my"));
    assert.ok(captured.includes("60398765432"));
  });
});
