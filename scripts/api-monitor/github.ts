/**
 * The few GitHub REST calls the API monitor needs, with the workflow's GITHUB_TOKEN.
 * Issues it opens are labelled `api-monitor`, and each carries a hidden marker so a later run
 * can find it again.
 */

import { appendFileSync } from "node:fs";

export const LABEL = "api-monitor";

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  pull_request?: unknown;
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function gh<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${env("GITHUB_REPOSITORY")}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env("GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = new Error(`GitHub ${method} ${path}: ${res.status} ${await res.text()}`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export async function ensureLabel(): Promise<void> {
  try {
    await gh("POST", "/labels", {
      name: LABEL,
      color: "0e8a16",
      description: "Opened by the daily Bukku API monitor",
    });
  } catch (e) {
    if ((e as { status?: number }).status !== 422) throw e; // 422: it already exists
  }
}

/** Every issue (open or closed) with the monitor's label. */
export async function listMonitorIssues(): Promise<Issue[]> {
  const all: Issue[] = [];
  for (let page = 1; ; page++) {
    const batch = await gh<Issue[]>(
      "GET",
      `/issues?labels=${LABEL}&state=all&per_page=100&page=${page}`,
    );
    all.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) return all;
  }
}

export function findByMarker(issues: Issue[], marker: string): Issue | undefined {
  return issues.find((i) => i.body?.includes(marker));
}

export async function createIssue(title: string, body: string): Promise<Issue> {
  return gh<Issue>("POST", "/issues", { title, body, labels: [LABEL] });
}

export async function updateIssue(
  number: number,
  fields: { body?: string; state?: "open" | "closed" },
): Promise<Issue> {
  return gh<Issue>("PATCH", `/issues/${number}`, fields);
}

/** Passes a value to later workflow steps (a no-op outside GitHub Actions). */
export function setOutput(name: string, value: string): void {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
