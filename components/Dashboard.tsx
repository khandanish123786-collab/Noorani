
import React, { useState } from 'react';
import { Batch, Expense, Sale, Mortality } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface DashboardProps {
  batches: Batch[];
  expenses: Expense[];
  sales: Sale[];
  mortality: Mortality[];
}

const Dashboard: React.FC<DashboardProps> = ({ batches, expenses, sales, mortality }) => {
  const [showHistory, setShowHistory] = useState(false);
  
  const activeBatches = batches.filter(b => b.isActive);
  const closedBatches = batches.filter(b => !b.isActive);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  const totalChicks = batches.reduce((sum, b) => sum + b.numChicks, 0);
  const totalMortality = mortality.reduce((sum, m) => sum + m.count, 0);
  
  const netProfit = totalSales - totalExpenses;
  const profitPerChick = totalChicks > 0 ? netProfit / totalChicks : 0;
  const mortalityRate = totalChicks > 0 ? (totalMortality / totalChicks) * 100 : 0;

  const StatCard = ({ title, value, color, icon, isCurrency = true, suffix = '' }: any) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
      <div className="flex justify-between items-center text-black mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{title}</span>
        <i className={`${icon} text-sm opacity-30`}></i>
      </div>
      <div className={`text-xl font-black ${color}`}>
        {isCurrency ? CURRENCY_SYMBOL : ''}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value}{suffix}
      </div>
    </div>
  );

  const BatchPerformanceCard: React.FC<{ batch: Batch }> = ({ batch }) => {
    const bExpensesList = expenses.filter(e => e.batchId === batch.id);
    const bSalesList = sales.filter(s => s.batchId === batch.id);
    const bMortalities = mortality.filter(m => m.batchId === batch.id);

    const bExpTotal = bExpensesList.reduce((s, e) => s + e.amount, 0);
    const bSalTotal = bSalesList.reduce((s, s_obj) => s + s_obj.totalSaleAmount, 0);
    const bWeightTotal = bSalesList.reduce((s, s_obj) => s + s_obj.totalWeight, 0);
    const bMortTotal = bMortalities.reduce((s, m) => s + m.count, 0);
    
    const bProfit = bSalTotal - bExpTotal;
    const roi = bExpTotal > 0 ? (bProfit / bExpTotal) * 100 : 0;
    const avgRate = bWeightTotal > 0 ? bSalTotal / bWeightTotal : 0;
    const profitPerBird = batch.numChicks > 0 ? bProfit / batch.numChicks : 0;
    const mortPercent = batch.numChicks > 0 ? (bMortTotal / batch.numChicks) * 100 : 0;

    return (
      <div className={`bg-white p-4 rounded-3xl shadow-sm border ${batch.isActive ? 'border-green-200' : 'border-slate-200'} flex flex-col gap-4 relative overflow-hidden transition-all active:scale-[0.99]`}>
        {/* Card Status Indicator */}
        <div className={`absolute top-0 right-0 h-1 w-full ${batch.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></div>

        {/* Header Section */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-slate-900 text-lg truncate leading-none">{batch.name}</span>
              {!batch.isActive && (
                <span className="shrink-0 text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">Completed</span>
              )}
            </div>
            <div className="flex flex-col text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              <span>{new Date(batch.startDate).toLocaleDateString()} Start</span>
              <span>{batch.numChicks} Initial Birds</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-xl font-black ${bProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {bProfit >= 0 ? '+' : ''}{CURRENCY_SYMBOL}{bProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Net P&L</span>
          </div>
        </div>

        {/* Detailed Financial Stats Grid */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
          {/* Revenue Box */}
          <div className="bg-white p-3">
            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Total Revenue</span>
            <div className="text-sm font-black text-blue-600">{CURRENCY_SYMBOL}{bSalTotal.toLocaleString('en-IN')}</div>
            <div className="text-[9px] font-bold text-slate-500 mt-1">
              {bWeightTotal.toFixed(1)}kg @ {CURRENCY_SYMBOL}{avgRate.toFixed(1)}/kg
            </div>
          </div>
          {/* Expense Box */}
          <div className="bg-white p-3">
            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Total Expenses</span>
            <div className="text-sm font-black text-slate-800">{CURRENCY_SYMBOL}{bExpTotal.toLocaleString('en-IN')}</div>
            <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase">
              ROI: <span className={roi >= 0 ? 'text-green-600' : 'text-red-600'}>{roi.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profit / Bird</span>
            <span className={`text-xs font-black ${profitPerBird >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {CURRENCY_SYMBOL}{profitPerBird.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col text-center border-x border-slate-200 px-4">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mortality</span>
             <span className="text-xs font-black text-red-500">{mortPercent.toFixed(1)}%</span>
          </div>
          <div className="flex flex-col text-right">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deaths</span>
             <span className="text-xs font-black text-slate-700">{bMortTotal} Birds</span>
          </div>
        </div>

        {/* Action / Footer */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {batch.isActive ? (
              <span className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <i className="fas fa-circle text-[6px] animate-pulse"></i> Cycle Running
              </span>
            ) : (
              <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <i className="fas fa-check-circle"></i> Cycle Settled
              </span>
            )}
          </div>
          <div className="text-[9px] font-bold text-slate-300 uppercase italic">
            ID: {batch.id.slice(-6)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`col-span-2 p-6 rounded-[2.5rem] shadow-lg flex flex-col gap-1 relative overflow-hidden ${netProfit >= 0 ? 'bg-green-600 text-white shadow-green-200' : 'bg-red-600 text-white shadow-red-200'}`}>
           <div className="absolute -right-4 -top-4 opacity-10">
             <i className="fas fa-chart-line text-8xl"></i>
           </div>
           <span className="text-[10px] font-black uppercase opacity-80 tracking-widest text-white">Overall Farm Efficiency</span>
           <div className="text-4xl font-black text-white tracking-tighter">
             {CURRENCY_SYMBOL}{netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
           </div>
           <div className="mt-3 flex gap-4 text-[10px] font-black uppercase tracking-wider text-white">
             <div className="bg-white/10 px-3 py-1 rounded-lg">Rev: {CURRENCY_SYMBOL}{totalSales.toLocaleString('en-IN')}</div>
             <div className="bg-white/10 px-3 py-1 rounded-lg">Exp: {CURRENCY_SYMBOL}{totalExpenses.toLocaleString('en-IN')}</div>
           </div>
        </div>
        <StatCard title="Active Cycles" value={activeBatches.length} isCurrency={false} icon="fas fa-bolt" color="text-green-600" />
        <StatCard title="Total Deaths" value={totalMortality} isCurrency={false} icon="fas fa-skull" color="text-red-500" />
        <StatCard title="Avg Profit/Bird" value={profitPerChick} icon="fas fa-dove" color="text-indigo-600" />
        <StatCard title="Total Capacity" value={totalChicks} isCurrency={false} icon="fas fa-hashtag" color="text-slate-700" />
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={() => setShowHistory(false)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 ${!showHistory ? 'bg-green-600 text-white shadow-md' : 'text-slate-400'}`}>Current Batches</button>
        <button onClick={() => setShowHistory(true)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 ${showHistory ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>History Ledger</button>
      </div>

      <div className="space-y-4 pt-2">
        {!showHistory ? (
          <>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Live Cycles
            </h3>
            {activeBatches.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-200">
                <i className="fas fa-box-open text-3xl text-slate-200 mb-3"></i>
                <p className="text-slate-400 text-xs font-black uppercase">Start a new batch to see stats</p>
              </div>
            ) : (activeBatches.slice().reverse().map(batch => <BatchPerformanceCard key={batch.id} batch={batch} />))}
          </>
        ) : (
          <>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Archived Summaries</h3>
            {closedBatches.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-black uppercase">No closed batches found</p>
              </div>
            ) : (closedBatches.slice().reverse().map(batch => <BatchPerformanceCard key={batch.id} batch={batch} />))}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
