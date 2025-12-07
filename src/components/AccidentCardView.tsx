
import React from 'react';
import { FileText, Download, Printer, Save } from 'lucide-react';

interface AccidentCardData {
    accident_date?: string;
    accident_place?: string;
    victim_name?: string;
    victim_pesel?: string;
    circumstances?: string;
    causes?: string;
    effects?: string;
}

interface AccidentCardViewProps {
    data: AccidentCardData;
}

export function AccidentCardView({ data }: AccidentCardViewProps) {
    return (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Karta Wypadku</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Zgodnie z rozporządzeniem Ministra Rodziny i Polityki Społecznej (Dz.U. 2022)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition-colors">
                        <Save className="h-4 w-4" /> Zapisz
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors">
                        <Download className="h-4 w-4" /> PDF
                    </button>
                </div>
            </div>

            <div className="space-y-8 font-serif text-slate-800">
                {/* Section I */}
                <section>
                    <h3 className="font-bold border-b border-slate-300 mb-4 pb-1 uppercase text-sm tracking-wide">I. Dane płatnika składek</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                            <label className="text-xs text-slate-500 block mb-1">Nazwa / Imię i Nazwisko</label>
                            <input type="text" className="w-full bg-transparent font-medium focus:outline-none" defaultValue="Firma Budowlana PRO-BUD Sp. z o.o." />
                        </div>
                         <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                            <label className="text-xs text-slate-500 block mb-1">NIP</label>
                            <input type="text" className="w-full bg-transparent font-medium focus:outline-none" defaultValue="123-456-78-90" />
                        </div>
                    </div>
                </section>

                {/* Section II */}
                <section>
                    <h3 className="font-bold border-b border-slate-300 mb-4 pb-1 uppercase text-sm tracking-wide">II. Dane poszkodowanego</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                            <label className="text-xs text-slate-500 block mb-1">Imię i Nazwisko</label>
                            <input type="text" className="w-full bg-transparent font-medium focus:outline-none" defaultValue={data.victim_name || ""} />
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                            <label className="text-xs text-slate-500 block mb-1">PESEL / Data Urodzenia</label>
                            <input type="text" className="w-full bg-transparent font-medium focus:outline-none" defaultValue={data.victim_pesel || ""} />
                        </div>
                    </div>
                </section>

                {/* Section III */}
                <section>
                    <h3 className="font-bold border-b border-slate-300 mb-4 pb-1 uppercase text-sm tracking-wide">III. Informacje o wypadku</h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                                <label className="text-xs text-slate-500 block mb-1">Data Wypadku</label>
                                <input type="date" className="w-full bg-transparent font-medium focus:outline-none" defaultValue={data.accident_date || ""} />
                            </div>
                             <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                                <label className="text-xs text-slate-500 block mb-1">Miejsce Wypadku</label>
                                <input type="text" className="w-full bg-transparent font-medium focus:outline-none" defaultValue={data.accident_place || ""} />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                             <label className="text-xs text-slate-500 block mb-2 font-bold">Okoliczności wypadku:</label>
                             <textarea 
                                className="w-full bg-transparent focus:outline-none min-h-[100px] text-sm leading-relaxed resize-none"
                                defaultValue={data.circumstances || "Brak danych..."}
                             />
                        </div>

                         <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                             <label className="text-xs text-slate-500 block mb-2 font-bold">Przyczyny wypadku:</label>
                             <textarea 
                                className="w-full bg-transparent focus:outline-none min-h-[60px] text-sm leading-relaxed resize-none"
                                defaultValue={data.causes || "Brak danych..."}
                             />
                        </div>

                         <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                             <label className="text-xs text-slate-500 block mb-2 font-bold">Skutki wypadku (uraz):</label>
                             <textarea 
                                className="w-full bg-transparent focus:outline-none min-h-[60px] text-sm leading-relaxed resize-none"
                                defaultValue={data.effects || "Brak danych..."}
                             />
                        </div>
                    </div>
                </section>

                {/* Section IV & V */}
                 <section className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                    <h3 className="font-bold text-amber-900 mb-2">IV. Kwalifikacja Prawna</h3>
                    <p className="text-sm text-amber-800 mb-4">
                        Zdarzenie <span className="font-bold">ZOSTAŁO / NIE ZOSTAŁO</span> uznane za wypadek przy pracy.
                    </p>
                    
                    <h3 className="font-bold text-amber-900 mb-2">V. Uzasadnienie</h3>
                    <p className="text-sm text-amber-800 italic">
                        Patrz załącznik: Opinia Prawna ZUS/2024/...
                    </p>
                </section>
            </div>
        </div>
    );
}
