#!/usr/bin/env npx tsx
/**
 * Daily check of Bukku's published changelog and API specs.
 * Run: npx tsx scripts/api-monitor/changelog-check.ts [--print]
 *
 * Compares what developers.bukku.my publishes today with the snapshot kept in the closed
 * `api-monitor` state issue. The first run only saves a snapshot. When something changed it opens
 * one `api-monitor` issue describing it and sets the `issue` step output for the Claude job.
 * `--print` prints today's snapshot and touches nothing on GitHub.
 *
 * Exits non-zero when the site can't be read or no longer looks as expected, so a failed scheduled
 * run (which GitHub emails about) is the signal to look by hand.
 */

import {
  DOCS_BASE,
  diffSnapshots,
  extractChangelogEntries,
  findBundleUrl,
  findSpecPaths,
  hasChanges,
  sha256,
} from "./snapshot.js";
import type { ChangelogEntry, Snapshot } from "./snapshot.js";
import { STATE_MARKER, formatChangeIssue, formatState, parseState } from "./report.js";
import {
  createIssue,
  ensureLabel,
  findByMarker,
  listMonitorIssues,
  setOutput,
  updateIssue,
} from "./github.js";

async function fetchText(url: string): Promise<{ status: number; text: string }> {
  const res = await fetch(url, { headers: { "User-Agent": "bukku-api-monitor" } });
  return { status: res.status, text: await res.text() };
}

async function takeSnapshot(): Promise<{ snapshot: Snapshot; entries: ChangelogEntry[] }> {
  const page = await fetchText(`${DOCS_BASE}/changelog`);
  if (page.status !== 200) throw new Error(`Changelog page answered ${page.status}`);
  const bundleUrl = findBundleUrl(page.text);
  if (!bundleUrl) throw new Error("No main JS bundle linked from the changelog page");
  const bundle = await fetchText(bundleUrl);
  if (bundle.status !== 200) throw new Error(`${bundleUrl} answered ${bundle.status}`);

  const entries = extractChangelogEntries(bundle.text);
  if (entries.length === 0) {
    throw new Error("No changelog entries found in the bundle: the site's format has changed");
  }

  const specs: Record<string, string> = {};
  const queue = findSpecPaths(bundle.text);
  if (queue.length === 0) throw new Error("No API spec files referenced by the bundle");
  while (queue.length) {
    const path = queue.shift()!;
    if (path in specs) continue;
    const spec = await fetchText(`${DOCS_BASE}/specs/${path}`);
    // A static host may answer an unknown path with the app's HTML page.
    const isYaml = spec.status === 200 && !/^\s*<(!doctype|html)/i.test(spec.text);
    specs[path] = isYaml ? sha256(spec.text) : `unavailable (${spec.status})`;
    if (isYaml) queue.push(...findSpecPaths(spec.text, path).filter((p) => !(p in specs)));
  }

  const ids = Object.fromEntries(entries.map((e) => [e.id, e.label]));
  return { snapshot: { entries: ids, specs }, entries };
}

async function main(): Promise<void> {
  const { snapshot, entries } = await takeSnapshot();
  console.log(
    `Read ${entries.length} changelog entries and ${Object.keys(snapshot.specs).length} spec files.`,
  );
  if (process.argv.includes("--print")) {
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  const now = new Date().toISOString();
  await ensureLabel();
  const issues = await listMonitorIssues();
  const stateIssue = findByMarker(issues, STATE_MARKER);
  const previous = parseState(stateIssue?.body ?? null);

  if (!stateIssue || !previous) {
    const body = formatState(snapshot, now);
    const issue = stateIssue
      ? await updateIssue(stateIssue.number, { body, state: "closed" })
      : await createIssue("Bukku API monitor: saved snapshot (keep closed)", body);
    if (!stateIssue) await updateIssue(issue.number, { state: "closed" });
    console.log(`First run: saved today's snapshot in #${issue.number}. Nothing to compare yet.`);
    return;
  }

  const diff = diffSnapshots(previous, snapshot);
  if (!hasChanges(diff)) {
    console.log("No changes since the last snapshot.");
    return;
  }

  const { title, body } = formatChangeIssue(diff, entries);
  const issue = await createIssue(title, body);
  console.log(`Changes found: opened #${issue.number} ${issue.html_url}`);
  console.log(JSON.stringify(diff, null, 2));
  setOutput("issue", String(issue.number));
  // Saved only after the issue exists, so a failed run reports the same changes again tomorrow.
  await updateIssue(stateIssue.number, { body: formatState(snapshot, now), state: "closed" });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
