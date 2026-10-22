import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// RC_PATH is fixed from the home directory when rc.ts loads, so point HOME at a temporary
// folder before importing. node --test runs each test file in its own process, so this
// never reaches other tests, and the real ~/.bukkurc is never read.
const home = await mkdtemp(join(tmpdir(), "bukku-auth-"));
process.env["HOME"] = home;
const { resolveAuth } = await import("./auth.js");

const ENV_KEYS = ["BUKKU_API_TOKEN", "BUKKU_COMPANY_SUBDOMAIN"];

describe("resolveAuth with ~/.bukkurc", () => {
  before(async () => {
    await writeFile(join(home, ".bukkurc"), "api_token = rc_token\ncompany_subdomain = rc_sub\n");
  });

  after(async () => {
    await rm(home, { recursive: true, force: true });
  });

  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  test("uses the rc file when no flags or env vars are set", async () => {
    const auth = await resolveAuth({});
    assert.strictEqual(auth.apiToken, "rc_token");
    assert.strictEqual(auth.companySubdomain, "rc_sub");
    assert.deepStrictEqual(auth.source, { apiToken: "rc", companySubdomain: "rc" });
  });

  test("env vars override the rc file", async () => {
    process.env["BUKKU_API_TOKEN"] = "env_token";
    process.env["BUKKU_COMPANY_SUBDOMAIN"] = "env_sub";
    const auth = await resolveAuth({});
    assert.strictEqual(auth.apiToken, "env_token");
    assert.strictEqual(auth.companySubdomain, "env_sub");
    assert.deepStrictEqual(auth.source, { apiToken: "env", companySubdomain: "env" });
  });

  test("each value resolves on its own: env token with rc subdomain", async () => {
    process.env["BUKKU_API_TOKEN"] = "env_token";
    const auth = await resolveAuth({});
    assert.strictEqual(auth.apiToken, "env_token");
    assert.strictEqual(auth.companySubdomain, "rc_sub");
    assert.deepStrictEqual(auth.source, { apiToken: "env", companySubdomain: "rc" });
  });

  test("flags override both env vars and the rc file", async () => {
    process.env["BUKKU_API_TOKEN"] = "env_token";
    const auth = await resolveAuth({ apiToken: "flag_token", companySubdomain: "flag_sub" });
    assert.strictEqual(auth.apiToken, "flag_token");
    assert.strictEqual(auth.companySubdomain, "flag_sub");
    assert.deepStrictEqual(auth.source, { apiToken: "flags", companySubdomain: "flags" });
  });
});
