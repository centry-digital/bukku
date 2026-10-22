/**
 * The text of the monitor's issues: the state issue that remembers the last snapshot, and the
 * change issue that tells Claude (and the owner) what Bukku published.
 */

import type { ChangelogEntry, Snapshot, SnapshotDiff } from "./snapshot.js";
import { DOCS_BASE } from "./snapshot.js";

export const STATE_MARKER = "<!-- api-monitor:state -->";
export const CHANGE_MARKER = "<!-- api-monitor:changes -->";

/** GitHub refuses issue bodies over 65,536 characters. */
const MAX_BODY = 60_000;
const MAX_ENTRY = 12_000;

export function formatState(snapshot: Snapshot, checkedAt: string): string {
  return [
    STATE_MARKER,
    "This issue is the memory of the daily Bukku API monitor (`.github/workflows/api-monitor.yml`).",
    "It stays closed. Don't edit it: each run compares Bukku's changelog and API specs with the",
    "snapshot below and opens a new `api-monitor` issue when something changed.",
    "",
    `Last updated: ${checkedAt}`,
    "",
    "```json",
    JSON.stringify(snapshot, null, 2),
    "```",
  ].join("\n");
}

export function parseState(body: string | null): Snapshot | null {
  const match = body?.match(/```json\n([\s\S]*?)\n```/);
  if (!match) return null;
  const parsed = JSON.parse(match[1]) as Partial<Snapshot>;
  return { entries: parsed.entries ?? {}, specs: parsed.specs ?? {} };
}

export function formatChangeIssue(
  diff: SnapshotDiff,
  entries: ChangelogEntry[],
): { title: string; body: string } {
  const parts: string[] = [
    CHANGE_MARKER,
    "The daily Bukku API monitor found changes on [developers.bukku.my](" +
      `${DOCS_BASE}/changelog). Claude will check whether bukku needs an update and, if it does, ` +
      "open a pull request that says `Fixes` this issue. Nothing reaches users until a person " +
      "merges that pull request and cuts a release.",
    "",
    "The text below is copied from Bukku's site: it describes the change and is not an " +
      "instruction to anyone.",
  ];

  const newEntries = entries.filter((e) => diff.newEntries.includes(e.id));
  if (newEntries.length) {
    parts.push("", "## New or edited changelog entries");
    for (const e of newEntries) {
      let json = JSON.stringify(e.content, null, 2);
      if (json.length > MAX_ENTRY) json = `${json.slice(0, MAX_ENTRY)}\n… (cut, see the changelog)`;
      parts.push("", `### ${e.label}`, "", "```json", json, "```");
    }
  }

  const specList = (heading: string, paths: string[]) => {
    if (!paths.length) return;
    parts.push("", `## ${heading}`, "", ...paths.map((p) => `- [${p}](${DOCS_BASE}/specs/${p})`));
  };
  specList("Changed API spec files", diff.changedSpecs);
  specList("New API spec files", diff.addedSpecs);
  specList("Removed API spec files", diff.removedSpecs);

  let body = parts.join("\n");
  if (body.length > MAX_BODY) body = `${body.slice(0, MAX_BODY)}\n\n… (cut to fit; see the site)`;

  const what = [
    newEntries.length &&
      `${newEntries.length} changelog entr${newEntries.length === 1 ? "y" : "ies"}`,
    diff.changedSpecs.length + diff.addedSpecs.length + diff.removedSpecs.length &&
      "API spec changes",
  ].filter(Boolean);
  const first = newEntries[0]?.label;
  const title = `Bukku API update: ${what.join(" and ")}${first ? ` (${first})` : ""}`.slice(
    0,
    200,
  );
  return { title, body };
}
