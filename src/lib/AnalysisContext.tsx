
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

// Types matches what we expect from backend
interface AIAnalysisResult {
    identified_documents: string[];
    summary: string;
    criteria: {
        suddenness: boolean | null;
        externalCause: boolean | null;
        injury: boolean | null;
        workConnection: boolean | null;
    };
    criteria_explanation: any;
    discrepancies: string[];
    consultations_needed: boolean;
    calculation?: {
        confidence_score: number;
        recommendation_short: string;
        reasoning_short: string;
    };
}

export type AnalysisStep = 'idle' | 'uploading' | 'ocr_processing' | 'legal_analysis' | 'calculating_confidence' | 'complete' | 'error';

interface CaseAnalysisState {
    step: AnalysisStep;
    progress: number; // 0-100
    result: AIAnalysisResult | null;
    files: { name: string; type: string }[]; // Metadata only
    error?: string;
}

interface AnalysisContextType {
    // State storage by Case ID
    casesState: Record<string, CaseAnalysisState>;
    // Actions
    startAnalysis: (caseId: string, files: any[], textInput?: string) => Promise<void>;
    resetAnalysis: (caseId: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [casesState, setCasesState] = useState<Record<string, CaseAnalysisState>>({});

    const updateCaseState = (caseId: string, newState: Partial<CaseAnalysisState>) => {
        setCasesState(prev => ({
            ...prev,
            [caseId]: { ...(prev[caseId] || { step: 'idle', progress: 0, result: null, files: [] }), ...newState }
        }));
    };

    const startAnalysis = useCallback(async (caseId: string, files: any[], textInput?: string) => {
        // 1. Initial State
        updateCaseState(caseId, { 
            step: 'uploading', 
            progress: 10, 
            files: files.map(f => ({ name: f.name, type: f.type })),
            error: undefined 
        });

        try {
            // Prepare payload
            let payload;
            if (files.length > 0) {
                payload = { files: files };
            } else {
                 payload = { type: 'text', content: textInput || "Brak treści" };
            }

            // 2. Simulate OCR Processing (visual feedback while request starts)
            setTimeout(() => updateCaseState(caseId, { step: 'ocr_processing', progress: 30 }), 500);
            
            // 3. Simulate Legal Analysis start
            setTimeout(() => updateCaseState(caseId, { step: 'legal_analysis', progress: 50 }), 2500);

            // ACTUAL BACKEND CALL
            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a27dc869/analyze-case`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // 4. Calculation Phase (just before showing results)
            updateCaseState(caseId, { step: 'calculating_confidence', progress: 85 });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            // Wait a moment for the "Calculating" visual to be seen
            await new Promise(r => setTimeout(r, 800));

            // 5. Complete
            updateCaseState(caseId, { 
                step: 'complete', 
                progress: 100, 
                result: data 
            });
            
            toast.success(`Analiza sprawy ${caseId} zakończona pomyślnie!`, {
                action: {
                    label: 'Pokaż',
                    onClick: () => console.log('Navigate to case') // Navigation handled by UI state usually
                }
            });

        } catch (error: any) {
            console.error(error);
            updateCaseState(caseId, { step: 'error', progress: 0, error: error.message });
            toast.error(`Błąd analizy sprawy ${caseId}: ${error.message}`);
        }
    }, []);

    const resetAnalysis = useCallback((caseId: string) => {
        setCasesState(prev => {
            const newState = { ...prev };
            delete newState[caseId];
            return newState;
        });
    }, []);

    return (
        <AnalysisContext.Provider value={{ casesState, startAnalysis, resetAnalysis }}>
            {children}
        </AnalysisContext.Provider>
    );
}

export function useAnalysis() {
    const context = useContext(AnalysisContext);
    if (!context) throw new Error("useAnalysis must be used within AnalysisProvider");
    return context;
}
