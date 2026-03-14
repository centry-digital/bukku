/**
 * Table output formatter with per-resource column definitions.
 * Zero external dependencies — renders plain-text aligned tables to stdout.
 */

interface Column {
  key: string;
  header: string;
  width: number;
  align: 'left' | 'right';
}

function col(key: string, header: string, width: number, align: 'left' | 'right' = 'left'): Column {
  return { key, header, width, align };
}

function id(width = 6): Column {
  return col('id', 'ID', width, 'right');
}

const paymentColumns: Column[] = [
  id(6),
  col('date', 'Date', 12),
  col('number', 'Number', 15),
  col('contact_name', 'Contact', 25),
  col('total', 'Amount', 12, 'right'),
];

function transactionColumns(): Column[] {
  return [
    id(6),
    col('date', 'Date', 12),
    col('number', 'Number', 15),
    col('contact_name', 'Contact', 25),
    col('total', 'Total', 12, 'right'),
    col('status', 'Status', 12),
  ];
}

const DEFAULT_COLUMNS: Column[] = [
  id(8),
  col('name', 'Name', 30),
  col('description', 'Description', 40),
];

const TABLE_COLUMNS: Record<string, Column[]> = {
  // Sales / Purchase transaction types
  'sales-invoice': transactionColumns(),
  'sales-quote': transactionColumns(),
  'sales-order': transactionColumns(),
  'sales-credit-note': transactionColumns(),
  'sales-payment': paymentColumns,
  'sales-refund': paymentColumns,
  'delivery-order': [id(6), col('date', 'Date', 12), col('number', 'Number', 15), col('contact_name', 'Contact', 25), col('status', 'Status', 12)],
  'purchase-bill': transactionColumns(),
  'purchase-order': transactionColumns(),
  'purchase-credit-note': transactionColumns(),
  'purchase-payment': paymentColumns,
  'purchase-refund': paymentColumns,
  'goods-received-note': [id(6), col('date', 'Date', 12), col('number', 'Number', 15), col('contact_name', 'Contact', 25), col('status', 'Status', 12)],
  // Banking
  'bank-money-in': transactionColumns(),
  'bank-money-out': transactionColumns(),
  'bank-transfer': [id(6), col('date', 'Date', 12), col('number', 'Number', 15), col('total', 'Amount', 12, 'right'), col('status', 'Status', 12)],
  // Contacts
  'contact': [id(6), col('name', 'Name', 30), col('email', 'Email', 25), col('type', 'Type', 10), col('phone', 'Phone', 15)],
  'contact-group': [id(6), col('name', 'Name', 30), col('contacts_count', 'Contacts', 10, 'right')],
  // Products
  'product': [id(6), col('name', 'Name', 30), col('code', 'Code', 12), col('type', 'Type', 10), col('sale_price', 'Price', 12, 'right')],
  'product-bundle': [id(6), col('name', 'Name', 30), col('code', 'Code', 12), col('sale_price', 'Price', 12, 'right')],
  'product-group': [id(6), col('name', 'Name', 30)],
  // Accounting
  'journal-entry': [id(6), col('date', 'Date', 12), col('number', 'Number', 15), col('description', 'Description', 30), col('status', 'Status', 12)],
  'account': [id(6), col('code', 'Code', 8), col('name', 'Name', 30), col('category', 'Category', 12), col('balance', 'Balance', 12, 'right')],
  // Files
  'file': [id(6), col('name', 'Name', 35), col('content_type', 'Type', 20), col('size', 'Size', 10, 'right')],
  // Control Panel
  'location': [id(6), col('name', 'Name', 30), col('is_archived', 'Archived', 10)],
  'tag': [id(6), col('name', 'Name', 30), col('tag_group_id', 'Group ID', 10, 'right')],
  'tag-group': [id(6), col('name', 'Name', 30)],
};

/**
 * Convert a value to a display string.
 */
function toStr(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return String(value);
}

/**
 * Pad/truncate a string to exactly `width` characters.
 */
function fit(text: string, width: number, align: 'left' | 'right'): string {
  if (text.length > width) {
    return width > 3 ? text.slice(0, width - 3) + '...' : text.slice(0, width);
  }
  return align === 'right' ? text.padStart(width) : text.padEnd(width);
}

/**
 * Format rows into a plain-text table string.
 */
function formatTable(rows: Record<string, unknown>[], columns: Column[]): string {
  const gap = '  ';
  const lines: string[] = [];

  // Header row
  lines.push(columns.map((c) => fit(c.header, c.width, c.align)).join(gap));

  // Separator row
  lines.push(columns.map((c) => '-'.repeat(c.width)).join(gap));

  // Data rows
  for (const row of rows) {
    lines.push(
      columns
        .map((c) => fit(toStr(row[c.key]), c.width, c.align))
        .join(gap),
    );
  }

  return lines.join('\n') + '\n';
}

/**
 * Output data as a formatted table to stdout.
 *
 * @param data - Array of resource objects
 * @param columns - Optional string array where first element is the entity name
 *                   (kept as string[] for backwards compatibility with factory calls)
 */
export function outputTable(data: unknown, columns?: string[]): void {
  const items = Array.isArray(data) ? data : [data];

  if (items.length === 0) {
    process.stdout.write('(no results)\n');
    return;
  }

  const entityName = columns?.[0];
  const colDefs = (entityName && TABLE_COLUMNS[entityName]) || DEFAULT_COLUMNS;
  const rows = items as Record<string, unknown>[];

  process.stdout.write(formatTable(rows, colDefs));
}
