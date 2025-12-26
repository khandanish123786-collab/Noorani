
import React, { useState, useMemo } from 'react';
import { Expense, Batch, ExpenseType, ExpensePayment } from '../types';
import { EXPENSE_TYPES, CURRENCY_SYMBOL } from '../constants';

interface ExpenseTrackerProps {
  expenses: Expense[];
  expensePayments: ExpensePayment[];
  batches: Batch[];
  onSaveExpense: (expense: Expense, initialPaidAmount: number) => void;
  onDeleteExpense: (id: string) => void;
  onSaveExpensePayment: (payment: ExpensePayment) => void;
  onDeleteExpensePayment: (id: string) => void;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ 
  expenses, 
  expensePayments, 
  batches, 
  onSaveExpense, 
  onDeleteExpense,
  onSaveExpensePayment,
  onDeleteExpensePayment
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPaymentFormId, setShowPaymentFormId] = useState<string | null>(null);
  
  // Date Range Filter State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batchId: '',
    type: 'Feed' as ExpenseType,
    amount: '',
    paidAmount: '',
    notes: ''
  });

  const [payFormData, setPayFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: ''
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const date = exp.date;
      if (filterStartDate && date < filterStartDate) return false;
      if (filterEndDate && date > filterEndDate) return false;
      return true;
    });
  }, [expenses, filterStartDate, filterEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchId) return alert('Please select a batch');
    const billAmount = parseFloat(formData.amount) || 0;
    const initialPaid = parseFloat(formData.paidAmount) || 0;

    onSaveExpense({
      id: editingId || Date.now().toString(),
      date: formData.date,
      batchId: formData.batchId,
      type: formData.type,
      amount: billAmount,
      notes: formData.notes
    }, editingId ? 0 : initialPaid);

    resetForm();
  };

  const handlePaySubmit = (expenseId: string) => {
    const amt = parseFloat(payFormData.amount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid amount');

    onSaveExpensePayment({
      id: `pay-${Date.now()}`,
      expenseId,
      date: payFormData.date,
      amount: amt,
      notes: payFormData.notes
    });

    setPayFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      notes: ''
    });
    setShowPaymentFormId(null);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      batchId: '',
      type: 'Feed',
      amount: '',
      paidAmount: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setFormData({
      date: exp.date,
      batchId: exp.batchId,
      type: exp.type,
      amount: exp.amount.toString(),
      paidAmount: '0', 
      notes: exp.notes || ''
    });
    setShowForm(true);
  };

  // Summary totals based on filtered view
  const totalExpenseAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPaidAll = filteredExpenses.reduce((s, exp) => {
    const payments = expensePayments.filter(p => p.expenseId === exp.id);
    return s + payments.reduce((ps, p) => ps + p.amount, 0);
  }, 0);
  const totalBalanceAll = Math.max(0, totalExpenseAmount - totalPaidAll);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-black">Expenses</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform"
        >
          <i className="fas fa-plus mr-1"></i> New Bill
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
          <span className="text-[10px] font-bold text-black uppercase block">Filtered Bills</span>
          <span className="text-lg font-black text-red-600">{CURRENCY_SYMBOL}{totalExpenseAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-black uppercase block">Filtered Balance</span>
          <span className="text-lg font-black text-orange-600">{CURRENCY_SYMBOL}{totalBalanceAll.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Type</label>
                <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ExpenseType})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black">
                  {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Bill Amount (₹)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
              </div>
            </div>
            {!editingId && (
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Initial Paid (₹)</label>
                <input type="number" step="0.01" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value})} placeholder="₹ 0.00" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1">Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" placeholder="Supplier, Bill No, etc." />
            </div>
            <button type="submit" className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">
              {editingId ? 'Update Bill' : 'Save Bill'}
            </button>
            <button type="button" onClick={resetForm} className="w-full py-2 text-black font-bold">Cancel</button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic text-sm">No expenses found for this period.</div>
        ) : (
          filteredExpenses.slice().reverse().map(exp => {
            const batch = batches.find(b => b.id === exp.batchId);
            const payments = expensePayments.filter(p => p.expenseId === exp.id);
            const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
            const balanceDue = Math.max(0, exp.amount - paidTotal);
            const status = balanceDue <= 0 ? 'PAID' : (paidTotal > 0 ? 'PARTIALLY PAID' : 'UNPAID');

            return (
              <div key={exp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${exp.type === 'Chicks' ? 'bg-orange-100 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                    <i className={exp.type === 'Feed' ? 'fas fa-bowl-food' : exp.type === 'Medicine' ? 'fas fa-pills' : exp.type === 'Chicks' ? 'fas fa-dove' : 'fas fa-receipt'}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-black text-black text-lg truncate">{exp.type}</span>
                      <span className="font-black text-red-600 text-lg">{CURRENCY_SYMBOL}{exp.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{batch?.name || 'Batch'} • {new Date(exp.date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase block">Total Paid</span>
                    <span className="text-xs font-black text-green-600">{CURRENCY_SYMBOL}{paidTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase block">Balance Due</span>
                    <span className={`text-xs font-black ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>{CURRENCY_SYMBOL}{balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {status}
                    </span>
                  </div>
                </div>

                {payments.length > 0 && (
                  <div className="space-y-1 mt-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Payment History</span>
                    {payments.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-[10px] bg-slate-50/50 p-2 rounded-lg">
                        <span className="text-slate-500 font-bold">{new Date(p.date).toLocaleDateString()}</span>
                        <div className="flex gap-3 items-center">
                          <span className="font-black text-slate-700">{CURRENCY_SYMBOL}{p.amount}</span>
                          <button onClick={() => onDeleteExpensePayment(p.id)} className="text-slate-300 hover:text-red-500"><i className="fas fa-times"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showPaymentFormId === exp.id ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={payFormData.date} onChange={e => setPayFormData({...payFormData, date: e.target.value})} className="p-2 rounded-lg border border-slate-200 bg-white text-[11px] text-black font-bold" />
                        <input type="number" placeholder="Amt" value={payFormData.amount} onChange={e => setPayFormData({...payFormData, amount: e.target.value})} className="p-2 rounded-lg border border-slate-200 bg-white text-[11px] text-black font-bold" />
                    </div>
                    <input type="text" placeholder="Note (e.g. UPI)" value={payFormData.notes} onChange={e => setPayFormData({...payFormData, notes: e.target.value})} className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] text-black font-bold" />
                    <div className="flex gap-2">
                        <button onClick={() => handlePaySubmit(exp.id)} className="flex-1 py-2 bg-green-600 text-white font-black rounded-lg text-xs">Save Pay</button>
                        <button onClick={() => setShowPaymentFormId(null)} className="flex-1 py-2 bg-slate-200 text-slate-600 font-black rounded-lg text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-2">
                    <button 
                      disabled={status === 'PAID'}
                      onClick={() => setShowPaymentFormId(exp.id)} 
                      className={`text-[10px] font-black uppercase flex items-center gap-1 py-2 px-4 rounded-xl shadow-sm ${status === 'PAID' ? 'bg-slate-100 text-slate-300' : 'bg-green-600 text-white active:scale-95'}`}
                    >
                      <i className="fas fa-hand-holding-dollar"></i> Add Payment
                    </button>
                    <div className="flex gap-4">
                      <button onClick={() => handleEdit(exp)} className="text-slate-400 hover:text-blue-600 text-sm"><i className="fas fa-edit"></i></button>
                      <button onClick={() => onDeleteExpense(exp.id)} className="text-slate-400 hover:text-red-600 text-sm"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                )}
                {exp.notes && <div className="text-[10px] text-slate-500 italic mt-1 font-medium">Note: {exp.notes}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;
