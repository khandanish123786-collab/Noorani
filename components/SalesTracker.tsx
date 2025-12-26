
import React, { useState, useMemo } from 'react';
import { Sale, Batch, PaymentStatus, Customer, PaymentRecord } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import InvoiceModal from './InvoiceModal';

interface SalesTrackerProps {
  sales: Sale[];
  batches: Batch[];
  customers: Customer[];
  payments: PaymentRecord[];
  onSaveSale: (sale: Sale, customer: Customer) => void;
  onDeleteSale: (id: string) => void;
  onViewLedger: (customerId: string) => void;
}

const SalesTracker: React.FC<SalesTrackerProps> = ({ sales, batches, customers, payments, onSaveSale, onDeleteSale, onViewLedger }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  // Date Range Filter State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batchId: '',
    customerName: '',
    birdsSold: '',
    totalWeight: '',
    ratePerKg: '',
    paidAmount: '',
  });

  const totalSaleAmount = (parseFloat(formData.totalWeight) || 0) * (parseFloat(formData.ratePerKg) || 0);
  const initialPaid = parseFloat(formData.paidAmount) || 0;

  const matchedCustomer = useMemo(() => {
    const search = formData.customerName.trim().toLowerCase();
    if (!search) return null;
    return customers.find(c => c.name.trim().toLowerCase() === search);
  }, [formData.customerName, customers]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const date = sale.date;
      if (filterStartDate && date < filterStartDate) return false;
      if (filterEndDate && date > filterEndDate) return false;
      return true;
    });
  }, [sales, filterStartDate, filterEndDate]);

  const salesWithCalculatedBalances = useMemo(() => {
    const results: Record<string, { id: string; balance: number; status: PaymentStatus }[]> = {};
    
    customers.forEach(cust => {
      // We calculate balances based on ALL sales to maintain ledger accuracy
      const custSales = sales
        .filter(s => s.customerId === cust.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const custPayments = payments.filter(p => p.customerId === cust.id);
      let totalPool = custPayments.reduce((sum, p) => sum + p.amount, 0);

      const calculated = custSales.map(sale => {
        const amountForThisSale = Math.min(sale.totalSaleAmount, totalPool);
        totalPool -= amountForThisSale;
        
        const balance = Math.max(0, sale.totalSaleAmount - amountForThisSale);
        let status: PaymentStatus = 'UNPAID';
        if (balance <= 0) status = 'PAID';
        else if (amountForThisSale > 0) status = 'PARTIALLY PAID';

        return { id: sale.id, balance, status };
      });
      
      custSales.forEach((s, idx) => {
        results[s.id] = [calculated[idx]];
      });
    });

    return results;
  }, [sales, payments, customers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchId) return alert('Please select a batch');
    if (!formData.customerName.trim()) return alert('Enter customer name');

    const customer: Customer = matchedCustomer || {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: formData.customerName.trim()
    };

    const existingSale = editingId ? sales.find(s => s.id === editingId) : null;

    onSaveSale({
      id: editingId || Date.now().toString(),
      invoiceNo: existingSale?.invoiceNo || '', 
      date: formData.date,
      batchId: formData.batchId,
      customerId: customer.id,
      customerName: customer.name,
      birdsSold: Number(formData.birdsSold),
      totalWeight: Number(formData.totalWeight),
      ratePerKg: Number(formData.ratePerKg),
      totalSaleAmount: totalSaleAmount,
      paidAmount: initialPaid,
      balanceDue: totalSaleAmount - initialPaid,
      paymentStatus: (totalSaleAmount - initialPaid) <= 0 ? 'PAID' : (initialPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID')
    }, customer);

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      batchId: '',
      customerName: '',
      birdsSold: '',
      totalWeight: '',
      ratePerKg: '',
      paidAmount: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setFormData({
      date: sale.date,
      batchId: sale.batchId,
      customerName: sale.customerName,
      birdsSold: sale.birdsSold.toString(),
      totalWeight: sale.totalWeight.toString(),
      ratePerKg: sale.ratePerKg.toString(),
      paidAmount: (sale.paidAmount || 0).toString(),
    });
    setShowForm(true);
  };

  // Totals for the filtered view
  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.totalSaleAmount, 0);
  const totalBalance = filteredSales.reduce((s, sale) => {
    const calc = salesWithCalculatedBalances[sale.id]?.[0];
    return s + (calc ? calc.balance : 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-black">Sales & Revenue</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform"
        >
          <i className="fas fa-plus mr-1"></i> New Sale
        </button>
      </div>

      {/* Date Range Filter UI */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Date</span>
          {(filterStartDate || filterEndDate) && (
            <button 
              onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
              className="text-[10px] font-black text-red-500 uppercase"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase pointer-events-none">From</span>
            <input 
              type="date" 
              value={filterStartDate} 
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full pl-10 pr-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-black" 
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase pointer-events-none">To</span>
            <input 
              type="date" 
              value={filterEndDate} 
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full pl-10 pr-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-black" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-bold text-black uppercase block">Filtered Revenue</span>
          <span className="text-lg font-black text-blue-600">{CURRENCY_SYMBOL}{totalRevenue.toLocaleString('en-IN')}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-black uppercase block">Filtered Owed</span>
          <span className="text-lg font-black text-orange-600">{CURRENCY_SYMBOL}{totalBalance.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="relative">
                <label className="block text-xs font-bold text-black uppercase mb-1">Customer Name</label>
                <input 
                  required 
                  type="text" 
                  list="customer-list-sales"
                  value={formData.customerName} 
                  onChange={e => setFormData({...formData, customerName: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" 
                  placeholder="e.g. Salim / Local Dealer" 
                />
                <datalist id="customer-list-sales">
                  {customers.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
                {matchedCustomer && (
                  <div className="mt-1 text-[10px] font-bold text-green-600">
                    <i className="fas fa-link mr-1"></i> Linking to existing ledger account
                  </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Batch</label>
                <select required value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black">
                  <option value="">Select Batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Birds</label>
                <input required type="number" value={formData.birdsSold} onChange={e => setFormData({...formData, birdsSold: e.target.value})} placeholder="0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Wt (kg)</label>
                <input required type="number" step="0.1" value={formData.totalWeight} onChange={e => setFormData({...formData, totalWeight: e.target.value})} placeholder="0.0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Rate (₹)</label>
                <input required type="number" value={formData.ratePerKg} onChange={e => setFormData({...formData, ratePerKg: e.target.value})} placeholder="0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl flex justify-between items-center border border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase">Total Bill</span>
                <span className="text-lg font-black text-blue-800">{CURRENCY_SYMBOL}{totalSaleAmount.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-black uppercase">Initial Paid Amount (₹)</label>
                <button type="button" onClick={() => setFormData({...formData, paidAmount: totalSaleAmount.toString()})} className="text-[10px] font-bold text-blue-600 uppercase underline">Paid in Full</button>
              </div>
                <input required type="number" step="0.01" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value})} placeholder="₹ 0.00" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
            </div>

            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">
              {editingId ? 'Update Sale' : 'Complete Sale'}
            </button>
            <button type="button" onClick={resetForm} className="w-full py-2 text-black font-bold">Cancel</button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic text-sm">No sales found for this period.</div>
        ) : (
          filteredSales.slice().reverse().map(sale => {
            const batch = batches.find(b => b.id === sale.batchId);
            const calcData = salesWithCalculatedBalances[sale.id]?.[0];
            const currentSaleBalance = calcData?.balance ?? sale.balanceDue;
            const status = calcData?.status ?? sale.paymentStatus;
            
            return (
              <div key={sale.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black text-base">{sale.customerName}</span>
                      <button 
                        onClick={() => onViewLedger(sale.customerId)}
                        className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black hover:bg-blue-100 hover:text-blue-600"
                      >
                        LEDGER <i className="fas fa-external-link-alt text-[7px]"></i>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{batch?.name || 'Batch'} • {sale.invoiceNo}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-green-600">+{CURRENCY_SYMBOL}{sale.totalSaleAmount.toLocaleString('en-IN')}</div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block">Sale Balance</span>
                    <span className={`text-xs font-black ${currentSaleBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {CURRENCY_SYMBOL}{currentSaleBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase block">Details</span>
                    <div className="text-[10px] font-bold text-black">
                      {sale.birdsSold} Birds • {sale.totalWeight}kg
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button 
                      onClick={() => setSelectedInvoice(sale)}
                      className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                      <i className="fas fa-file-invoice"></i> View Invoice
                  </button>
                  <div className="flex gap-4">
                      <button onClick={() => handleEdit(sale)} className="text-slate-400 hover:text-blue-600 text-sm"><i className="fas fa-edit"></i></button>
                      <button onClick={() => onDeleteSale(sale.id)} className="text-slate-400 hover:text-red-600 text-sm"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedInvoice && (
        <InvoiceModal 
          sale={selectedInvoice}
          batch={batches.find(b => b.id === selectedInvoice.batchId)}
          payments={payments.filter(p => p.saleId === selectedInvoice.id || (p.customerId === selectedInvoice.customerId && p.notes?.includes(selectedInvoice.id)))}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default SalesTracker;
