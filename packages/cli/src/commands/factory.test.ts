import { describe, test } from "node:test";
import assert from "node:assert";
import { parseIdList } from "./factory.js";

describe("parseIdList", () => {
  test("reads comma-separated IDs, ignoring spaces", () => {
    assert.deepStrictEqual(parseIdList("3,5"), [3, 5]);
    assert.deepStrictEqual(parseIdList(" 12 , 7 "), [12, 7]);
  });

  test("refuses anything that is not a positive whole number", () => {
    for (const bad of ["", "3,", "a", "0", "-1", "1.5", "3;5"]) {
      assert.strictEqual(parseIdList(bad), null, bad);
    }
  });
});
