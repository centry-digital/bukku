/**
 * Bukku API snapshot: the changelog entries and OpenAPI spec files published on
 * developers.bukku.my, reduced to fingerprints so two days can be compared.
 *
 * The changelog page is a client-rendered app, so the entries are read from its main JS bundle,
 * where each one is embedded as `JSON.parse('{"$schema":"../changelog.schema.json",...}')`.
 */

import { createHash } from "node:crypto";

export const DOCS_BASE = "https://developers.bukku.my";

export interface ChangelogEntry {
  /** Fingerprint of the entry's content: an edited entry counts as new. */
  id: string;
  /** Short human label (date and title when the entry has them). */
  label: string;
  /** The entry as published, without its $schema. */
  content: unknown;
}

export interface Snapshot {
  entries: Record<string, string>; // id -> label
  specs: Record<string, string>; // spec path under /specs/ -> sha256
}

export interface SnapshotDiff {
  newEntries: string[];
  changedSpecs: string[];
  addedSpecs: string[];
  removedSpecs: string[];
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** JSON with object keys sorted, so key order in the bundle doesn't change a fingerprint. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** The main bundle's URL, from the page HTML (`/static/js/main.<hash>.js`). */
export function findBundleUrl(html: string, base = DOCS_BASE): string | null {
  const match = html.match(/["'(]([^"'()]*\/static\/js\/main\.[\w-]+\.js)["')]/);
  return match ? new URL(match[1], base).toString() : null;
}

/**
 * Decodes the body of a single-quoted JS string literal (the text between the quotes).
 */
export function decodeJsString(body: string): string {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = body[++i];
    switch (next) {
      case "n":
        out += "\n";
        break;
      case "r":
        out += "\r";
        break;
      case "t":
        out += "\t";
        break;
      case "b":
        out += "\b";
        break;
      case "f":
        out += "\f";
        break;
      case "v":
        out += "\v";
        break;
      case "0":
        out += "\0";
        break;
      case "x":
        out += String.fromCharCode(parseInt(body.slice(i + 1, i + 3), 16));
        i += 2;
        break;
      case "u":
        if (body[i + 1] === "{") {
          const end = body.indexOf("}", i);
          out += String.fromCodePoint(parseInt(body.slice(i + 2, end), 16));
          i = end;
        } else {
          out += String.fromCharCode(parseInt(body.slice(i + 1, i + 5), 16));
          i += 4;
        }
        break;
      case "\n":
        break; // line continuation
      default:
        out += next; // \\ \' \" \/ and any other escaped character
    }
  }
  return out;
}

function entryLabel(content: Record<string, unknown>): string {
  const pick = (...keys: string[]) =>
    keys.map((k) => content[k]).find((v) => typeof v === "string" && v.trim()) as
      string | undefined;
  const date = pick("date", "released_at", "releaseDate", "published", "version");
  const title = pick("title", "name", "summary", "description");
  return [date, title].filter(Boolean).join(": ") || "(untitled entry)";
}

/** Every changelog entry embedded in the bundle. */
export function extractChangelogEntries(js: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const marker = "JSON.parse('";
  let from = 0;
  for (;;) {
    const start = js.indexOf(marker, from);
    if (start === -1) break;
    let i = start + marker.length;
    while (i < js.length && js[i] !== "'") i += js[i] === "\\" ? 2 : 1;
    from = i + 1;
    const body = js.slice(start + marker.length, i);
    if (!body.includes("changelog.schema.json")) continue;
    const parsed = JSON.parse(decodeJsString(body)) as Record<string, unknown>;
    const { $schema: _schema, ...content } = parsed;
    entries.push({
      id: sha256(canonicalJson(content)).slice(0, 16),
      label: entryLabel(content),
      content,
    });
  }
  return entries;
}

/** Spec file paths (relative to /specs/) mentioned in a bundle or in another spec's $refs. */
export function findSpecPaths(text: string, fromSpec?: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\/?specs\/([\w./-]+\.ya?ml)/g)) found.add(m[1]);
  if (fromSpec !== undefined) {
    const dir = fromSpec.includes("/") ? fromSpec.slice(0, fromSpec.lastIndexOf("/") + 1) : "";
    for (const m of text.matchAll(/\$ref:\s*["']?([^"'#\s]+\.ya?ml)/g)) {
      const resolved = new URL(m[1], `${DOCS_BASE}/specs/${dir}`).pathname;
      if (resolved.startsWith("/specs/")) found.add(resolved.slice("/specs/".length));
    }
  }
  return [...found].sort();
}

export function diffSnapshots(previous: Snapshot, current: Snapshot): SnapshotDiff {
  const specs = (s: Snapshot) => new Set(Object.keys(s.specs));
  const prevSpecs = specs(previous);
  const curSpecs = specs(current);
  return {
    newEntries: Object.keys(current.entries).filter((id) => !(id in previous.entries)),
    changedSpecs: [...curSpecs].filter(
      (p) => prevSpecs.has(p) && previous.specs[p] !== current.specs[p],
    ),
    addedSpecs: [...curSpecs].filter((p) => !prevSpecs.has(p)),
    removedSpecs: [...prevSpecs].filter((p) => !curSpecs.has(p)),
  };
}

export function hasChanges(diff: SnapshotDiff): boolean {
  return Object.values(diff).some((list) => list.length > 0);
}
