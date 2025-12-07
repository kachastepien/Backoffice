
import React, { useState } from 'react';
import { Layout, FileText, Activity, CheckSquare, Settings, LogOut, Menu } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CaseDetail } from './components/CaseDetail';
import { Toaster } from './components/ui/sonner';
import { AnalysisProvider } from './lib/AnalysisContext';
import { CaseProvider } from './lib/CaseContext';

// Simple routing for the prototype
type View = 'dashboard' | 'case-detail';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [initialFileForCase, setInitialFileForCase] = useState<any>(null);

  const handleNavigateToCase = (caseId: string, file?: any) => {
    setSelectedCaseId(caseId);
    if (file) setInitialFileForCase(file);
    else setInitialFileForCase(null);
    setCurrentView('case-detail');
  };

  const handleNavigateHome = () => {
    setSelectedCaseId(null);
    setInitialFileForCase(null);
    setCurrentView('dashboard');
  };

  return (
    <CaseProvider>
    <AnalysisProvider>
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">

        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-xl text-emerald-700">
            <Activity className="h-6 w-6" />
            <span>ZANT System</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">ZUS Analysis & Triage</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={handleNavigateHome}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentView === 'dashboard' 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layout className="h-4 w-4" />
            Pulpit
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100">
            <FileText className="h-4 w-4" />
            Rejestr zgłoszeń
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100">
            <CheckSquare className="h-4 w-4" />
            Decyzje i Opinie
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100">
            <Settings className="h-4 w-4" />
            Ustawienia
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 mt-1">
            <LogOut className="h-4 w-4" />
            Wyloguj
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-emerald-700">
            <Activity className="h-5 w-5" />
            <span>ZANT</span>
          </div>
          <button className="p-2 text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {currentView === 'dashboard' && (
            <Dashboard onSelectCase={handleNavigateToCase} />
          )}
          {currentView === 'case-detail' && selectedCaseId && (
            <CaseDetail 
              caseId={selectedCaseId} 
              onBack={handleNavigateHome} 
              initialFile={initialFileForCase}
            />
          )}
        </div>
      </main>
      
      <Toaster />
    </div>
    </AnalysisProvider>
    </CaseProvider>
  );
}
