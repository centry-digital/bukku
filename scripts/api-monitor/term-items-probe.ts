#!/usr/bin/env npx tsx
/**
 * Live check: does Bukku apply `term_items` on sales quotes yet?
 * Run: npx tsx scripts/api-monitor/term-items-probe.ts
 *
 * Bukku's changelog says quotes and orders moved from a top-level `term_id` to `term_items` on
 * 21 October 2026, but on 22 October the API still applied `term_id` and silently ignored
 * `term_items`. The changelog can't announce the real switch, so this checks it directly: it
 * creates one draft quote that sets payment terms only through `term_items`, reads it back and
 * deletes it. When the terms stuck, it opens an `api-monitor` issue (once) and sets the `issue`
 * step output for the Claude job.
 *
 * Needs BUKKU_API_TOKEN and BUKKU_COMPANY_SUBDOMAIN for a Bukku TEST company whose owner approved
 * this daily write. Without them it does nothing. The test company needs at least one sales quote,
 * which supplies the contact and income account for the draft.
 */

import { pathToFileURL } from "node:url";
import { createIssue, ensureLabel, findByMarker, listMonitorIssues, setOutput } from "./github.js";

export const SWITCH_MARKER = "<!-- api-monitor:term-items-honoured -->";

interface TermItem {
  term_id?: number | null;
}

interface Quote {
  id: number;
  contact_id?: number;
  form_items?: { account_id?: number }[];
  term_items?: TermItem[];
}

/** True when Bukku stored the payment term that was sent only through term_items. */
export function termItemsHonoured(stored: Quote, termId: number): boolean {
  return stored.term_items?.[0]?.term_id === termId;
}

/** The body of the probe's draft quote: payment terms only through term_items. */
export function probeQuoteBody(template: Quote, termId: number, date: string) {
  const accountId = template.form_items?.find((i) => i.account_id)?.account_id;
  if (!template.contact_id || !accountId) {
    throw new Error(`Quote ${template.id} has no contact or income account to copy`);
  }
  return {
    contact_id: template.contact_id,
    date,
    currency_code: "MYR",
    exchange_rate: 1,
    tax_mode: "exclusive",
    status: "draft",
    description: "Automated check by the bukku API monitor; deleted straight away",
    form_items: [
      { account_id: accountId, description: "API monitor check", quantity: 1, unit_price: 1 },
    ],
    term_items: [{ term_id: termId, payment_due: "100%" }],
  };
}

async function bukku<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.bukku.my${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.BUKKU_API_TOKEN}`,
      "Company-Subdomain": process.env.BUKKU_COMPANY_SUBDOMAIN!,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  // Status and path only: responses can hold company data and this log is public.
  if (!res.ok) throw new Error(`Bukku ${method} ${path.split("?")[0]} answered ${res.status}`);
  return (text ? JSON.parse(text) : {}) as T;
}

async function main(): Promise<void> {
  if (!process.env.BUKKU_API_TOKEN || !process.env.BUKKU_COMPANY_SUBDOMAIN) {
    console.log("No Bukku test company credentials: skipping the live term_items check.");
    return;
  }

  const terms = await bukku<{ terms?: { items?: { id: number }[] } }>("GET", "/terms");
  const termId = terms.terms?.items?.[0]?.id;
  if (!termId) throw new Error("The test company has no payment terms");

  const list = await bukku<{ transactions?: Quote[] }>("GET", "/sales/quotes?page_size=1");
  const first = list.transactions?.[0];
  if (!first) throw new Error("The test company has no sales quote to copy a contact from");
  const template = (await bukku<{ transaction: Quote }>("GET", `/sales/quotes/${first.id}`))
    .transaction;

  const date = new Date().toISOString().slice(0, 10);
  const created = await bukku<{ transaction: Quote }>(
    "POST",
    "/sales/quotes",
    probeQuoteBody(template, termId, date),
  );
  const id = created.transaction.id;
  let honoured: boolean;
  try {
    const stored = (await bukku<{ transaction: Quote }>("GET", `/sales/quotes/${id}`)).transaction;
    honoured = termItemsHonoured(stored, termId);
  } finally {
    await bukku("DELETE", `/sales/quotes/${id}`);
    console.log("Deleted the draft quote.");
  }

  if (!honoured) {
    console.log("Bukku still ignores term_items on sales quotes (the current tool advice holds).");
    return;
  }

  console.log("Bukku now applies term_items on sales quotes.");
  await ensureLabel();
  const existing = findByMarker(await listMonitorIssues(), SWITCH_MARKER);
  if (existing) {
    console.log(`Already reported in #${existing.number}.`);
    return;
  }
  const issue = await createIssue(
    "Bukku now applies term_items on sales quotes: switch the payment-terms advice",
    [
      SWITCH_MARKER,
      `The daily live check on ${date} created a draft quote in the test company with payment terms ` +
        "only in `term_items`, and Bukku stored them (the draft was then deleted). Until now Bukku " +
        "ignored `term_items` and applied only a top-level `term_id`, so bukku tells assistants to " +
        "send `term_id`.",
      "",
      "What needs changing:",
      "- the payment-terms advice in `packages/core/src/entities/sales-quote.ts` and " +
        "`sales-order.ts` (and the `list-terms` description) should prefer `term_items`;",
      "- the README's old vs new payment-terms section;",
      "- whether `packages/core/src/validation/write-rules.ts` should refuse a top-level " +
        "`term_id` again, as Bukku's changelog announced (check the changelog and specs first);",
      "- for a person after that PR: the verify-bukku `api-write-rules` recipe's gotcha about " +
        "Bukku ignoring `term_items` (Claude may not change `.claude/`).",
      "",
      "Sales orders weren't checked live; they changed at the same time in Bukku's changelog.",
    ].join("\n"),
  );
  console.log(`Opened #${issue.number} ${issue.html_url}`);
  setOutput("issue", String(issue.number));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
