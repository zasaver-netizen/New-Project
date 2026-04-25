/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Medicine {
  id: string;
  barcode?: string; // Added barcode property
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  unit: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Other';
  price: number;
  stock: number;
  batches: Batch[];
}

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
}

export interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  price: number;
  total: number;
  expiryDate: string;
}

export interface Invoice {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
}

export interface PurchaseOrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Received' | 'Cancelled';
}

export interface BusinessProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
  tagline?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: 'Cash' | 'Bank';
}

export interface CashAccount {
  id: string;
  name: string;
  balance: number;
  type: 'Cash' | 'Bank';
}

export interface Quotation {
  id: string;
  customerName: string;
  date: string;
  validUntil: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Converted' | 'Expired';
  note?: string;
}
