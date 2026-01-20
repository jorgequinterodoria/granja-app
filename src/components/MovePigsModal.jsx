import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { syncService } from '../services/syncService';

const MovePigsModal = ({ isOpen, onClose, selectedPigIds, onSuccess }) => {
    // Hooks must be called unconditionally
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedPenId, setSelectedPenId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries
    const sections = useLiveQuery(async () => {
        const allSections = await db.sections.toArray();
        return allSections.filter(s => !s.deleted_at);
    }) || [];

    // Load all pens and filter in memory to avoid Index/Type issues
    const allPens = useLiveQuery(() => db.pens.toArray()) || [];
    
    const availablePens = allPens.filter(p => {
        if (p.deleted_at) return false;
        if (!selectedSectionId) return false;
        // Loose comparison (==) handles string/number mismatch
        return p.section_id == selectedSectionId;
    });

    // Capacity Check
    const targetPen = availablePens.find(p => p.id == selectedPenId);
    
    const pigsInTargetPen = useLiveQuery(async () => {
        if (!selectedPenId) return 0;
        
        try {
            // Load all pigs and filter in JS to avoid any index/type issues
            const allPigs = await db.pigs.toArray();
            
            // Loose comparison (==) for pen_id to handle string vs number mismatch
            const pigsInPen = allPigs.filter(p => 
                !p.deleted_at && 
                p.pen_id == selectedPenId // Removed strict status check to debug
            );
            
            return pigsInPen.length;
        } catch (e) {
            console.warn("Error counting pigs in pen:", e);
            return 0;
        }
    }, [selectedPenId]);

    // Render logic moved after hooks
    if (!isOpen) return null;

    // Safety fallback
    const currentOccupancy = typeof pigsInTargetPen === 'number' ? pigsInTargetPen : 0;
    const capacity = targetPen?.capacity || 0;
    const moveCount = selectedPigIds.length;
    const newOccupancy = currentOccupancy + moveCount;
    const isOverCapacity = selectedPenId && (newOccupancy > capacity);

    // Handlers
    const handleSubmit = async () => {
        if (!selectedPenId || isOverCapacity) return;

        setIsSubmitting(true);
        try {
            const updates = selectedPigIds.map(id => ({
                key: id, // Dexie update takes key as first arg
                changes: {
                    pen_id: selectedPenId, // Store as is (string or number), do NOT force parseInt which breaks UUIDs
                    updated_at: new Date().toISOString(),
                    syncStatus: 'pending'
                }
            }));

            await db.transaction('rw', db.pigs, async () => {
                for (const update of updates) {
                    await db.pigs.update(update.key, update.changes);
                }
            });

            // Trigger sync in background
            syncService.sync();

            onSuccess();
            onClose();
            
            // Force reload if necessary (though liveQuery should handle it)
            // window.location.reload(); 
        } catch (error) {
            console.error("Error moving pigs:", error);
            alert("Error al mover los cerdos. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Mover Animales</h2>
                        <p className="text-sm text-slate-500">Seleccionados: <span className="font-bold text-primary-600">{moveCount}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Section Select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Sección Destino</label>
                        <select
                            value={selectedSectionId}
                            onChange={(e) => {
                                setSelectedSectionId(e.target.value);
                                setSelectedPenId('');
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        >
                            <option value="">Seleccionar Sección...</option>
                            {sections.map(section => (
                                <option key={section.id} value={section.id}>{section.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pen Select */}
                    <div className={!selectedSectionId ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Corral Destino</label>
                        <select
                            value={selectedPenId}
                            onChange={(e) => setSelectedPenId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        >
                            <option value="">Seleccionar Corral...</option>
                            {availablePens.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(pen => (
                                <option key={pen.id} value={pen.id}>{pen.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Capacity Indicator */}
                    {selectedPenId && targetPen && (
                        <div className={`p-4 rounded-xl border ${isOverCapacity ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-sm font-bold ${isOverCapacity ? 'text-red-700' : 'text-emerald-700'}`}>
                                    Capacidad del Corral
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isOverCapacity ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'}`}>
                                    {isOverCapacity ? 'Sobrecupo' : 'Disponible'}
                                </span>
                            </div>
                            
                            <div className="w-full bg-white/50 rounded-full h-2.5 mb-2 overflow-hidden">
                                <div 
                                    className={`h-2.5 rounded-full ${isOverCapacity ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.min((newOccupancy / capacity) * 100, 100)}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">
                                    Actual: <strong>{currentOccupancy}</strong> + Mover: <strong>{moveCount}</strong>
                                </span>
                                <span className="font-bold text-slate-700">
                                    Total: {newOccupancy} / {capacity}
                                </span>
                            </div>

                            {isOverCapacity && (
                                <p className="text-xs text-red-600 mt-2 font-medium">
                                    ⚠️ No hay espacio suficiente para mover estos cerdos.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedPenId || isOverCapacity || isSubmitting}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                    >
                        {isSubmitting ? 'Moviendo...' : 'Confirmar Movimiento'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MovePigsModal;
