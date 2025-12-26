
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

interface BackupManagerProps {
  onRefresh: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ onRefresh }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if ((window as any).deferredPrompt) setCanInstall(true);
    const handler = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    const success = await storageService.exportData();
    setExporting(false);
    if (success) {
      const btn = document.getElementById('btn-download');
      if (btn) {
        const oldText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => { btn.innerHTML = oldText; }, 2000);
      }
    }
  };

  const handleExportCSV = () => {
    storageService.exportCSV();
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await storageService.shareData();
    } finally {
      setSharing(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setImporting(true);
      
      let success = false;
      if (file.name.endsWith('.json')) {
        success = await storageService.importData(content);
      } else if (file.name.endsWith('.csv')) {
        success = await storageService.importCSV(content);
      }
      
      setImporting(false);
      if (success) {
        alert('Backup restored successfully!');
        window.location.reload();
      } else {
        alert('Failed to restore backup. Check file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleInstallApp = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
      alert('To install:\n1. iPhone: Tap "Share" then "Add to Home Screen".\n2. Android: Tap Menu ⋮ then "Install App".');
      return;
    }
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      (window as any).deferredPrompt = null;
      setCanInstall(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-50 text-green-700 border-2 border-green-200 shadow-inner">
          <i className="fas fa-shield-halved text-3xl"></i>
        </div>
        <h2 className="text-xl font-black text-black tracking-tight">Farm Safety Center</h2>
        <p className="text-[10px] text-slate-500 font-bold px-8 mt-2 uppercase tracking-widest leading-relaxed text-center">
          Backups & Security Settings
        </p>
      </div>

      <div className="space-y-4">
        {/* CSV & Excel Section */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Excel & Sheets Support</h3>
          <div className="space-y-3">
            <button 
              onClick={handleExportCSV}
              className="w-full flex items-center gap-4 p-4 bg-slate-800 rounded-2xl active:scale-[0.98] transition-all shadow-md text-white"
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <i className="fas fa-file-csv text-lg"></i>
              </div>
              <div className="text-left">
                <div className="font-black text-sm">Download All Data as CSV</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase italic">Best for Excel & Record Keeping</div>
              </div>
              <i className="fas fa-chevron-right ml-auto opacity-30"></i>
            </button>

            <label className="w-full flex items-center gap-4 p-4 bg-emerald-700 rounded-2xl active:scale-[0.98] transition-all shadow-md text-white cursor-pointer">
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <i className="fas fa-file-import text-lg"></i>
              </div>
              <div className="text-left">
                <div className="font-black text-sm">Restore from CSV</div>
                <div className="text-[9px] font-bold text-emerald-300 uppercase italic">Upload your Excel files</div>
              </div>
              <i className="fas fa-chevron-right ml-auto opacity-30"></i>
            </label>
          </div>
        </div>

        {/* JSON Section */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">System Backups (JSON)</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
              <button 
                onClick={handleShare}
                disabled={sharing}
                className="flex flex-col items-center gap-2 p-4 bg-blue-600 rounded-2xl active:scale-[0.95] transition-all text-white shadow-md disabled:opacity-50"
              >
                <i className={`fas ${sharing ? 'fa-spinner fa-spin' : 'fa-share-nodes'} text-lg`}></i>
                <span className="text-[10px] font-black uppercase">{sharing ? 'Sending...' : 'Send JSON'}</span>
              </button>
              <label className="flex flex-col items-center gap-2 p-4 bg-orange-600 rounded-2xl active:scale-[0.95] transition-all text-white shadow-md cursor-pointer">
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                <i className={`fas ${importing ? 'fa-spinner fa-spin' : 'fa-upload'} text-lg`}></i>
                <span className="text-[10px] font-black uppercase">{importing ? 'Wait...' : 'Restore JSON'}</span>
              </label>
          </div>
          <button 
            id="btn-download"
            disabled={exporting}
            onClick={handleExport}
            className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            Save JSON to Folder
          </button>
        </div>

        {/* Install Section */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <button 
            onClick={handleInstallApp}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-800 to-green-700 border border-green-900 rounded-2xl active:scale-[0.98] transition-all shadow-xl text-white"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <i className="fas fa-mobile-screen text-xl"></i>
            </div>
            <div className="text-left">
              <div className="font-black text-sm text-white">Use as Phone App</div>
              <div className="text-[10px] font-bold text-green-300 uppercase italic">Get icon on Home Screen</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
