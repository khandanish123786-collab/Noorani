
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  enableMultiTabIndexedDbPersistence,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { Batch, Expense, Sale, Mortality, Customer, PaymentRecord, ExpensePayment } from '../types';

// IMPORTANT: Replace these with your real keys from Firebase Console
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_KEY",
  authDomain: "poultry-app.firebaseapp.com",
  projectId: "poultry-app", 
  storageBucket: "poultry-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const STORAGE_KEY = 'noorani_poultry_local_v2';
let db: any = null;
let useFirebase = false;

try {
  if (firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useFirebase = true;
    enableMultiTabIndexedDbPersistence(db).catch(() => {});
  }
} catch (e) {}

interface FarmData {
  batches: Batch[];
  expenses: Expense[];
  expensePayments: ExpensePayment[];
  sales: Sale[];
  mortality: Mortality[];
  customers: Customer[];
  payments: PaymentRecord[];
}

let cachedData: FarmData = {
  batches: [], expenses: [], expensePayments: [], sales: [], mortality: [], customers: [], payments: []
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach(l => l());

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  try {
    cachedData = JSON.parse(saved);
  } catch (e) {}
}

if (useFirebase && db) {
  const collections = ['batches', 'expenses', 'expensePayments', 'sales', 'mortality', 'customers', 'payments'];
  collections.forEach(colName => {
    onSnapshot(collection(db, colName), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ ...doc.data(), id: doc.id }));
      (cachedData as any)[colName] = items;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
      notify();
    }, (error) => {
      if (error.code === 'permission-denied') useFirebase = false;
    });
  });
}

// Helper to escape CSV values
const csvEscape = (val: any) => {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

export const storageService = {
  subscribe: (callback: Listener) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getData: <K extends keyof FarmData>(key: K): FarmData[K] => {
    return cachedData[key] || [];
  },

  saveItem: async <K extends keyof FarmData>(key: K, item: any) => {
    const data = { ...cachedData };
    const collection_arr = data[key] as any[];
    const idx = collection_arr.findIndex((i: any) => i.id === item.id);
    if (idx > -1) collection_arr[idx] = item;
    else collection_arr.push(item);
    cachedData = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
    notify();
    if (useFirebase && db) try { await setDoc(doc(db, key, item.id), item, { merge: true }); } catch (e) {}
  },

  deleteItem: async <K extends keyof FarmData>(key: K, id: string) => {
    const data = { ...cachedData };
    (data[key] as any[]) = (data[key] as any[]).filter((i: any) => i.id !== id);
    cachedData = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
    notify();
    if (useFirebase && db) try { await deleteDoc(doc(db, key, id)); } catch (e) {}
  },

  deleteBatch: async (batchId: string) => {
    const data = { ...cachedData };
    data.batches = data.batches.filter(b => b.id !== batchId);
    data.expenses = data.expenses.filter(e => e.batchId !== batchId);
    data.sales = data.sales.filter(s => s.batchId !== batchId);
    data.mortality = data.mortality.filter(m => m.batchId !== batchId);
    cachedData = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
    notify();
  },

  exportCSV: () => {
    const headers = ['RecordType', 'ID', 'BatchID', 'Date', 'Name_Type', 'Qty_Birds', 'Weight_Rate', 'TotalAmount', 'Paid', 'Notes_Supplier'];
    const rows: string[][] = [headers];

    // Add Batches
    cachedData.batches.forEach(b => {
      rows.push(['BATCH', b.id, '', b.startDate, b.name, b.numChicks.toString(), b.chickRate.toString(), b.totalChickCost.toString(), '0', b.supplier || '']);
    });
    // Add Expenses
    cachedData.expenses.forEach(e => {
      rows.push(['EXPENSE', e.id, e.batchId, e.date, e.type, '0', '0', e.amount.toString(), '0', e.notes || '']);
    });
    // Add Sales
    cachedData.sales.forEach(s => {
      rows.push(['SALE', s.id, s.batchId, s.date, s.customerName, s.birdsSold.toString(), s.ratePerKg.toString(), s.totalSaleAmount.toString(), s.paidAmount.toString(), s.invoiceNo]);
    });
    // Add Mortality
    cachedData.mortality.forEach(m => {
      rows.push(['MORTALITY', m.id, m.batchId, m.date, 'DEATH', m.count.toString(), '0', '0', '0', m.reason || '']);
    });

    const csvContent = rows.map(r => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poultry_universal_backup_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importCSV: async (csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/);
      if (lines.length < 2) return false;
      
      const newData: FarmData = { ...cachedData };
      const rows = lines.slice(1).map(line => {
        // Simple CSV parser for quoted values
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"')) : [];
      });

      rows.forEach(row => {
        if (row.length < 5) return;
        const [type, id, batchId, date, name, qty, rate, total, paid, notes] = row;

        if (type === 'BATCH') {
          const batch: Batch = { id, name, startDate: date, expectedEndDate: date, numChicks: Number(qty), chickRate: Number(rate), totalChickCost: Number(total), supplier: notes, isActive: true };
          if (!newData.batches.find(b => b.id === id)) newData.batches.push(batch);
        } else if (type === 'EXPENSE') {
          const expense: Expense = { id, batchId, date, type: name as any, amount: Number(total), notes };
          if (!newData.expenses.find(e => e.id === id)) newData.expenses.push(expense);
        } else if (type === 'SALE') {
          const sale: Sale = { id, invoiceNo: notes, batchId, customerId: 'imported', customerName: name, date, birdsSold: Number(qty), totalWeight: 0, ratePerKg: Number(rate), totalSaleAmount: Number(total), paidAmount: Number(paid), balanceDue: Number(total) - Number(paid), paymentStatus: 'UNPAID' };
          if (!newData.sales.find(s => s.id === id)) newData.sales.push(sale);
        } else if (type === 'MORTALITY') {
          const mortality: Mortality = { id, batchId, date, count: Number(qty), reason: notes };
          if (!newData.mortality.find(m => m.id === id)) newData.mortality.push(mortality);
        }
      });

      cachedData = newData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
      notify();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  exportData: async () => {
    const dataStr = JSON.stringify(cachedData, null, 2);
    const fileName = `poultry-backup-${new Date().toISOString().split('T')[0]}.json`;
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'JSON Backup', accept: { 'application/json': ['.json'] } }] });
        const writable = await handle.createWritable();
        await writable.write(dataStr);
        await writable.close();
        return true;
      } catch (err) {}
    }
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    return true;
  },

  shareData: async () => {
    const data = JSON.stringify(cachedData, null, 2);
    if (!navigator.share) return alert("Sharing not supported.");
    try {
      const file = new File([data], 'poultry-backup.json', { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Poultry Backup' });
      } else {
        await navigator.share({ title: 'Noorani Backup', text: data });
      }
    } catch (err) {}
  },

  importData: async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString) as FarmData;
      if (data.batches) {
        cachedData = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
        notify();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
};

export const COLLECTIONS = {
  BATCHES: 'batches' as const,
  EXPENSES: 'expenses' as const,
  EXPENSE_PAYMENTS: 'expensePayments' as const,
  SALES: 'sales' as const,
  MORTALITY: 'mortality' as const,
  CUSTOMERS: 'customers' as const,
  PAYMENTS: 'payments' as const,
};
