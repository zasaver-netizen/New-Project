/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  FileText, 
  Users, 
  Package, 
  Bell, 
  Search, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  History,
  Printer,
  Trash2,
  ChevronRight,
  Bot,
  Loader2,
  X,
  CreditCard,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MEDICINES, CUSTOMERS, SUPPLIERS, PURCHASE_ORDERS } from './constants';
import { Medicine, Invoice, InvoiceItem, Customer, Batch, Supplier, PurchaseOrder, PurchaseOrderItem, Quotation } from './types';
import { getMedicineInsights } from './services/geminiService';
import { BusinessProfile } from './types';

type View = 'dashboard' | 'inventory' | 'billing' | 'customers' | 'history' | 'po' | 'settings' | 'expenses' | 'quotations';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>(MEDICINES);
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-1001', customerName: 'Ali Khan', date: '2026-04-20', items: [{ medicineId: 'm1', medicineName: 'Panadol', batchNumber: 'B123', quantity: 2, price: 100, total: 200, expiryDate: '2027-12-01' }], subtotal: 200, discount: 0, tax: 0, total: 200, paymentStatus: 'Paid' },
    { id: 'INV-1002', customerName: 'Sara Ahmed', date: '2026-04-21', items: [{ medicineId: 'm2', medicineName: 'Calsum-D', batchNumber: 'B456', quantity: 1, price: 500, total: 500, expiryDate: '2027-06-01' }], subtotal: 500, discount: 50, tax: 0, total: 450, paymentStatus: 'Paid' }
  ]);
  const [quotations, setQuotations] = useState<Quotation[]>([
    { id: 'QT-9001', customerName: 'City Hospital', date: '2026-04-22', validUntil: '2026-04-29', items: [{ medicineId: 'm1', medicineName: 'Panadol', batchNumber: 'B123', quantity: 100, price: 95, total: 9500, expiryDate: '2027-12-01' }], subtotal: 9500, discount: 0, tax: 0, total: 9500, status: 'Draft' }
  ]);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState<Partial<Quotation>>({
    id: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    status: 'Draft'
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(PURCHASE_ORDERS);
  const [suppliers] = useState<Supplier[]>(SUPPLIERS);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 'EXP-001', category: 'Rent', amount: 25000, date: '2026-04-01', description: 'Pharmacy Rent for April', paymentMethod: 'Bank' },
    { id: 'EXP-002', category: 'Utilities', amount: 3500, date: '2026-04-10', description: 'Electricity Bill', paymentMethod: 'Cash' }
  ]);
  const [viewedInvoice, setViewedInvoice] = useState<Invoice | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Rent',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: 'Health Care Pharmacy',
    address: 'Shop #4, Medical Center, Block A, Karachi',
    phone: '+92 345 1234567',
    email: 'info@pharmcare.pk',
    gstin: 'GST-9988-77',
    tagline: 'Your health is our priority'
  });
  const [activeInvoice, setActiveInvoice] = useState<Partial<Invoice>>({
    id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    paymentStatus: 'Unpaid'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [printMode, setPrintMode] = useState<'A4' | 'Thermal'>('A4');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const lowStock = medicines.filter(m => m.stock < 50).length;
    const expiringSoon = medicines.filter(m => 
      m.batches.some(b => {
        const exp = new Date(b.expiryDate);
        const soon = new Date();
        soon.setMonth(soon.getMonth() + 3);
        return exp < soon;
      })
    ).length;

    return { totalSales, totalExpenses, lowStock, expiringSoon };
  }, [invoices, medicines, expenses]);

  const handleCreateInvoice = (item: Medicine, batch: Batch) => {
    const newItem: InvoiceItem = {
      medicineId: item.id,
      medicineName: item.name,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: 1,
      price: item.price,
      total: item.price
    };
    
    setActiveInvoice(prev => {
      const items = [...(prev.items || []), newItem];
      const subtotal = items.reduce((sum, i) => sum + i.total, 0);
      const tax = subtotal * 0.17; // 17% GST example
      return {
        ...prev,
        items,
        subtotal,
        tax,
        total: subtotal + tax - (prev.discount || 0)
      };
    });
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setActiveInvoice(prev => {
      if (!prev.items) return prev;
      const newItems = [...prev.items];
      const item = newItems[index];
      const newQty = Math.max(1, item.quantity + delta);
      
      newItems[index] = {
        ...item,
        quantity: newQty,
        total: newQty * item.price
      };
      
      const subtotal = newItems.reduce((sum, i) => sum + i.total, 0);
      const tax = subtotal * 0.17;
      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax - (prev.discount || 0)
      };
    });
  };

  const removeItemFromInvoice = (index: number) => {
    setActiveInvoice(prev => {
      if (!prev.items) return prev;
      const newItems = prev.items.filter((_, i) => i !== index);
      const subtotal = newItems.reduce((sum, i) => sum + i.total, 0);
      const tax = subtotal * 0.17;
      return {
        ...prev,
        items: newItems,
        subtotal,
        tax,
        total: subtotal + tax - (prev.discount || 0)
      };
    });
  };

  const handleDiscountChange = (val: number) => {
    setActiveInvoice(prev => {
      const subtotal = prev.subtotal || 0;
      const tax = prev.tax || 0;
      return {
        ...prev,
        discount: val,
        total: subtotal + tax - val
      };
    });
  };

  const handlePrint = (mode: 'A4' | 'Thermal') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  const handleFinalizeInvoice = (mode: 'A4' | 'Thermal') => {
    if (!activeInvoice.items?.length) return;
    
    const finalInvoice: Invoice = {
      ...(activeInvoice as Invoice),
      id: activeInvoice.id || `INV-${Date.now()}`,
      date: activeInvoice.date || new Date().toISOString(),
      customerName: activeInvoice.customerName || 'Walk-in Customer',
      paymentStatus: 'Paid'
    };
    
    setInvoices([finalInvoice, ...invoices]);
    
    // Reset with new ID for next invoice
    setActiveInvoice({
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paymentStatus: 'Unpaid'
    });
    
    handlePrint(mode);
  };

  // Barcode Handler
  useEffect(() => {
    const handleBarcodeScan = (e: KeyboardEvent) => {
      // Simple logic: if barcode scanner acts as keyboard input
      // Most scanners end with 'Enter' key
      if (e.key === 'Enter') {
        if (barcodeQuery) {
          const foundMedicine = medicines.find(m => m.barcode === barcodeQuery);
          if (foundMedicine && foundMedicine.batches.length > 0) {
            handleCreateInvoice(foundMedicine, foundMedicine.batches[0]);
          }
          setBarcodeQuery('');
        }
      } else {
        setBarcodeQuery(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleBarcodeScan);
    return () => window.removeEventListener('keydown', handleBarcodeScan);
  }, [barcodeQuery, medicines]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 font-medium tracking-wide text-sm uppercase">Health Care Pharmacy Overview</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold uppercase">Last Updated</p>
          <p className="font-mono text-sm">{new Date().toLocaleTimeString()}</p>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 glass-card p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-600/20">
          <p className="text-blue-100 font-medium mb-1">Total Sales (Today)</p>
          <p className="text-5xl font-black tracking-tighter">Rs. {stats.totalSales.toFixed(2)}</p>
        </div>
        
        <div className="glass-card p-6 border-amber-200 bg-amber-50">
          <p className="text-amber-700 font-medium text-sm mb-1">Low Stock</p>
          <p className="text-4xl font-black tracking-tighter text-amber-900">{stats.lowStock}</p>
        </div>

        <div className="glass-card p-6 border-rose-200 bg-rose-50">
          <p className="text-rose-700 font-medium text-sm mb-1">Expiring</p>
          <p className="text-4xl font-black tracking-tighter text-rose-900">{stats.expiringSoon}</p>
        </div>
        
        <div className="glass-card p-6 border-red-200 bg-red-50">
          <p className="text-red-700 font-medium text-sm mb-1">Expenses</p>
          <p className="text-4xl font-black tracking-tighter text-red-900">Rs. {stats.totalExpenses.toFixed(0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            Recent Transactions
          </h2>
          <div className="space-y-2">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div>
                  <p className="font-semibold text-sm">{inv.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{inv.id}</p>
                </div>
                <p className="font-black text-brand-secondary">Rs. {inv.total.toFixed(2)}</p>
              </div>
            ))}
            {invoices.length === 0 && <p className="text-slate-400 text-center py-8">No recent transactions</p>}
          </div>
        </div>
        
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600" />
            Stock Alerts
          </h2>
          <div className="space-y-2">
            {medicines.filter(m => m.stock < 20).map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                <p className="text-sm font-semibold text-rose-900">{m.name}</p>
                <button 
                  onClick={() => setCurrentView('inventory')}
                  className="px-3 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 uppercase"
                >
                  Order
                </button>
              </div>
            ))}
            {medicines.every(m => m.stock >= 20) && <p className="text-slate-400 text-center py-8">All stock levels healthy</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Inventory</h1>
          <p className="text-slate-500">Manage your medicine stock and batches.</p>
        </div>
        <button className="btn-primary">
          <Plus size={20} />
          Add Medicine
        </button>
      </header>

      <div className="glass-card p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search medicine name or generic..." 
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-bottom border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-600">Medicine</th>
              <th className="px-6 py-4 font-bold text-slate-600">Manufacturer</th>
              <th className="px-6 py-4 font-bold text-slate-600">Stock</th>
              <th className="px-6 py-4 font-bold text-slate-600">Price</th>
              <th className="px-6 py-4 font-bold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines
              .filter(m => 
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                m.genericName.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(m => {
                const isExpiringSoon = m.batches.some(b => {
                  const exp = new Date(b.expiryDate);
                  const soon = new Date();
                  soon.setDate(soon.getDate() + 30);
                  return exp < soon && exp > new Date();
                });
                return (
                  <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${isExpiringSoon ? 'bg-amber-50' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold">{m.name}</p>
                      {isExpiringSoon && <p className="text-[10px] font-bold text-amber-700 bg-amber-200 px-1 rounded inline-block">EXPIRING SOON</p>}
                      <p className="text-xs text-slate-400 italic">{m.genericName}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{m.manufacturer}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.stock < 50 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        {m.stock} {m.unit}s
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">Rs. {m.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => showInsights(m.name)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" 
                          title="AI Insights"
                        >
                          <Bot size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:bg-white rounded-lg">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Search & Select */}
      <div className="lg:col-span-2 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-800">New Invoice</h1>
          <p className="text-slate-500">Add medicines to generate bill.</p>
        </header>

        <div className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search name..." 
                className="input-field pl-10 text-lg py-3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative border-2 border-brand-primary rounded-xl overflow-hidden">
              <div className="bg-brand-primary text-white px-3 flex items-center h-full absolute left-0 top-0">
                <Package size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Scan Barcode..." 
                className="input-field pl-12 text-lg py-3 font-mono font-bold"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {searchQuery.length > 0 && medicines
              .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(m => (
                <div key={m.id} className="p-4 border border-slate-100 rounded-xl hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{m.name}</h3>
                      <p className="text-xs text-slate-400">{m.genericName}</p>
                    </div>
                    <p className="text-brand-primary font-bold">Rs. {m.price}</p>
                  </div>
                  <div className="space-y-2 mt-3">
                    {m.batches.map(b => (
                      <button 
                        key={b.id}
                        onClick={() => handleCreateInvoice(m, b)}
                        className="w-full flex justify-between text-xs p-2 bg-white border border-slate-100 rounded-lg hover:border-brand-primary group"
                      >
                        <span className="text-slate-500">Batch: <span className="text-slate-800 font-medium">{b.batchNumber}</span></span>
                        <span className="text-slate-500">Exp: <span className="text-slate-800 font-medium">{b.expiryDate}</span></span>
                        <span className="text-brand-secondary font-bold group-hover:scale-110 transition-transform">Add +</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bill Preview */}
      <div className="lg:col-span-1">
        <div className="glass-card sticky top-6 h-[calc(100vh-80px)] flex flex-col no-print">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText size={20} className="text-brand-primary" />
              Bill Items
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Invoice #</label>
                <input 
                  type="text" 
                  className="input-field py-1 text-sm font-mono"
                  value={activeInvoice.id || ''}
                  onChange={(e) => setActiveInvoice({...activeInvoice, id: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Invoice Date</label>
                <input 
                  type="date" 
                  className="input-field py-1 text-sm"
                  value={activeInvoice.date || ''}
                  onChange={(e) => setActiveInvoice({...activeInvoice, date: e.target.value})}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Notes / Warranty</label>
              <input 
                type="text" 
                placeholder="e.g. Terms of Warranty..." 
                className="input-field"
                value={activeInvoice.note || ''}
                onChange={(e) => setActiveInvoice({...activeInvoice, note: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Customer Name</label>
              <input 
                type="text" 
                placeholder="Walk-in Customer" 
                className="input-field"
                value={activeInvoice.customerName || ''}
                onChange={(e) => setActiveInvoice({...activeInvoice, customerName: e.target.value})}
              />
            </div>

            {activeInvoice.items?.map((item, idx) => (
              <div key={`${item.medicineId}-${idx}`} className="p-3 bg-slate-50 rounded-lg group relative">
                <div className="flex justify-between mb-1">
                  <p className="font-bold text-sm">{item.medicineName}</p>
                  <button 
                    onClick={() => removeItemFromInvoice(idx)}
                    className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center bg-white rounded border border-slate-200">
                    <button 
                      onClick={() => handleQuantityChange(idx, -1)}
                      className="px-2 py-1 hover:bg-slate-50"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(idx, 1)}
                      className="px-2 py-1 hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-sm">Rs. {item.total.toFixed(2)}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Batch: {item.batchNumber} | Exp: {item.expiryDate}</p>
              </div>
            ))}
            
            {activeInvoice.items?.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                <Package size={48} strokeWidth={1} />
                <p>No items added yet</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>Rs. {activeInvoice.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (17%)</span>
              <span>Rs. {activeInvoice.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 py-1">
              <span>Discount (Rs.)</span>
              <input 
                type="number" 
                className="w-24 px-2 py-1 rounded border border-slate-200 text-right text-brand-accent font-bold"
                value={activeInvoice.discount || 0}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between text-2xl font-black text-slate-800 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>Rs. {activeInvoice.total?.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => handlePrint('Thermal')}
              className="btn-secondary w-full justify-center mt-4 h-12 text-sm"
            >
              Print Thermal (80mm)
            </button>
            <button 
              onClick={() => handlePrint('A4')}
              className="btn-primary w-full justify-center mt-2 h-12 text-lg"
            >
              <Printer size={20} />
              Print A4
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - HIDDEN ON MOBILE, FIXED ON DESKTOP */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col no-print fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-brand-primary">
            <div className="p-2 bg-brand-primary rounded-xl text-white">
              <Pill size={24} />
            </div>
            <span className="font-black text-xl tracking-tighter">PharmaCare</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => setCurrentView('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'inventory' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package size={20} />
            <span className="font-medium">Inventory</span>
          </button>
          <button 
            onClick={() => setCurrentView('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'billing' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CreditCard size={20} />
            <span className="font-medium">Billing</span>
          </button>
          <button 
            onClick={() => setCurrentView('po')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'po' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText size={20} />
            <span className="font-medium">Purchase Orders</span>
          </button>
          <button 
            onClick={() => setCurrentView('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'history' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={20} />
            <span className="font-medium">Sales History</span>
          </button>
          <button 
            onClick={() => setCurrentView('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'customers' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={20} />
            <span className="font-medium">Customers</span>
          </button>
          <button 
            onClick={() => setCurrentView('expenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'expenses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CreditCard size={20} />
            <span className="font-medium">Expenses</span>
          </button>
          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Bot size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{businessProfile.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 no-print pt-24 md:pt-8 w-full max-w-[calc(100vw-256px)] overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'inventory' && renderInventory()}
            {currentView === 'billing' && renderBilling()}
            {currentView === 'history' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Sales History</h1>
                <div className="glass-card divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <div key={inv.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-lg">{inv.id}</p>
                          <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded uppercase">Paid</span>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2">
                          <User size={14} /> {inv.customerName} | <History size={14} /> {new Date(inv.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-800">Rs. {inv.total.toFixed(2)}</p>
                        <button 
                          onClick={() => setViewedInvoice(inv)}
                          className="text-brand-primary text-sm font-bold hover:underline"
                        >
                          View Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                      <FileText size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No sales history found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Customers View (Placeholder) */}
            {currentView === 'customers' && (
               <div className="space-y-6">
                 <h1 className="text-3xl font-bold">Customer Directory</h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CUSTOMERS.map(c => (
                      <div key={c.id} className="glass-card p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold">{c.name}</h3>
                            <p className="text-xs text-slate-400">{c.phone}</p>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 pt-4 flex justify-between">
                          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Purchases</span>
                          <span className="font-bold text-brand-secondary">Rs. {c.totalPurchases}</span>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {currentView === 'po' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">Purchase Orders</h1>
                    <p className="text-slate-500">Order stock from your suppliers.</p>
                  </div>
                  <button className="btn-primary">
                    <Plus size={20} />
                    New PO
                  </button>
                </header>

                <div className="glass-card divide-y divide-slate-100">
                  {purchaseOrders.map(po => (
                    <div key={po.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                          <Package size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-lg">{po.id}</p>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${po.status === 'Received' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              {po.status}
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm">{po.supplierName} • {new Date(po.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-800">Rs. {po.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">{po.items.length} Medicines</p>
                      </div>
                    </div>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                      <FileText size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No Purchase Orders yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'expenses' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">Expenses</h1>
                    <p className="text-slate-500">Track and categorize business costs.</p>
                  </div>
                  <button 
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="btn-primary"
                  >
                    <Plus size={20} />
                    Add Expense
                  </button>
                </header>

                <div className="glass-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-600">Date</th>
                        <th className="px-6 py-4 font-bold text-slate-600">Category</th>
                        <th className="px-6 py-4 font-bold text-slate-600">Description</th>
                        <th className="px-6 py-4 font-bold text-slate-600">Method</th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map(e => (
                        <tr key={e.id}>
                          <td className="px-6 py-4">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">{e.category}</td>
                          <td className="px-6 py-4">{e.description}</td>
                          <td className="px-6 py-4">{e.paymentMethod}</td>
                          <td className="px-6 py-4 text-right font-bold text-brand-accent">Rs. {e.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {expenses.length === 0 && <p className="p-12 text-center text-slate-400">No expenses recorded yet.</p>}
                </div>
              </div>
            )}

            {currentView === 'quotations' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">Quotations</h1>
                    <p className="text-slate-500">Manage customer price quotes.</p>
                  </div>
                  <button onClick={() => setIsQuotationModalOpen(true)} className="btn-primary">
                    <Plus size={20} />
                    New Quotation
                  </button>
                </header>
                
                <div className="glass-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-600">ID</th>
                        <th className="px-6 py-4 font-bold text-slate-600">Customer</th>
                        <th className="px-6 py-4 font-bold text-slate-600">Date</th>
                        <th className="px-6 py-4 font-bold text-slate-600">Total</th>
                        <th className="px-6 py-4 font-bold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotations.map(q => (
                        <tr key={q.id}>
                          <td className="px-6 py-4 font-bold">{q.id}</td>
                          <td className="px-6 py-4">{q.customerName}</td>
                          <td className="px-6 py-4">{q.date}</td>
                          <td className="px-6 py-4">Rs. {q.total.toFixed(2)}</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs font-bold">{q.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {quotations.length === 0 && <p className="p-12 text-center text-slate-400">No quotations yet.</p>}
                </div>
              </div>
            )}

            {/* Quotation Modal */}
            <AnimatePresence>
              {isQuotationModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4"
                  >
                    <h2 className="text-2xl font-black">New Quotation</h2>
                    <input type="text" placeholder="Customer Name" className="input-field" value={activeQuotation.customerName || ''} onChange={e => setActiveQuotation({...activeQuotation, customerName: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" className="input-field" value={activeQuotation.date} onChange={e => setActiveQuotation({...activeQuotation, date: e.target.value})} />
                      <input type="date" className="input-field" value={activeQuotation.validUntil} onChange={e => setActiveQuotation({...activeQuotation, validUntil: e.target.value})} />
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-4">
                      <p className="text-sm font-bold text-slate-500">Items</p>
                      <div className="grid grid-cols-4 gap-2">
                        <select className="col-span-2 input-field" onChange={(e) => {
                          const med = medicines.find(m => m.name === e.target.value);
                          if (med) {
                            const newItem = { medicineId: med.id, medicineName: med.name, batchNumber: med.batches[0]?.batchNumber || 'N/A', quantity: 1, price: med.price, total: med.price, expiryDate: med.batches[0]?.expiryDate || '' };
                            setActiveQuotation({...activeQuotation, items: [...(activeQuotation.items || []), newItem], subtotal: (activeQuotation.subtotal || 0) + newItem.total, total: (activeQuotation.total || 0) + newItem.total});
                          }
                        }}>
                          <option value="">Select Medicine</option>
                          {medicines.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <input type="number" placeholder="Qty" className="input-field" onChange={(e) => {
                          const qty = Number(e.target.value);
                          // Simplified update logic for demonstration
                          const items = activeQuotation.items || [];
                          if (items.length > 0) {
                              items[items.length - 1].quantity = qty;
                              items[items.length - 1].total = qty * items[items.length - 1].price;
                              setActiveQuotation({...activeQuotation, items: [...items], subtotal: items.reduce((acc, i) => acc + i.total, 0), total: items.reduce((acc, i) => acc + i.total, 0)});
                          }
                        }} />
                      </div>
                      <div className="space-y-2">
                        {(activeQuotation.items || []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1 border-b">
                            <span>{item.medicineName} x {item.quantity}</span>
                            <span>Rs. {item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-right font-black text-lg">Total: Rs. {(activeQuotation.total || 0).toFixed(2)}</p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 btn-secondary" onClick={() => setIsQuotationModalOpen(false)}>Cancel</button>
                      <button className="flex-1 btn-primary" onClick={() => {
                        setQuotations([{...activeQuotation, id: Date.now().toString(), items: []} as Quotation, ...quotations]);
                        setIsQuotationModalOpen(false);
                      }}>Save Quotation</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invoice Viewer Modal */}
            <AnimatePresence>
              {viewedInvoice && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 print:hidden"
                >
                  <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="bg-white rounded-2xl p-8 w-full max-w-lg space-y-4"
                  >
                    <div className="flex justify-between items-center border-b pb-4">
                      <h2 className="text-xl font-black">Invoice: {viewedInvoice.id}</h2>
                      <button onClick={() => setViewedInvoice(null)}><X /></button>
                    </div>
                    <div className="text-sm space-y-1 text-slate-600">
                      <p><strong>Customer:</strong> {viewedInvoice.customerName}</p>
                      <p><strong>Date:</strong> {new Date(viewedInvoice.date).toLocaleString()}</p>
                    </div>
                    <div className="border-t border-b py-4 space-y-2">
                       {viewedInvoice.items.map((item, i) => (
                         <div key={i} className="flex justify-between text-sm">
                           <span>{item.medicineName} x {item.quantity}</span>
                           <span>Rs. {item.total.toFixed(2)}</span>
                         </div>
                       ))}
                    </div>
                    <p className="text-right font-black text-2xl">Total: Rs. {viewedInvoice.total.toFixed(2)}</p>
                    
                    <button className="btn-primary w-full" onClick={() => {
                        // Logic to re-print this invoice
                        window.print();
                    }}>Print Invoice</button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invoice Viewer Modal */}
            <AnimatePresence>
              {viewedInvoice && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 print:hidden"
                >
                  <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="bg-white rounded-2xl p-8 w-full max-w-lg space-y-4"
                  >
                    <div className="flex justify-between items-center border-b pb-4">
                      <h2 className="text-xl font-black">Invoice: {viewedInvoice.id}</h2>
                      <button onClick={() => setViewedInvoice(null)}><X /></button>
                    </div>
                    <div className="text-sm space-y-1 text-slate-600">
                      <p><strong>Customer:</strong> {viewedInvoice.customerName}</p>
                      <p><strong>Date:</strong> {new Date(viewedInvoice.date).toLocaleString()}</p>
                    </div>
                    <div className="border-t border-b py-4 space-y-2">
                       {viewedInvoice.items.map((item, i) => (
                         <div key={i} className="flex justify-between text-sm">
                           <span>{item.medicineName} x {item.quantity}</span>
                           <span>Rs. {item.total.toFixed(2)}</span>
                         </div>
                       ))}
                    </div>
                    <p className="text-right font-black text-2xl">Total: Rs. {viewedInvoice.total.toFixed(2)}</p>
                    
                    <button className="btn-primary w-full" onClick={() => {
                        // Logic to re-print this invoice
                        window.print();
                    }}>Print Invoice</button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expense Modal */}
            <AnimatePresence>
              {isExpenseModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="bg-white rounded-2xl p-8 w-full max-w-md space-y-4"
                  >
                    <h2 className="text-2xl font-black">Add New Expense</h2>
                    <input type="date" className="input-field" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                    <select className="input-field" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                      <option>Rent</option><option>Utilities</option><option>Salary</option><option>Transport</option><option>Medicine Purchase</option>
                    </select>
                    <input type="number" placeholder="Amount (Rs.)" className="input-field" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                    <input type="text" placeholder="Description" className="input-field" value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                    <select className="input-field" value={newExpense.paymentMethod} onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value as 'Cash' | 'Bank'})}>
                      <option>Cash</option><option>Bank</option>
                    </select>
                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancel</button>
                      <button className="flex-1 btn-primary" onClick={() => {
                        setExpenses([{...newExpense, id: Date.now().toString()} as Expense, ...expenses]);
                        setIsExpenseModalOpen(false);
                      }}>Save</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {currentView === 'settings' && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <header>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">Business Settings</h1>
                  <p className="text-slate-500">Update your company details for invoices.</p>
                </header>

                <div className="glass-card p-10 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Company Name</label>
                      <input 
                        type="text" 
                        value={businessProfile.name}
                        onChange={(e) => setBusinessProfile({...businessProfile, name: e.target.value})}
                        className="input-field text-xl font-bold py-3"
                      />
                    </div>
                    <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Tagline (Optional)</label>
                      <input 
                        type="text" 
                        value={businessProfile.tagline}
                        onChange={(e) => setBusinessProfile({...businessProfile, tagline: e.target.value})}
                        placeholder="e.g. Fastest pharma delivery"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Full Address</label>
                      <textarea 
                        rows={3}
                        value={businessProfile.address}
                        onChange={(e) => setBusinessProfile({...businessProfile, address: e.target.value})}
                        className="input-field resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                        <input 
                          type="text" 
                          value={businessProfile.phone}
                          onChange={(e) => setBusinessProfile({...businessProfile, phone: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">GSTIN / Tax ID</label>
                        <input 
                          type="text" 
                          value={businessProfile.gstin}
                          onChange={(e) => setBusinessProfile({...businessProfile, gstin: e.target.value})}
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Support Email</label>
                      <input 
                        type="email" 
                        value={businessProfile.email}
                        onChange={(e) => setBusinessProfile({...businessProfile, email: e.target.value})}
                        className="input-field"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100">
                    <button className="btn-primary w-full justify-center text-lg h-12 shadow-xl shadow-blue-500/20">
                      Save All Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Print View */}
      <div className={`print-only p-12 bg-white text-black min-h-screen ${printMode === 'Thermal' ? 'thermal-mode' : ''}`}>
        <div className={`flex justify-between items-start ${printMode === 'Thermal' ? 'mb-4' : 'mb-12'}`}>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-blue-600 mb-1">{businessProfile.name}</h1>
            {businessProfile.tagline && <p className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">{businessProfile.tagline}</p>}
            <p className="text-gray-500 max-w-xs">{businessProfile.address}</p>
            <p className="text-gray-600 mt-1">Contact: {businessProfile.phone}</p>
            {businessProfile.gstin && <p className="text-gray-400 text-xs mt-1">GSTIN: {businessProfile.gstin}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-6xl font-black text-gray-100 mb-2">INVOICE</h2>
            <div className="space-y-1">
              <p className="text-gray-500 font-mono text-sm leading-tight">Invoice No: <span className="text-black font-bold">{activeInvoice.id}</span></p>
              <p className="text-gray-500 font-medium text-sm leading-tight">Date: <span className="text-black font-bold">{activeInvoice.date}</span></p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="font-bold border-b border-gray-200 pb-2 mb-2">BILLED TO:</p>
          <p className="text-xl">{activeInvoice.customerName || 'Walk-in Customer'}</p>
          {activeInvoice.customerPhone && <p className="text-gray-500">{activeInvoice.customerPhone}</p>}
        </div>

        <table className="w-full text-left mb-8">
          <thead className="border-b-2 border-black">
            <tr>
              <th className="py-3">Item Description</th>
              <th className="py-3 text-center">Batch</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Price</th>
              <th className="py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeInvoice.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-4">
                  <p className="font-bold">{item.medicineName}</p>
                  <p className="text-xs text-gray-400">Exp: {item.expiryDate}</p>
                </td>
                <td className="py-4 text-center text-sm">{item.batchNumber}</td>
                <td className="py-4 text-center font-bold">{item.quantity}</td>
                <td className="py-4 text-right">Rs. {item.price.toFixed(2)}</td>
                <td className="py-4 text-right font-bold">Rs. {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {activeInvoice.note && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="font-bold text-sm mb-1 uppercase tracking-wider text-gray-500">Warranty / Notes:</p>
            <p className="text-sm">{activeInvoice.note}</p>
          </div>
        )}

        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>Rs. {activeInvoice.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 border-b border-gray-200 pb-2">
              <span>Tax (GST 17%)</span>
              <span>Rs. {activeInvoice.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black">
              <span>Total</span>
              <span>Rs. {activeInvoice.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-gray-200 text-center text-gray-400 text-sm">
          <p className="font-bold mb-1">Thank you for your business!</p>
          <p>Please note: Medicines once sold are not returnable/exchangeable without original receipt.</p>
        </div>
      </div>

      {/* AI Modal */}
      <AnimatePresence>
        {aiInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Bot />
                  Pharma Insight Assistant
                </h3>
                <button onClick={() => setAiInsight(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X />
                </button>
              </div>
              <div className="p-8 prose prose-slate max-w-none max-h-[60vh] overflow-y-auto">
                <div className="whitespace-pre-wrap leading-relaxed text-slate-600">
                  {aiInsight}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setAiInsight(null)}
                  className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close Insights
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading AI State */}
      <AnimatePresence>
        {isAiLoading && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/80 backdrop-blur-lg no-print">
            <div className="bg-white p-8 rounded-full shadow-xl mb-4">
              <Loader2 className="animate-spin text-brand-primary" size={48} />
            </div>
            <p className="text-brand-primary font-black animate-pulse uppercase tracking-[0.2em]">Consulting Pharma database...</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

