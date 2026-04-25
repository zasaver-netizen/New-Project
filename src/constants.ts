/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medicine, Customer, Invoice } from './types';

export const MEDICINES: Medicine[] = [
  {
    id: 'm1',
    barcode: '123456789012',
    name: 'Panadol',
    genericName: 'Paracetamol',
    category: 'Analgesic',
    manufacturer: 'GSK',
    unit: 'Tablet',
    price: 3.5,
    stock: 500,
    batches: [
      { id: 'b1', batchNumber: 'PN-001', expiryDate: '2026-12-01', quantity: 300 },
      { id: 'b2', batchNumber: 'PN-002', expiryDate: '2027-04-01', quantity: 200 }
    ]
  },
  {
    id: 'm2',
    barcode: '123456789013',
    name: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    category: 'Antibiotic',
    manufacturer: 'GSK',
    unit: 'Tablet',
    price: 45.0,
    stock: 120,
    batches: [
      { id: 'b3', batchNumber: 'AG-99', expiryDate: '2025-08-15', quantity: 120 }
    ]
  },
  {
    id: 'm3',
    barcode: '123456789014',
    name: 'Brufen 400mg',
    genericName: 'Ibuprofen',
    category: 'Analgesic/Anti-inflammatory',
    manufacturer: 'Abbott',
    unit: 'Tablet',
    price: 5.2,
    stock: 300,
    batches: [
      { id: 'b4', batchNumber: 'BF-202', expiryDate: '2026-01-10', quantity: 300 }
    ]
  },
  {
    id: 'm4',
    name: 'Hydryllin Syrup',
    genericName: 'Aminophylline + Diphenhydramine',
    category: 'Cough Syrup',
    manufacturer: 'Searle',
    unit: 'Syrup',
    price: 110.0,
    stock: 45,
    batches: [
      { id: 'b5', batchNumber: 'HY-45', expiryDate: '2025-11-20', quantity: 45 }
    ]
  },
  {
    id: 'm5',
    name: 'Softin 10mg',
    genericName: 'Loratadine',
    category: 'Antihistamine',
    manufacturer: 'Hilton',
    unit: 'Tablet',
    price: 15.0,
    stock: 15,
    batches: [
      { id: 'b6', batchNumber: 'SF-101', expiryDate: '2025-05-22', quantity: 15 }
    ]
  },
  {
    id: 'm6',
    name: 'Flagyl 400mg',
    genericName: 'Metronidazole',
    category: 'Antibiotic',
    manufacturer: 'Sanofi',
    unit: 'Tablet',
    price: 4.8,
    stock: 250,
    batches: [
      { id: 'b7', batchNumber: 'FL-90', expiryDate: '2026-09-30', quantity: 250 }
    ]
  },
  {
    id: 'm7',
    name: 'Risek 20mg',
    genericName: 'Omeprazole',
    category: 'PPI / Antacid',
    manufacturer: 'Getz',
    unit: 'Capsule',
    price: 22.5,
    stock: 90,
    batches: [
      { id: 'b8', batchNumber: 'RS-44', expiryDate: '2025-12-15', quantity: 90 }
    ]
  }
];

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Zeeshan Ahmad', phone: '0300-1234567', totalPurchases: 1540 },
  { id: 'c2', name: 'Farhan Ali', phone: '0321-7654321', totalPurchases: 890 }
];

export const SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Getz Pharma Distribution', contactPerson: 'Aslam Khan', phone: '021-3456789', email: 'dist@getz.com' },
  { id: 's2', name: 'GSK Pakistan', contactPerson: 'Mr. Siddiqui', phone: '021-111475111', email: 'sales.pk@gsk.com' }
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-1001',
    supplierId: 's1',
    supplierName: 'Getz Pharma Distribution',
    date: '2026-04-20',
    items: [
      { medicineId: 'm7', medicineName: 'Risek 20mg', quantity: 100, unitPrice: 18.5, total: 1850 }
    ],
    totalAmount: 1850,
    status: 'Pending'
  }
];

