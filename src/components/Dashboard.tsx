
import React, { useState } from 'react';
import { Search, Bell, Filter, MoreVertical, Plus, UserPlus, FileText, Calendar, X } from 'lucide-react';
import { useCases } from '../lib/CaseContext';
import { Case } from '../lib/types';
import { toast } from 'sonner';

interface DashboardProps {
  onSelectCase: (caseId: string) => void;
}

export function Dashboard({ onSelectCase }: DashboardProps) {
  const { cases, addCase } = useCases();
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  
  // New Case Form State
  const [newApplicantName, setNewApplicantName] = useState("");
  const [newApplicantPesel, setNewApplicantPesel] = useState("");
  const [newAccidentDate, setNewAccidentDate] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleCreateCase = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newApplicantName || !newAccidentDate) {
          toast.error("Wypełnij wymagane pola (Imię, Data)");
          return;
      }
      
      const newId = addCase({
          applicantName: newApplicantName,
          applicantPesel: newApplicantPesel || "brak",
          accidentDate: newAccidentDate,
          businessType: newDescription || "Zgłoszenie ręczne",
          description: newDescription
      });
      
      setShowNewCaseModal(false);
      onSelectCase(newId); // Auto-open new case
      
      // Reset form
      setNewApplicantName("");
      setNewApplicantPesel("");
      setNewAccidentDate("");
      setNewDescription("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pulpit Orzecznika</h1>
          <p className="text-slate-500">Witaj, Marek Kowalczyk</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Szukaj sprawy, PESEL..." 
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
            MK
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 p-8 pb-4">
        <StatCard label="Otwarte sprawy" value={cases.filter(c => c.status === 'new' || c.status === 'in_progress').length} change="+2 dzisiaj" />
        <StatCard label="Oczekujące na opinię" value={cases.filter(c => c.status === 'investigation_needed').length} change="-1 od wczoraj" />
        <StatCard label="Wydane decyzje" value={cases.filter(c => c.status === 'opinion_positive' || c.status === 'opinion_negative').length} change="+5 w tym tygodniu" />
        <StatCard label="Średni czas obsługi" value="1.2 dnia" change="-0.3 dnia (poprawa)" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 py-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Moje zadania</h2>
          <div className="flex gap-3">
             <button 
                onClick={() => setShowNewCaseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nowe Zgłoszenie
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              Filtruj
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl flex-1 overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Osoba / Firma</th>
                  <th className="px-6 py-3 font-medium">Rodzaj zdarzenia</th>
                  <th className="px-6 py-3 font-medium">Data wpływu</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">SLA</th>
                  <th className="px-6 py-3 font-medium">Ryzyko</th>
                  <th className="px-6 py-3 text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr key={c.id} onClick={() => onSelectCase(c.id)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{c.applicantName}</div>
                      <div className="text-xs text-slate-500">{c.applicantPesel}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                        {c.businessType || "Wypadek w pracy"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.accidentDate}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {c.sla}
                      </div>
                    </td>
                     <td className="px-6 py-4">
                         {c.riskScore > 50 ? (
                             <span className="text-red-600 font-bold">{c.riskScore}%</span>
                         ) : (
                             <span className="text-emerald-600 font-bold">{c.riskScore}%</span>
                         )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                           <MoreVertical className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {cases.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    Brak spraw na liście. Dodaj nowe zgłoszenie.
                </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW CASE MODAL */}
      {showNewCaseModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-emerald-600" />
                          Rejestracja Nowego Zgłoszenia
                      </h3>
                      <button onClick={() => setShowNewCaseModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="h-5 w-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleCreateCase} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Imię i Nazwisko Wnioskodawcy <span className="text-red-500">*</span></label>
                          <input 
                              required
                              type="text" 
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              placeholder="np. Jan Kowalski"
                              value={newApplicantName}
                              onChange={e => setNewApplicantName(e.target.value)}
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">PESEL</label>
                              <input 
                                  type="text" 
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                  placeholder="11 cyfr"
                                  value={newApplicantPesel}
                                  onChange={e => setNewApplicantPesel(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Data Zdarzenia <span className="text-red-500">*</span></label>
                              <input 
                                  required
                                  type="date" 
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                  value={newAccidentDate}
                                  onChange={e => setNewAccidentDate(e.target.value)}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tytuł / Opis Skrócony</label>
                          <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              placeholder="np. Upadek z wysokości w magazynie"
                              value={newDescription}
                              onChange={e => setNewDescription(e.target.value)}
                          />
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-sm text-blue-700 border border-blue-100">
                          <FileText className="h-5 w-5 shrink-0" />
                          <p>Po utworzeniu sprawy zostaniesz przekierowany do widoku szczegółowego, gdzie będziesz mógł wgrać dokumentację (Karta Wypadku, Zeznania) do analizy AI.</p>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                          <button 
                              type="button"
                              onClick={() => setShowNewCaseModal(false)}
                              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          >
                              Anuluj
                          </button>
                          <button 
                              type="submit"
                              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
                          >
                              <Plus className="h-4 w-4" />
                              Utwórz Sprawę
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}

function StatCard({ label, value, change }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="text-slate-500 text-sm font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className={`text-xs mt-2 font-medium ${change.includes('+') ? 'text-emerald-600' : 'text-slate-500'}`}>
        {change}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    investigation_needed: 'bg-amber-50 text-amber-700 border-amber-200',
    opinion_positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    opinion_negative: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels: Record<string, string> = {
    new: 'Nowa sprawa',
    in_progress: 'Analiza AI',
    investigation_needed: 'Wymaga opinii',
    opinion_positive: 'Uznano wypadek',
    opinion_negative: 'Odmowa uznania',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {labels[status] || status}
    </span>
  );
}
