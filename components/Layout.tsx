
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="bg-green-800 text-white p-4 shadow-md shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
            <div className="relative w-10 h-10 bg-green-700/30 rounded-xl flex items-center justify-center overflow-hidden shadow-inner border border-white/10">
              <svg viewBox="0 0 100 100" className="w-7 h-7 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="eggGradient" cx="45%" cy="40%" r="50%" fx="30%" fy="30%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f0f0f0" />
                  </radialGradient>
                </defs>
                <path d="M50,15 C35,15 25,35 25,60 C25,80 35,90 50,90 C65,90 75,80 75,60 C75,35 65,15 50,15 Z" fill="url(#eggGradient)" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tighter text-white">Noorani</span>
              <span className="text-[10px] font-bold opacity-80 -mt-0.5 tracking-[0.2em] text-white">Poultry Farm</span>
            </div>
          </h1>
          
          <div 
            onClick={() => setActiveTab('backup')} 
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-400/30 bg-green-900/40 text-green-300 text-[9px] font-black uppercase transition-all"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            Data Safe
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-6 shadow-lg z-50 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 min-w-[50px] ${activeTab === 'dashboard' ? 'text-green-700' : 'text-slate-400'}`}>
          <i className="fas fa-chart-pie text-lg"></i>
          <span className="text-[9px] font-bold uppercase">Stats</span>
        </button>
        <button onClick={() => setActiveTab('batches')} className={`flex flex-col items-center gap-1 min-w-[50px] ${activeTab === 'batches' ? 'text-green-700' : 'text-slate-400'}`}>
          <i className="fas fa-layer-group text-lg"></i>
          <span className="text-[9px] font-bold uppercase">Batches</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 min-w-[50px] ${activeTab === 'expenses' ? 'text-green-700' : 'text-slate-400'}`}>
          <i className="fas fa-receipt text-lg"></i>
          <span className="text-[9px] font-bold uppercase">Exp</span>
        </button>
        <button onClick={() => setActiveTab('mortality')} className={`flex flex-col items-center gap-1 min-w-[50px] ${activeTab === 'mortality' ? 'text-red-600' : 'text-slate-400'}`}>
          <i className="fas fa-skull text-lg"></i>
          <span className="text-[9px] font-bold uppercase">Death</span>
        </button>
        <button onClick={() => setActiveTab('ledger')} className={`flex flex-col items-center gap-1 min-w-[50px] ${activeTab === 'ledger' ? 'text-green-700' : 'text-slate-400'}`}>
          <i className="fas fa-book text-lg"></i>
          <span className="text-[9px] font-bold uppercase">Ledger</span>
        </button>
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 min-w-[50px] ${activeTab === 'sales' ? 'text-green-700' : 'text-slate-400'}`}>
          <i className="fas fa-hand-holding-dollar text-lg"></i>
          <span className="text-[9px] font-bold uppercase">Sales</span>
        </button>
        <button onClick={() => setActiveTab('backup')} className={`flex flex-col items-center gap-1 min-w-[50px] ${activeTab === 'backup' ? 'text-green-700' : 'text-slate-400'}`}>
          <i className="fas fa-shield-halved text-lg"></i>
          <span className="text-[9px] font-bold uppercase">Safety</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
