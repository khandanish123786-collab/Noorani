
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Sale, PaymentRecord, Batch } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import InvoiceModal from './InvoiceModal';

interface CustomerLedgerProps {
  customers: Customer[];
  sales: Sale[];
  payments: PaymentRecord[];
  batches: Batch[];
  initialCustomerId: string | null;
  onSavePayment: (payment: PaymentRecord) => void;
  onDeletePayment: (id: string) => void;
  onClearTarget: () => void;
}

const CustomerLedger: React.FC<CustomerLedgerProps> = ({ 
  customers, 
  sales, 
  payments, 
  batches,
  initialCustomerId, 
  onSavePayment, 
  onDeletePayment,
  onClearTarget
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [paymentData, setPaymentData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: ''
  });

  // Handle jumps from other tabs
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
      onClearTarget();
    }
  }, [initialCustomerId, onClearTarget]);

  // FIFO Calculation for individual sale balances within the selected customer's ledger
  const saleBalances = useMemo(() => {
    if (!selectedCustomerId) return {};
    
    const custSales = sales
      .filter(s => s.customerId === selectedCustomerId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const custPayments = payments.filter(p => p.customerId === selectedCustomerId);
    let totalPool = custPayments.reduce((sum, p) => sum + p.amount, 0);

    const balances: Record<string, { balance: number; status: string }> = {};
    
    custSales.forEach(sale => {
      const amountAllocated = Math.min(sale.totalSaleAmount, totalPool);
      totalPool -= amountAllocated;
      
      const balance = Math.max(0, sale.totalSaleAmount - amountAllocated);
      let status = 'UNPAID';
      if (balance <= 0) status = 'PAID';
      else if (amountAllocated > 0) status = 'PARTIALLY PAID';
      
      balances[sale.id] = { balance, status };
    });
    
    return balances;
  }, [selectedCustomerId, sales, payments]);

  const customerData = customers.map(customer => {
    const customerSales = sales.filter(s => s.customerId === customer.id);
    const customerPayments = payments.filter(p => p.customerId === customer.id);
    
    const totalPurchased = customerSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, totalPurchased - totalPaid);
    
    return {
      ...customer,
      totalPurchased,
      totalPaid,
      balance,
      sales: customerSales,
      payments: customerPayments
    };
  }).sort((a, b) => b.balance - a.balance);

  const selectedCustomer = customerData.find(c => c.id === selectedCustomerId);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');

    onSavePayment({
      id: `pay-man-${Date.now()}`,
      customerId: selectedCustomerId,
      date: paymentData.date,
      amount: amount,
      notes: paymentData.notes || 'Ledger payment'
    });

    setPaymentData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      notes: ''
    });
    setShowPaymentForm(false);
  };

  const history = selectedCustomer 
    ? [
        ...selectedCustomer.sales.map(s => ({ ...s, entryType: 'SALE' as const, dateValue: new Date(s.date).getTime() })),
        ...selectedCustomer.payments.map(p => ({ ...p, entryType: 'PAYMENT' as const, dateValue: new Date(p.date).getTime() }))
      ].sort((a, b) => b.dateValue - a.dateValue || b.id.localeCompare(a.id))
    : [];

  if (selectedCustomerId && selectedCustomer) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedCustomerId(null)} 
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-black shadow-sm"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-black leading-none">{selectedCustomer.name}</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Full Account Statement</span>
          </div>
          <button 
            onClick={() => setShowPaymentForm(true)}
            className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform"
          >
            <i className="fas fa-plus mr-1"></i> Receive Pay
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold text-black uppercase block opacity-60">Balance Owed</span>
            <span className={`text-xl font-black ${selectedCustomer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {CURRENCY_SYMBOL}{selectedCustomer.balance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right border-l pl-4 border-slate-100">
             <span className="text-[10px] font-bold text-black uppercase block opacity-60">Total Paid</span>
             <span className="text-sm font-bold text-blue-600">{CURRENCY_SYMBOL}{selectedCustomer.totalPaid.toLocaleString('en-IN')}</span>
             <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Purchased: {CURRENCY_SYMBOL}{selectedCustomer.totalPurchased.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {showPaymentForm && (
          <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-green-500 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-black uppercase text-xs">Record New Payment</h3>
              <button onClick={() => setShowPaymentForm(false)} className="text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">Date</label>
                  <input required type="date" value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">Amount (₹)</label>
                  <input required type="number" step="0.01" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} placeholder="₹ 0.00" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-black uppercase mb-1">Notes / Payment Mode</label>
                <input type="text" value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} placeholder="e.g. Cash / Bank / GPAY" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
              </div>
              <button type="submit" className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">
                Save Payment Entry
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 border-b pb-1">Activity Log</h3>
          {history.length === 0 ? (
            <p className="text-center py-10 text-slate-400 italic text-sm">No transaction history found.</p>
          ) : (
            history.map((entry, idx) => {
              const isSale = entry.entryType === 'SALE';
              const saleInfo = isSale ? saleBalances[entry.id] : null;
              
              return (
                <div key={entry.id} className={`p-4 rounded-2xl shadow-sm border flex flex-col gap-1 ${isSale ? 'bg-white border-slate-100' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <div className="font-bold text-black flex items-center gap-2">
                        {isSale ? (
                          <><i className="fas fa-file-invoice text-slate-300 text-xs"></i> Bill #{(entry as Sale).invoiceNo.slice(-6)}</>
                        ) : (
                          <><i className="fas fa-check-circle text-green-500 text-xs"></i> Payment Received</>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black ${isSale ? 'text-black' : 'text-green-700'}`}>
                        {isSale ? '-' : '+'}{CURRENCY_SYMBOL}{(entry as any).amount ? (entry as any).amount.toLocaleString('en-IN') : (entry as Sale).totalSaleAmount.toLocaleString('en-IN')}
                      </div>
                      {!isSale && (
                         <button onClick={() => onDeletePayment(entry.id)} className="text-[10px] text-red-400 font-bold uppercase mt-1">Delete</button>
                      )}
                      {isSale && (
                         <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-black ${saleInfo?.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                           {saleInfo?.status}
                         </span>
                      )}
                    </div>
                  </div>
                  
                  {isSale && (
                     <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                        <div className="text-[10px] font-bold text-slate-400">
                           {(entry as Sale).birdsSold} Birds • {(entry as Sale).totalWeight}kg
                        </div>
                        <button 
                          onClick={() => setSelectedInvoice(entry as Sale)}
                          className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                        >
                          <i className="fas fa-eye"></i> Invoice
                        </button>
                     </div>
                  )}

                  {entry.notes && !isSale && (
                    <div className="text-[10px] text-slate-600 font-medium mt-1 bg-white/50 p-1 rounded">Note: {entry.notes}</div>
                  )}
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
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-black">Customer Accounts</h2>
      
      <div className="space-y-3">
        {customerData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <i className="fas fa-user-friends text-5xl text-slate-100 mb-4"></i>
            <p className="text-slate-400 text-sm font-bold">No customers yet.<br/>Sales will automatically create ledgers.</p>
          </div>
        ) : (
          customerData.map(customer => (
            <button 
              key={customer.id}
              onClick={() => setSelectedCustomerId(customer.id)}
              className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <div className="font-black text-black text-base">{customer.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">{customer.sales.length + customer.payments.length} total entries</div>
              </div>
              <div className="text-right">
                <div className={`font-black text-lg ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {customer.balance > 0 ? `${CURRENCY_SYMBOL}${customer.balance.toLocaleString('en-IN')}` : 'PAID'}
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Net Balance</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerLedger;
