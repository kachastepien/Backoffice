import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, FileCheck, Printer, Download, Sparkles, RefreshCw, Activity, Upload, Image as ImageIcon, X, Paperclip, Stethoscope, MessageSquare, Send, Check, XCircle, Save, ScanText, Scale, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { useAnalysis } from '../lib/AnalysisContext';
import { useCases } from '../lib/CaseContext';
import { AccidentCardView } from './AccidentCardView';

interface CaseDetailProps {
  caseId: string;
  onBack: () => void;
}

type Tab = 'docs' | 'analysis' | 'opinion' | 'card';

interface MedicalOpinion {
    text: string;
    conclusion: 'is_injury_confirmed' | 'is_disease_confirmed' | 'insufficient_data';
    icd10: string;
    timestamp: string;
}

export function CaseDetail({ caseId, onBack }: CaseDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('docs');
  
  const { getCase } = useCases();
  const currentCase = getCase(caseId);

  // Global Analysis Context
  const { casesState, startAnalysis } = useAnalysis();
  const caseState = casesState[caseId] || { step: 'idle', progress: 0, result: null, files: [] };
  
  // Local state for UI inputs
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, content: string, type: string}[]>([]); 

  // Consultation State
  const [doctorQuestion, setDoctorQuestion] = useState("Proszę o ocenę, czy opisany uraz pozostaje w związku przyczynowym ze zdarzeniem, czy wynika ze schorzeń samoistnych.");
  const [isConsulting, setIsConsulting] = useState(false);
  const [medicalOpinion, setMedicalOpinion] = useState<MedicalOpinion | null>(null);

  // Decision Panel State
  const [decisionState, setDecisionState] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [rejectReason, setRejectReason] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDecisionState('pending');
    setRejectReason("");
    setMedicalOpinion(null);
  }, [caseId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            content: reader.result as string,
            type: file.type
          }]);
        };
        reader.readAsDataURL(file);
      });
      toast.success(`Dodano pliki: ${files.length}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRunAnalysis = () => {
      if (uploadedFiles.length === 0) {
          toast.error("Wgraj dokumenty (skan/PDF) przed rozpoczęciem analizy.");
          return;
      }
      // Pass empty string as text input since we only support files now
      startAnalysis(caseId, uploadedFiles, "");
  };

  const runConsultation = async () => {
      setIsConsulting(true);
      try {
        const context = `
            DANE: ${currentCase?.applicantName}, lat 45.
            ZDARZENIE: ${caseState.result?.criteria_explanation?.suddenness || "Brak opisu"}
            URAZ WSTĘPNY: ${caseState.result?.criteria_explanation?.injury || "Brak opisu"}
            PYTANIE PRACOWNIKA: ${doctorQuestion}
        `;

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a27dc869/consult-doctor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: doctorQuestion,
                context: context
            })
        });

        const data = await response.json();
        if(data.error) throw new Error(data.error);

        setMedicalOpinion({
            text: data.doctor_opinion,
            conclusion: data.conclusion,
            icd10: data.icd10_suggestion,
            timestamp: new Date().toLocaleTimeString()
        });

      } catch (error: any) {
          toast.error("Błąd konsultacji: " + error.message);
      } finally {
          setIsConsulting(false);
      }
  };

  const generateOpinionText = () => {
      if (!caseState.result) return "";
      
      if (caseState.result.legal_opinion_draft) return caseState.result.legal_opinion_draft;

      const r = caseState.result;
      return `OPINIA W SPRAWIE KWALIFIKACJI PRAWNEJ ZDARZENIA\n\n1. DANE IDENTYFIKACYJNE\nWnioskodawca: ${currentCase?.applicantName}\nData zdarzenia: ${currentCase?.accidentDate}\n\n2. ANALIZA MATERIAŁU DOWODOWEGO\nPrzeanalizowano dokumentację:\n${(r.identified_documents || []).map((d: string) => `- ${d}`).join('\n')}\n\n3. USTALONY STAN FAKTYCZNY\n${r.summary}\n\n4. OCENA PRAWNA\n${Object.entries(r.criteria_explanation || {}).map(([k, v]) => `- ${k.toUpperCase()}: ${v}`).join('\n')}\n\n5. WSKAŹNIK PEWNOŚCI AI\nWynik: ${r.calculation?.confidence_score}%\nUzasadnienie: ${r.calculation?.reasoning_short}\n\nSporządzono w systemie ZANT.`;
  }

  const renderProgress = () => {
      const steps = [
          { id: 'ocr_processing', label: 'OCR & Weryfikacja', icon: ScanText },
          { id: 'legal_analysis', label: 'Analiza Prawna (Agent)', icon: Scale },
          { id: 'calculating_confidence', label: 'Kalkulator Pewności', icon: Calculator }
      ];

      const currentStepIndex = steps.findIndex(s => s.id === caseState.step);
      let activeIndex = -1;
      if (caseState.step === 'complete') activeIndex = 3; 
      else if (caseState.step !== 'idle' && caseState.step !== 'uploading' && caseState.step !== 'error') {
          activeIndex = currentStepIndex;
      }

      return (
          <div className="w-full max-w-3xl mx-auto mb-8">
              <div className="flex justify-between items-center relative mb-8">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded"></div>
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 rounded transition-all duration-500"
                    style={{ width: `${Math.max(5, caseState.progress)}%` }}
                  ></div>

                  {steps.map((step, idx) => {
                      const isActive = idx === activeIndex;
                      const isCompleted = idx < activeIndex;
                      const Icon = step.icon;
                      
                      return (
                          <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isActive || isCompleted 
                                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                                  : 'bg-white border-slate-300 text-slate-400'
                              }`}>
                                  {isCompleted ? <Check className="h-6 w-6" /> : <Icon className={`h-6 w-6 ${isActive ? 'animate-pulse' : ''}`} />}
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-wide ${isActive || isCompleted ? 'text-indigo-700' : 'text-slate-400'}`}>
                                  {step.label}
                              </span>
                          </div>
                      )
                  })}
              </div>
              <div className="text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100 animate-pulse">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Trwa przetwarzanie w chmurze... Nie zamykaj aplikacji.
                  </span>
              </div>
          </div>
      );
  };

  if (!currentCase) return <div className="p-8">Ładowanie...</div>;

  const isProcessing = caseState.step !== 'idle' && caseState.step !== 'complete' && caseState.step !== 'error';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">ZUS/WP/2024/{currentCase.id.substring(0,4)}</h1>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-600 uppercase tracking-wide">
                {currentCase.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{currentCase.applicantName} • {currentCase.businessType}</p>
          </div>
        </div>
        <div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">
                <Download className="h-4 w-4" />
                Otwórz w PUE
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8">
        <div className="flex gap-6">
          <TabButton 
            active={activeTab === 'docs'} 
            onClick={() => setActiveTab('docs')} 
            icon={<FileText className="h-4 w-4" />} 
            label="Podgląd dokumentów" 
            badge={uploadedFiles.length > 0 ? uploadedFiles.length : null}
          />
          <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')} 
            icon={<Sparkles className="h-4 w-4" />} 
            label="Dane sprawy / Analiza AI" 
            badge={caseState.step === 'complete' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : null}
          />
          <TabButton 
            active={activeTab === 'opinion'} 
            onClick={() => setActiveTab('opinion')} 
            icon={<Scale className="h-4 w-4" />} 
            label="Projekt Opinii" 
            disabled={caseState.step !== 'complete'}
          />
          <TabButton 
            active={activeTab === 'card'} 
            onClick={() => setActiveTab('card')} 
            icon={<Printer className="h-4 w-4" />} 
            label="Projekt Karty Wypadku" 
            disabled={caseState.step !== 'complete'}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 max-w-[1600px] mx-auto w-full">
        
        {activeTab === 'docs' && (
          <div className="space-y-6 max-w-5xl mx-auto">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer min-h-[200px]"
                >
                    <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                    <Upload className="h-10 w-10 mb-3 text-slate-400" />
                    <span className="font-medium text-lg">Kliknij, aby wgrać dokumenty sprawy</span>
                    <span className="text-sm text-slate-400 mt-2">PDF, JPG, PNG (System automatycznie wykona OCR)</span>
                </div>
                {uploadedFiles.length > 0 && (
                     <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">Wgrane pliki ({uploadedFiles.length}):</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {uploadedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                                    <span className="text-sm truncate">{file.name}</span>
                                    <button onClick={() => removeFile(idx)}><X className="h-4 w-4 text-slate-400 hover:text-red-500" /></button>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            
            {/* STATE 1: IDLE */}
            {caseState.step === 'idle' && (
              <div className="bg-white p-16 rounded-xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Uruchom Agenta Analitycznego</h2>
                <p className="text-slate-500 text-lg mb-8">
                  System uruchomi łańcuch analizy: OCR → Analiza Faktów → Obliczenie Pewności.
                </p>
                <button 
                  onClick={handleRunAnalysis}
                  disabled={uploadedFiles.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-medium text-lg inline-flex items-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                    <Sparkles className="h-6 w-6" />
                    Rozpocznij Analizę Sprawy
                </button>
              </div>
            )}

            {/* STATE 2: PROCESSING */}
            {isProcessing && (
                <div className="py-12">
                    {renderProgress()}
                </div>
            )}

            {/* STATE 3: COMPLETE */}
            {caseState.step === 'complete' && caseState.result && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* MIDDLE COLUMN: Case Data */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-900 px-6 py-3 border-b border-slate-800">
                           <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Dane Sprawy</h3>
                      </div>
                      <div className="p-6">
                           <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                               <div>
                                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Imię i Nazwisko</label>
                                   <div className="font-medium text-slate-900 text-lg">{currentCase?.applicantName}</div>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">PESEL</label>
                                   <div className="font-medium text-slate-900 text-lg">{currentCase?.applicantPesel}</div>
                               </div>
                           </div>
                           
                           <div className="mt-8 pt-6 border-t border-slate-100">
                                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-slate-500" />
                                    Ustalenia faktyczne (AI Summary)
                                </h4>
                                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100">
                                    {caseState.result.summary}
                                </div>
                           </div>
                      </div>
                  </div>
                  
                  {/* ALERTS SECTION */}
                  {(caseState.result.discrepancies?.length > 0 || caseState.result.missing_documents_suggestions?.length > 0 || caseState.result.medical_consultation_needed) && (
                      <div className="space-y-4 mb-6">
                        {caseState.result.medical_consultation_needed && (
                             <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                                <Stethoscope className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-red-900 text-sm">Wymagana konsultacja lekarska</h4>
                                    <p className="text-xs text-red-700 mt-1">
                                        Analiza wykazała wątpliwości medyczne (np. czy uraz jest skutkiem wypadku). 
                                        Zalecane skierowanie do Głównego Lekarza Orzecznika.
                                    </p>
                                </div>
                             </div>
                        )}

                        {caseState.result.missing_documents_suggestions?.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                <h4 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Braki w dokumentacji
                                </h4>
                                <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                                    {caseState.result.missing_documents_suggestions.map((doc: string, i: number) => (
                                        <li key={i}>{doc}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                         {caseState.result.discrepancies?.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                                    <Scale className="h-4 w-4 text-slate-500" /> Wykryte rozbieżności
                                </h4>
                                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                                    {caseState.result.discrepancies.map((d: string, i: number) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                      </div>
                  )}

                  {/* Criteria List */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-semibold text-slate-900 mb-4">Szczegółowa weryfikacja przesłanek</h3>
                      <div className="space-y-3">
                        <CriterionItem label="Nagłość zdarzenia" passed={caseState.result.criteria?.suddenness ?? null} explanation={caseState.result.criteria_explanation?.suddenness} />
                        <CriterionItem label="Przyczyna zewnętrzna" passed={caseState.result.criteria?.externalCause ?? null} explanation={caseState.result.criteria_explanation?.externalCause} />
                        <CriterionItem label="Uraz (potwierdzony medycznie)" passed={caseState.result.criteria?.injury ?? null} explanation={caseState.result.criteria_explanation?.injury} />
                        <CriterionItem label="Związek z pracą" passed={caseState.result.criteria?.workConnection ?? null} explanation={caseState.result.criteria_explanation?.workConnection} />
                      </div>
                  </div>

                  {/* Medical Consultation Panel */}
                   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                             <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                                <Stethoscope className="h-4 w-4" /> Moduł Konsultacji Lekarskich
                             </h3>
                        </div>
                        <div className="p-6">
                            {!medicalOpinion ? (
                                <div>
                                    <div className="flex gap-4 mb-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Pytanie do orzecznika:</label>
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border border-slate-300 rounded text-sm" 
                                                value={doctorQuestion}
                                                onChange={(e) => setDoctorQuestion(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            onClick={runConsultation} 
                                            disabled={isConsulting}
                                            className="self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                                        >
                                            {isConsulting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            Wyślij
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">Skieruj sprawę do wirtualnego orzecznika, jeśli masz wątpliwości co do urazu.</p>
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-1">
                                        <CheckCircle2 className="h-4 w-4" /> Orzeczenie Lekarskie
                                    </div>
                                    <p className="text-sm text-blue-800 italic mb-2">"{medicalOpinion.text}"</p>
                                    <div className="text-xs text-blue-600 font-mono">ICD-10: {medicalOpinion.icd10} • {medicalOpinion.timestamp}</div>
                                </div>
                            )}
                        </div>
                   </div>
                </div>

                {/* RIGHT COLUMN: AI Recommendation & Decision */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* CONFIDENCE CARD */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                         <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
                              <h3 className="font-semibold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-emerald-400" />
                                Rekomendacja AI
                              </h3>
                         </div>
                         <div className="p-6">
                              <div className={`rounded-xl border p-6 mb-6 ${
                                  (caseState.result.calculation?.confidence_score || 0) >= 70 
                                  ? 'bg-emerald-50 border-emerald-200' 
                                  : 'bg-amber-50 border-amber-200'
                              }`}>
                                   <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">REKOMENDACJA</span>
                                            <div className={`text-3xl font-bold ${
                                                (caseState.result.calculation?.confidence_score || 0) >= 70 ? 'text-emerald-700' : 'text-amber-700'
                                            }`}>
                                                {caseState.result.calculation?.recommendation_short}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">PEWNOŚĆ</span>
                                            <div className="text-3xl font-bold text-slate-900">
                                                {caseState.result.calculation?.confidence_score}%
                                            </div>
                                        </div>
                                   </div>
                                   
                                   {/* Progress Bar */}
                                   <div className="w-full bg-white rounded-full h-3 mb-1 overflow-hidden border border-slate-200">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                (caseState.result.calculation?.confidence_score || 0) >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`} 
                                            style={{ width: `${caseState.result.calculation?.confidence_score}%` }}
                                        />
                                   </div>
                              </div>

                              <div className="mb-2">
                                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">?</div>
                                      Uzasadnienie
                                  </h4>
                                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                                      {caseState.result.calculation?.reasoning_short}
                                  </p>
                              </div>
                         </div>
                    </div>

                    {/* DECISION PANEL */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                        <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
                             <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Panel Decyzji</h3>
                             <span className="text-xs text-slate-400">URZĘDNIK: MAREK KOWALCZYK</span>
                        </div>
                        
                        <div className="p-6">
                            {decisionState === 'pending' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => {
                                                setDecisionState('accepted');
                                                toast.success("Rekomendacja AI została zaakceptowana.");
                                            }}
                                            className="flex flex-col items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors gap-2"
                                        >
                                            <CheckCircle2 className="h-6 w-6" />
                                            <span className="font-medium">Akceptuję rekomendację</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => setDecisionState('rejected')}
                                            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-red-100 hover:bg-red-50 text-red-600 rounded-lg transition-colors gap-2"
                                        >
                                            <XCircle className="h-6 w-6" />
                                            <span className="font-medium">Odrzucam / Inna</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                        <button className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-sm font-medium">
                                            <Printer className="h-4 w-4" /> Zapisz szkic
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('opinion')}
                                            className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
                                        >
                                            <FileText className="h-4 w-4" /> Wygeneruj kartę wypadku
                                        </button>
                                    </div>
                                </div>
                            ) : decisionState === 'rejected' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                     <div className="bg-red-50 text-red-800 p-3 rounded text-sm font-medium flex items-center gap-2">
                                        <XCircle className="h-5 w-5" /> Wybrałeś odrzucenie rekomendacji AI.
                                     </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Uzasadnienie zmiany decyzji:
                                        </label>
                                        <textarea 
                                            className="w-full h-24 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                                            placeholder="Podaj powód..."
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                        />
                                     </div>
                                     <button className="w-full py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors">
                                        Zatwierdź decyzję odmowną
                                     </button>
                                     <button onClick={() => setDecisionState('pending')} className="w-full text-sm text-slate-500 hover:text-slate-700">
                                        Anuluj
                                     </button>
                                </div>
                            ) : (
                                <div className="space-y-4 text-center animate-in fade-in zoom-in">
                                     <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                         <Check className="h-8 w-8" />
                                     </div>
                                     <h4 className="text-xl font-bold text-slate-900">Decyzja Zatwierdzona!</h4>
                                     <button onClick={() => setActiveTab('opinion')} className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium">
                                         Przejdź do dokumentów
                                     </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'opinion' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Projekt Opinii Końcowej</h2>
              <textarea 
                className="w-full h-[600px] p-6 border border-slate-200 rounded-lg font-serif text-slate-800 leading-relaxed resize-none"
                value={generateOpinionText()}
                readOnly
             />
          </div>
        )}

        {activeTab === 'card' && (
            <AccidentCardView data={caseState.result?.accident_card_data || {}} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 pb-4 px-2 text-sm font-medium border-b-2 transition-colors relative
        ${active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {icon}
      {label}
      {badge && <span className="ml-1 flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs">{badge}</span>}
    </button>
  );
}

function CriterionItem({ label, passed, explanation }: { label: string, passed: boolean | null, explanation?: string }) {
  const icon = passed === null 
    ? <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
    : passed 
        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
        : <XCircle className="w-5 h-5 text-red-500 fill-red-50" />;

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors group">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {explanation || "Oczekiwanie na analizę..."}
        </p>
      </div>
    </div>
  );
}