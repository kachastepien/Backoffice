
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MOCK_CASES, Case } from './types';
import { toast } from 'sonner';

interface CaseContextType {
    cases: Case[];
    addCase: (newCase: Omit<Case, 'id' | 'status' | 'sla'>) => string;
    getCase: (id: string) => Case | undefined;
    updateCaseStatus: (id: string, status: Case['status']) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
    // Start with MOCK_CASES but allow adding new ones
    const [cases, setCases] = useState<Case[]>(MOCK_CASES);

    const addCase = (caseData: Omit<Case, 'id' | 'status' | 'sla'>) => {
        const newId = crypto.randomUUID();
        const newCase: Case = {
            id: newId,
            ...caseData,
            status: 'new',
            sla: '48h', // Default SLA
            riskScore: 0 // Default risk
        };
        
        setCases(prev => [newCase, ...prev]);
        toast.success("Utworzono nową sprawę");
        return newId;
    };

    const getCase = (id: string) => {
        return cases.find(c => c.id === id);
    };

    const updateCaseStatus = (id: string, status: Case['status']) => {
        setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    };

    return (
        <CaseContext.Provider value={{ cases, addCase, getCase, updateCaseStatus }}>
            {children}
        </CaseContext.Provider>
    );
}

export function useCases() {
    const context = useContext(CaseContext);
    if (!context) throw new Error("useCases must be used within CaseProvider");
    return context;
}
