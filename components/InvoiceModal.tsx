
import React from 'react';
import { Sale, Batch, PaymentRecord } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface InvoiceModalProps {
  sale: Sale;
  batch?: Batch;
  payments: PaymentRecord[];
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, batch, payments, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, sale.totalSaleAmount - amountPaid);

  const handleShareInvoice = async () => {
    const text = `
*NOORANI POULTRY FARM*
----------------------------
*Bill To:* ${sale.customerName}
*Bill No:* ${sale.invoiceNo}
*Date:* ${new Date(sale.date).toLocaleDateString()}
----------------------------
*Birds:* ${sale.birdsSold}
*Weight:* ${sale.totalWeight} kg
*Rate:* ${CURRENCY_SYMBOL}${sale.ratePerKg}
*Total:* ${CURRENCY_SYMBOL}${sale.totalSaleAmount.toLocaleString('en-IN')}
----------------------------
*Received:* ${CURRENCY_SYMBOL}${amountPaid.toLocaleString('en-IN')}
*Balance:* ${CURRENCY_SYMBOL}${balance.toLocaleString('en-IN')}
----------------------------
_Thank you for your business!_
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${sale.invoiceNo}`,
          text: text
        });
      } catch (err) {
        console.error("Error sharing invoice", err);
      }
    } else {
      // Basic fallback to copy to clipboard
      await navigator.clipboard.writeText(text);
      alert("Bill copied to clipboard! You can now paste it in WhatsApp.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Header (Hidden in Print) */}
        <div className="p-4 bg-slate-50 flex justify-between items-center shrink-0 border-b print:hidden">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Invoice Preview</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-times"></i></button>
        </div>

        {/* Invoice Body */}
        <div id="invoice-content" className="flex-1 overflow-y-auto p-6 bg-white print:overflow-visible">
          {/* Farm Branding */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-green-600 uppercase tracking-tighter">Noorani Poultry</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Premium Quality Broilers & Poultry Products</p>
          </div>

          <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase block">Bill To</span>
              <p className="text-sm font-black text-black">{sale.customerName}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase block">Invoice No</span>
              <p className="text-sm font-black text-black">{sale.invoiceNo}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(sale.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-4 border-b border-slate-100 pb-2">
              <span className="col-span-2 text-[9px] font-black text-slate-400 uppercase">Item Description</span>
              <span className="text-[9px] font-black text-slate-400 uppercase text-center">Rate</span>
              <span className="text-[9px] font-black text-slate-400 uppercase text-right">Total</span>
            </div>
            <div className="grid grid-cols-4 gap-y-1">
              <div className="col-span-2">
                <p className="text-xs font-black text-black">Live Birds</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{sale.birdsSold} Birds • {sale.totalWeight}kg</p>
              </div>
              <div className="text-center text-xs font-bold text-black self-center">{CURRENCY_SYMBOL}{sale.ratePerKg}</div>
              <div className="text-right text-xs font-black text-black self-center">{CURRENCY_SYMBOL}{sale.totalSaleAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Grand Total</span>
              <span className="text-sm font-black text-black">{CURRENCY_SYMBOL}{sale.totalSaleAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Received</span>
              <span className="text-sm font-black text-green-600">{CURRENCY_SYMBOL}{amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl mt-4">
              <span className="text-[10px] font-black text-slate-400 uppercase">Balance Due</span>
              <span className={`text-lg font-black ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {CURRENCY_SYMBOL}{balance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">*** Thank You for Your Business ***</p>
            <div className="flex justify-between mt-8 border-t border-dashed border-slate-200 pt-4">
               <div className="w-24 border-t border-slate-300">
                  <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Customer Sign</p>
               </div>
               <div className="w-24 border-t border-slate-300">
                  <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Farm Manager</p>
               </div>
            </div>
          </div>
        </div>

        {/* Actions (Hidden in Print) */}
        <div className="p-4 bg-white border-t grid grid-cols-2 gap-3 shrink-0 print:hidden">
          <button 
            onClick={handleShareInvoice}
            className="col-span-2 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <i className="fas fa-share-nodes"></i> Send Bill to Customer
          </button>
          <button 
            onClick={handlePrint}
            className="py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <i className="fas fa-print"></i> Print
          </button>
          <button 
            onClick={onClose}
            className="py-4 bg-slate-100 text-slate-600 font-black rounded-2xl active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            padding: 2cm;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
