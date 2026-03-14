import type { CrudEntityConfig } from '../types/bukku.js';

// Sales
import { salesInvoiceConfig } from './sales-invoice.js';
import { salesQuoteConfig } from './sales-quote.js';
import { salesOrderConfig } from './sales-order.js';
import { salesCreditNoteConfig } from './sales-credit-note.js';
import { salesPaymentConfig } from './sales-payment.js';
import { salesRefundConfig } from './sales-refund.js';
import { deliveryOrderConfig } from './delivery-order.js';

// Purchases
import { purchaseOrderConfig } from './purchase-order.js';
import { purchaseBillConfig } from './purchase-bill.js';
import { purchaseCreditNoteConfig } from './purchase-credit-note.js';
import { purchasePaymentConfig } from './purchase-payment.js';
import { purchaseRefundConfig } from './purchase-refund.js';
import { goodsReceivedNoteConfig } from './goods-received-note.js';

// Banking
import { bankMoneyInConfig } from './bank-money-in.js';
import { bankMoneyOutConfig } from './bank-money-out.js';
import { bankTransferConfig } from './bank-transfer.js';

// Contacts
import { contactConfig } from './contact.js';
import { contactGroupConfig } from './contact-group.js';

// Products
import { productConfig } from './product.js';
import { productBundleConfig } from './product-bundle.js';
import { productGroupConfig } from './product-group.js';

// Accounting
import { journalEntryConfig } from './journal-entry.js';
import { accountConfig } from './account.js';

// Files
import { fileConfig } from './file.js';

// Control Panel
import { locationConfig } from './location.js';
import { tagConfig } from './tag.js';
import { tagGroupConfig } from './tag-group.js';

// Re-export all individual configs
export {
  salesInvoiceConfig,
  salesQuoteConfig,
  salesOrderConfig,
  salesCreditNoteConfig,
  salesPaymentConfig,
  salesRefundConfig,
  deliveryOrderConfig,
  purchaseOrderConfig,
  purchaseBillConfig,
  purchaseCreditNoteConfig,
  purchasePaymentConfig,
  purchaseRefundConfig,
  goodsReceivedNoteConfig,
  bankMoneyInConfig,
  bankMoneyOutConfig,
  bankTransferConfig,
  contactConfig,
  contactGroupConfig,
  productConfig,
  productBundleConfig,
  productGroupConfig,
  journalEntryConfig,
  accountConfig,
  fileConfig,
  locationConfig,
  tagConfig,
  tagGroupConfig,
};

/** All 27 entity configs as an array for iteration */
export const allEntityConfigs: CrudEntityConfig[] = [
  salesInvoiceConfig, salesQuoteConfig, salesOrderConfig,
  salesCreditNoteConfig, salesPaymentConfig, salesRefundConfig, deliveryOrderConfig,
  purchaseOrderConfig, purchaseBillConfig, purchaseCreditNoteConfig,
  purchasePaymentConfig, purchaseRefundConfig, goodsReceivedNoteConfig,
  bankMoneyInConfig, bankMoneyOutConfig, bankTransferConfig,
  contactConfig, contactGroupConfig,
  productConfig, productBundleConfig, productGroupConfig,
  journalEntryConfig, accountConfig,
  fileConfig,
  locationConfig, tagConfig, tagGroupConfig,
];

/** Lookup entity config by entity name (e.g., "sales-invoice") */
export function entityConfigByName(name: string): CrudEntityConfig | undefined {
  return allEntityConfigs.find(c => c.entity === name);
}
