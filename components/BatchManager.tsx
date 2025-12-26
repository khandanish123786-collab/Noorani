
import React, { useState } from 'react';
import { Batch, Expense } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface BatchManagerProps {
  batches: Batch[];
  onSaveBatch: (batch: Batch) => void;
  onDeleteBatch: (id: string) => void;
  onAddInitialExpense: (batchId: string, amount: number, date: string) => void;
}

const BatchManager: React.FC<BatchManagerProps> = ({ batches, onSaveBatch, onDeleteBatch, onAddInitialExpense }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    numChicks: '',
    chickRate: '',
    supplier: '',
    remarks: ''
  });

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      startDate: batch.startDate,
      expectedEndDate: batch.expectedEndDate,
      numChicks: batch.numChicks.toString(),
      chickRate: batch.chickRate.toString(),
      supplier: batch.supplier || '',
      remarks: batch.remarks || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: '',
      numChicks: '',
      chickRate: '',
      supplier: '',
      remarks: ''
    });
    setEditingBatch(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numChicks = Number(formData.numChicks);
    const chickRate = Number(formData.chickRate);
    const totalCost = numChicks * chickRate;
    const isNew = !editingBatch;

    const newBatch: Batch = {
      id: editingBatch?.id || Date.now().toString(),
      name: formData.name,
      startDate: formData.startDate,
      expectedEndDate: formData.expectedEndDate,
      numChicks,
      chickRate,
      totalChickCost: totalCost,
      supplier: formData.supplier,
      remarks: formData.remarks,
      isActive: editingBatch ? editingBatch.isActive : true
    };

    onSaveBatch(newBatch);
    
    // Only add initial expense for brand new batches to avoid overwriting manual adjustments
    if (isNew) {
      onAddInitialExpense(newBatch.id, totalCost, newBatch.startDate);
    }
    
    resetForm();
  };

  const toggleBatchStatus = (batch: Batch) => {
    onSaveBatch({ ...batch, isActive: !batch.isActive });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-black">Your Batches</h2>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform"
          >
            <i className="fas fa-plus mr-1"></i> New Batch
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-black">{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h3>
            <button onClick={resetForm} className="text-black hover:text-red-500"><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1">Batch Name / ID</label>
              <input 
                required
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Batch #42"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 text-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Start Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Exp. End Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.expectedEndDate}
                  onChange={e => setFormData({...formData, expectedEndDate: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 text-black"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Chicks Count</label>
                <input 
                  required
                  type="number" 
                  value={formData.numChicks}
                  onChange={e => setFormData({...formData, numChicks: e.target.value})}
                  placeholder="0"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Rate / Chick</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={formData.chickRate}
                  onChange={e => setFormData({...formData, chickRate: e.target.value})}
                  placeholder="₹ 0.00"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 text-black"
                />
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
              <span className="text-xs font-bold text-green-700 uppercase">Total Chick Cost</span>
              <span className="text-lg font-black text-green-800">
                {CURRENCY_SYMBOL}{(Number(formData.numChicks) * Number(formData.chickRate)).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1">Supplier (Optional)</label>
              <input 
                type="text" 
                value={formData.supplier}
                onChange={e => setFormData({...formData, supplier: e.target.value})}
                placeholder="Supplier Name"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 text-black"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform mt-2"
            >
              {editingBatch ? 'Update Batch' : 'Create Batch'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {batches.length === 0 ? (
          <div className="text-center py-10">
            <i className="fas fa-folder-open text-4xl text-slate-200 mb-2"></i>
            <p className="text-black">No batches yet. Tap 'New Batch' to start.</p>
          </div>
        ) : (
          batches.map(batch => (
            <div key={batch.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-black">{batch.name}</span>
                  <span className="text-xs text-black font-medium">Started: {new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleBatchStatus(batch)}
                    className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${batch.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-black'}`}
                  >
                    {batch.isActive ? 'Active' : 'Closed'}
                  </button>
                  <button onClick={() => handleEdit(batch)} className="text-black hover:text-green-600"><i className="fas fa-edit"></i></button>
                  <button onClick={() => onDeleteBatch(batch.id)} className="text-black hover:text-red-500"><i className="fas fa-trash"></i></button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-black uppercase">Chicks Purchased</span>
                  <span className="text-sm font-bold text-black">{batch.numChicks} @ {CURRENCY_SYMBOL}{batch.chickRate}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-black uppercase">Total Chick Cost</span>
                  <span className="text-sm font-bold text-green-600">{CURRENCY_SYMBOL}{batch.totalChickCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              {batch.remarks && (
                <div className="text-[11px] text-black italic bg-slate-50 p-2 rounded-lg">
                  "{batch.remarks}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BatchManager;
