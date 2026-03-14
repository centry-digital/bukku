# @centry-digital/bukku-cli

[![npm version](https://img.shields.io/npm/v/@centry-digital/bukku-cli)](https://www.npmjs.com/package/@centry-digital/bukku-cli)

A command-line interface for [Bukku](https://bukku.my), a Malaysian accounting platform. Manage invoices, contacts, products, and more from your terminal.

## What can it do?

The CLI exposes **169 commands** across 9 categories, covering the full Bukku API:

| Category | Commands | What you can do |
|----------|----------|-----------------|
| **Sales** | 42 | Quotes, orders, delivery orders, invoices, credit notes, payments, refunds |
| **Purchases** | 36 | Purchase orders, bills, credit notes, goods received notes, payments, refunds |
| **Banking** | 18 | Money in, money out, bank transfers |
| **Contacts** | 12 | Customers, suppliers, contact groups |
| **Products** | 18 | Products, bundles, product groups |
| **Accounting** | 13 | Chart of accounts, journal entries |
| **Files** | 3 | Upload and manage file attachments |
| **Control Panel** | 21 | Locations, tags, tag groups |
| **Reference Data** | 10 | Tax codes, currencies, payment methods, terms, and more |

Every list/get/create/update/delete operation available in the Bukku web UI is available from the command line.

## Quick Start

Try it without installing:

```bash
npx @centry-digital/bukku-cli --help
```

Or install globally:

```bash
npm install -g @centry-digital/bukku-cli
bukku --help
```

## Configuration

The CLI needs two things: your API token and company subdomain. There are three ways to provide them, listed in order of precedence:

### 1. CLI flags (highest precedence)

```bash
bukku --api-token YOUR_TOKEN --company-subdomain YOUR_SUB sales invoices list
```

### 2. Environment variables

```bash
export BUKKU_API_TOKEN=your-token-here
export BUKKU_COMPANY_SUBDOMAIN=your-subdomain
bukku sales invoices list
```

### 3. Config file (~/.bukkurc)

```bash
bukku config set api_token your-token-here
bukku config set company_subdomain your-subdomain
```

Verify your configuration:

```bash
bukku config show
```

This shows the resolved value for each field and where it came from (flag, environment variable, or config file).

## Usage Examples

### Sales

```bash
# List recent invoices
bukku sales invoices list --limit 5

# Get a specific invoice
bukku sales invoices get 123

# Create an invoice
bukku sales invoices create --data '{
  "contact_id": 1,
  "date": "2025-01-15",
  "currency_code": "MYR",
  "exchange_rate": 1,
  "tax_mode": "exclusive",
  "payment_mode": "credit",
  "status": "draft",
  "form_items": [{"account_id": 100, "description": "Consulting", "amount": 5000}],
  "term_items": [{"payment_due": "100%", "date": "2025-02-15"}]
}'

# List quotes in table format
bukku sales quotes list --format table
```

### Purchases

```bash
# List bills
bukku purchases bills list --format table

# Get a specific bill
bukku purchases bills get 456

# List purchase orders
bukku purchases orders list --limit 10
```

### Banking

```bash
# List money-in transactions
bukku banking money-in list --limit 10

# List money-out transactions
bukku banking money-out list --format table

# List bank transfers
bukku banking transfers list
```

### Contacts

```bash
# List all contacts
bukku contacts contacts list --format table

# Get a specific contact
bukku contacts contacts get 789

# List contact groups
bukku contacts contact-groups list
```

### Products

```bash
# List products
bukku products products list --format table

# Get a specific product
bukku products products get 123

# List product groups
bukku products product-groups list
```

### Accounting

```bash
# List journal entries
bukku accounting journal-entries list

# Search chart of accounts
bukku accounting accounts list --format table
```

### Files

```bash
# Upload a file
bukku files upload /path/to/receipt.pdf

# List uploaded files
bukku files files list
```

### Control Panel

```bash
# List locations
bukku control-panel locations list

# List tags
bukku control-panel tags list --format table

# List tag groups
bukku control-panel tag-groups list
```

### Reference Data

```bash
# List tax codes
bukku ref-data tax-codes

# List currencies
bukku ref-data currencies

# List payment methods
bukku ref-data payment-methods

# List classification codes (Malaysia e-Invoice)
bukku ref-data classification-codes
```

## Input Formats

For create and update commands, provide JSON data in one of these ways:

**Inline with `--data` flag:**

```bash
bukku sales invoices create --data '{"contact_id": 1, "date": "2025-01-15", ...}'
```

**Piped from a file:**

```bash
cat invoice.json | bukku sales invoices create
```

**Dry run (preview without sending):**

```bash
bukku sales invoices create --data '{"contact_id": 1, ...}' --dry-run
```

Dry run shows the HTTP method, URL, and request body that would be sent, without making the API call.

## Output Formats

**JSON (default):** Machine-readable output, easy to pipe to `jq`:

```bash
bukku sales invoices list | jq '.[0].total'
```

**Table:** Human-readable table format:

```bash
bukku sales invoices list --format table
```

Errors are written to stderr as structured JSON, so they don't interfere with piped output.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Authentication error (missing or invalid credentials) |
| 3 | API error (Bukku returned an error) |
| 4 | Validation error (invalid input or config) |

## Getting Your API Token

1. Log into your [Bukku](https://bukku.my) account
2. Go to **Control Panel > Integrations > API Access**
3. Generate a new API token (or copy your existing one)
4. Note your company subdomain from the URL (e.g. `mycompany` from `mycompany.bukku.my`)

## Related

- [@centry-digital/bukku-mcp](https://www.npmjs.com/package/@centry-digital/bukku-mcp) -- MCP server for connecting AI assistants (Claude, etc.) to Bukku
- [GitHub repository](https://github.com/centry-digital/bukku-mcp)

## License

MIT
