import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import PigListSkeleton from './PigListSkeleton';
import ScrollReveal from './ScrollReveal';
import SanitaryAlert from './SanitaryAlert';
import MovePigsModal from './MovePigsModal';

export default function PigList({ onSelectPig }) {
    const [selectedPigs, setSelectedPigs] = useState(new Set());
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

    const allPigs = useLiveQuery(() => db.pigs.toArray());
    const pens = useLiveQuery(() => db.pens.toArray());
    const sections = useLiveQuery(() => db.sections.toArray());
    
    // Fetch active health withdrawals
    const activeWithdrawals = useLiveQuery(() => 
        db.health_events
            .filter(h => h.withdrawal_end_date)
            .toArray()
    );

    // Map pig_id -> max withdrawal date
    const withdrawalMap = {};
    if (activeWithdrawals) {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        activeWithdrawals.forEach(h => {
            const end = new Date(h.withdrawal_end_date);
            end.setHours(0,0,0,0);
            
            if (end >= today) {
                if (!withdrawalMap[h.pig_id] || end > new Date(withdrawalMap[h.pig_id])) {
                    withdrawalMap[h.pig_id] = h.withdrawal_end_date;
                }
            }
        });
    }

    const pigs = allPigs?.filter(p => !p.deleted_at);

    if (!pigs) return <PigListSkeleton />;

    if (pigs.length === 0) {
        return (
            <div className="text-center p-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg border border-slate-200 mt-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <p className="text-slate-600 font-medium text-lg">No hay cerdos registrados aún</p>
                <p className="text-slate-400 text-sm mt-2">Comienza agregando tu primer animal</p>
            </div>
        );
    }

    // Sort by updated_at desc (newest first)
    const sortedPigs = [...pigs].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const getUbicacion = (pig) => {
        if (!pig.pen_id) return 'Sin ubicación';
        // Use loose comparison for ID matching
        const pen = pens?.find(p => p.id == pig.pen_id);
        if (!pen) return 'Ubicación desconocida';
        
        const section = sections?.find(s => s.id == pen.section_id);
        return `${section?.name || 'Sección ?'} - ${pen.name}`;
    };

    const toggleSelection = (id) => {
        const newSelection = new Set(selectedPigs);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedPigs(newSelection);
    };

    const clearSelection = () => setSelectedPigs(new Set());

    return (
        <div className="mt-12 relative">
            {/* Floating Action Bar for Bulk Actions */}
            <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${selectedPigs.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6">
                    <span className="font-bold text-sm">
                        {selectedPigs.size} {selectedPigs.size === 1 ? 'cerdo seleccionado' : 'cerdos seleccionados'}
                    </span>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <button 
                        onClick={() => setIsMoveModalOpen(true)}
                        className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Mover
                    </button>
                    <button 
                        onClick={clearSelection}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-6 px-2">Animales Registrados ({pigs.length})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {sortedPigs.map((pig, index) => (
                    <ScrollReveal key={pig.id} delay={index * 100}>
                        <div
                            onClick={() => onSelectPig && onSelectPig(pig.id)}
                            className={`group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden border ${selectedPigs.has(pig.id) ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-100 hover:border-primary-200'} hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]`}
                        >
                            {/* Checkbox for Selection */}
                            <div 
                                onClick={(e) => { e.stopPropagation(); toggleSelection(pig.id); }}
                                className="absolute top-4 right-4 z-10"
                            >
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${selectedPigs.has(pig.id) ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-200 group-hover:border-primary-300'}`}>
                                    {selectedPigs.has(pig.id) && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Gradient Accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-400"></div>

                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-1 bottom-0 w-1 transition-all duration-300 ${pig.syncStatus === 'synced' ? 'bg-secondary-400' : 'bg-accent-400'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2 group-hover:text-primary-600 transition-colors duration-200">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 text-sm font-semibold">
                                            🐷
                                        </span>
                                        {pig.tag_number || pig.numero_arete}
                                        {/* Sanitary Alert Icon */}
                                        <SanitaryAlert withdrawalEndDate={withdrawalMap[pig.id]} />
                                    </h3>
                                    {pig.nombre && (
                                        <p className="text-sm font-medium text-slate-500 mt-1 ml-10">{pig.nombre}</p>
                                    )}
                                    <span className="inline-block mt-2 text-xs font-semibold text-primary-600 uppercase tracking-wider px-3 py-1 rounded-full bg-primary-50 border border-primary-100">
                                        {pig.stage || pig.etapa}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition-all duration-200 ${(pig.sex || pig.sexo) === 'Macho'
                                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-gradient-to-br from-pink-50 to-pink-100 text-pink-700 border border-pink-200'
                                        }`}>
                                        {(pig.sex || pig.sexo) === 'Macho' ? '♂' : '♀'} {pig.sex || pig.sexo}
                                    </span>
                                </div>
                            </div>

                            {/* Location Badge */}
                            <div className="mt-4 flex items-center text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium truncate">{getUbicacion(pig)}</span>
                            </div>

                            <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-100 to-secondary-200">
                                        <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Peso Actual</p>
                                        <p className="font-bold text-lg text-slate-800">{pig.weight || pig.peso} <span className="text-sm font-normal text-slate-500">kg</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5" title={pig.syncStatus === 'synced' ? "Sincronizado" : "Pendiente de subir"}>
                                    {pig.syncStatus === 'synced' ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-700 px-3 py-1.5 rounded-lg bg-gradient-to-br from-secondary-50 to-secondary-100 border border-secondary-200 shadow-sm">
                                            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                                            </svg>
                                            Sync
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700 px-3 py-1.5 rounded-lg bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200 shadow-sm animate-pulse">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            Pendiente
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                ))}
            </div>

            <MovePigsModal 
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                selectedPigIds={Array.from(selectedPigs)}
                onSuccess={() => {
                    clearSelection();
                    // Optionally show a toast here
                }}
            />
        </div>
    );
}
