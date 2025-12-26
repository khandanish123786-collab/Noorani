
import React, { useState } from 'react';
import { Mortality, Batch } from '../types';

interface MortalityTrackerProps {
  mortalityRecords: Mortality[];
  batches: Batch[];
  onSaveMortality: (record: Mortality) => void;
  onDeleteMortality: (id: string) => void;
}

const MortalityTracker: React.FC<MortalityTrackerProps> = ({ mortalityRecords, batches, onSaveMortality, onDeleteMortality }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batchId: '',
    count: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchId) return alert('Please select a batch');

    onSaveMortality({
      id: editingId || Date.now().toString(),
      date: formData.date,
      batchId: formData.batchId,
      count: Number(formData.count),
      reason: formData.reason
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      batchId: '',
      count: '',
      reason: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: Mortality) => {
    setEditingId(record.id);
    setFormData({
      date: record.date,
      batchId: record.batchId,
      count: record.count.toString(),
      reason: record.reason || ''
    });
    setShowForm(true);
  };

  const totalDeaths = mortalityRecords.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-black">Mortality Records</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform"
        >
          <i className="fas fa-plus mr-1"></i> New Entry
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <span className="text-xs font-bold text-black uppercase">Total Mortality</span>
        <span className="text-xl font-black text-slate-800">{totalDeaths} Birds</span>
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
            <div>
                <label className="block text-xs font-bold text-black uppercase mb-1">Death Count</label>
                <input required type="number" value={formData.count} onChange={e => setFormData({...formData, count: e.target.value})} placeholder="Number of birds" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1">Reason (Optional)</label>
              <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-black" placeholder="Reason for mortality..." />
            </div>
            <button type="submit" className="w-full py-4 bg-slate-800 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform">
              {editingId ? 'Update Record' : 'Save Record'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="w-full py-2 text-black font-bold">Cancel</button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {mortalityRecords.slice().reverse().map(record => {
          const batch = batches.find(b => b.id === record.batchId);
          return (
            <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-black text-black">Batch: {batch?.name || 'Deleted'}</span>
                  <span className="text-[10px] text-black font-bold uppercase">{new Date(record.date).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-red-500">{record.count} Birds</div>
                </div>
              </div>
              {record.reason && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                  "{record.reason}"
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-50 mt-1">
                <button onClick={() => handleEdit(record)} className="text-black text-sm"><i className="fas fa-edit"></i></button>
                <button onClick={() => onDeleteMortality(record.id)} className="text-black text-sm"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MortalityTracker;
