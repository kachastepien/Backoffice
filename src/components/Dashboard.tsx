
import React, { useState, useRef } from 'react';
import { Search, Bell, Filter, MoreVertical, Plus, UserPlus, FileText, Calendar, X, Upload, Check, RefreshCw } from 'lucide-react';
import { useCases } from '../lib/CaseContext';
import { Case } from '../lib/types';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

interface DashboardProps {
  onSelectCase: (caseId: string, file?: any) => void;
}

export function Dashboard({ onSelectCase }: DashboardProps) {
  const { cases, addCase } = useCases();
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  
  // New Case Form State
  const [newApplicantName, setNewApplicantName] = useState("");
  const [newApplicantPesel, setNewApplicantPesel] = useState("");
  const [newAccidentDate, setNewAccidentDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  
  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset form
      setNewApplicantName("");
      setNewApplicantPesel("");
      setNewAccidentDate("");
      setNewDescription("");

      const reader = new FileReader();
      reader.onloadend = async () => {
          const content = reader.result as string;
          const fileObj = { name: file.name, type: file.type, content: content };
          setUploadedFile(fileObj);
          
          // Auto analyze
          setIsAnalyzing(true);
          try {
               const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a27dc869/extract-metadata`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ file: fileObj })
               });
               const data = await response.json();
               if (data.error) throw new Error(data.error);

               if (data.applicantName) setNewApplicantName(data.applicantName);
               if (data.applicantPesel) setNewApplicantPesel(data.applicantPesel);
               if (data.accidentDate) setNewAccidentDate(data.accidentDate);
               if (data.description) setNewDescription(data.description);
               
               toast.success("Dane formularza uzupełnione automatycznie przez AI!");
          } catch (err: any) {
              console.error(err);
              toast.error("Nie udało się odczytać danych automatycznie, ale plik został dołączony.");
          } finally {
              setIsAnalyzing(false);
          }
      };
      reader.readAsDataURL(file);
  };

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
          businessType: newDescription || "Zgłoszenie z pliku",
          description: newDescription
      });
      
      setShowNewCaseModal(false);
      onSelectCase(newId, uploadedFile); // Pass file to next view
      
      // Reset form
      setNewApplicantName("");
      setNewApplicantPesel("");
      setNewAccidentDate("");
      setNewDescription("");
      setUploadedFile(null);
  };

  const loadDemoData = () => {
      const demoCases = [
          { name: "Jan Nowak", pesel: "80010112345", date: "2024-05-10", desc: "Upadek z rusztowania na budowie", risk: 85 },
          { name: "Anna Kowalska", pesel: "92031509876", date: "2024-05-12", desc: "Poślizgnięcie na mokrej podłodze w biurze", risk: 20 },
          { name: "Piotr Wiśniewski", pesel: "78112005432", date: "2024-05-14", desc: "Wypadek komunikacyjny w drodze do klienta", risk: 45 },
          { name: "Krzysztof Zieliński", pesel: "85070512345", date: "2024-05-15", desc: "Uraz dłoni przy obsłudze piły tarczowej", risk: 60 },
          { name: "Maria Lewandowska", pesel: "65022806789", date: "2024-05-16", desc: "Zawał serca podczas spotkania z zarządem", risk: 90 }
      ];

      demoCases.forEach(c => {
          addCase({
              applicantName: c.name,
              applicantPesel: c.pesel,
              accidentDate: c.date,
              businessType: c.desc,
              description: c.desc
          });
      });
      toast.success("Załadowano 5 spraw testowych dla Jury!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pulpit Orzecznika</h1>
          <p className="text-slate-500">Witaj, Marek Kowalczyk (Tryb Ekspercki)</p>
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
                onClick={loadDemoData}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-200 shadow-sm transition-all font-medium"
            >
              <FileText className="h-4 w-4" />
              Załaduj Zestaw Testowy (Jury)
            </button>
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
                      {/* FILE UPLOAD AREA */}
                      <div 
                        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative overflow-hidden group ${
                            uploadedFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                        }`}
                      >
                          <input type="file" ref={fileInputRef} onChange={handlePreUpload} className="hidden" accept=".pdf,image/*" />
                          
                          {isAnalyzing ? (
                              <div className="flex flex-col items-center justify-center py-2">
                                  <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
                                  <span className="font-bold text-indigo-700">Analiza dokumentu (AI)...</span>
                                  <span className="text-xs text-indigo-500 mt-1">Wyciągam dane do formularza</span>
                              </div>
                          ) : uploadedFile ? (
                              <div className="flex flex-col items-center py-2">
                                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                      <Check className="h-6 w-6 text-emerald-600" />
                                  </div>
                                  <span className="font-bold text-emerald-800">{uploadedFile.name}</span>
                                  <span className="text-xs text-emerald-600 mt-1">Plik gotowy do dołączenia do sprawy</span>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                                    className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
                                  >
                                      Usuń plik
                                  </button>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center py-2">
                                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                      <Upload className="h-6 w-6 text-indigo-600" />
                                  </div>
                                  <span className="font-medium text-slate-700">Kliknij, aby wgrać skan/PDF zgłoszenia</span>
                                  <span className="text-xs text-slate-500 mt-1 max-w-xs">
                                      System automatycznie odczyta dane (Imię, Datę, Opis) i wypełni formularz poniżej.
                                  </span>
                              </div>
                          )}
                      </div>

                      <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-2 bg-white text-xs text-slate-400 uppercase tracking-wide">Lub wpisz ręcznie</span>
                          </div>
                      </div>

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
