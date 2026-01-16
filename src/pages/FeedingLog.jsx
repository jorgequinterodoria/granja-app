import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useInventory } from '../hooks/useInventory';

const FeedingLog = () => {
    const sections = useLiveQuery(() => db.sections.toArray());
    const pens = useLiveQuery(() => db.pens.toArray());
    const { inventory, recordConsumption } = useInventory();

    const [sectionId, setSectionId] = useState('');
    const [penId, setPenId] = useState('');
    const [feedId, setFeedId] = useState('');
    const [totalAmount, setTotalAmount] = useState('');

    // Get pigs in selected pen
    const activePigs = useLiveQuery(
        () => penId ? db.pigs.where({ pen_id: parseInt(penId), status: 'Activo' }).toArray() : [],
        [penId]
    );

    const filteredPens = pens?.filter(p => p.section_id == sectionId);

    const handleMassFeed = async (e) => {
        e.preventDefault();
        if (!activePigs || activePigs.length === 0) return alert('No hay cerdos activos en este chiquero');
        if (!feedId || !totalAmount) return alert('Complete los datos');

        try {
            const amountPerPig = parseFloat(totalAmount) / activePigs.length;

            // We record individual consumption for better analytics (Profitability per pig)
            // BUT we also need to decrement stock only ONCE from inventory? 
            // The hook `recordConsumption` handles both: decrement stock and log usage.
            // If we call it N times, it will decrement N times.
            // So we must be careful.
            // Better approach: 
            // 1. Decrement TOTAL from inventory manually or via a special bulk method in hook.
            // 2. Add N usage records.
            // Let's rely on the hook calling loop for now, but ensure concurrency doesn't invalid stock check?
            // JS is single threaded so promises will run sequentially or we await them.

            // Optimized: Create a Bulk consumption method in hook?
            // For now, let's just loop and await. It's safe enough for small farms.

            // CONFIRMATION
            if (!window.confirm(`¿Alimentar ${activePigs.length} cerdos con ${amountPerPig.toFixed(2)}kg cada uno?`)) return;

            for (const pig of activePigs) {
                await recordConsumption(feedId, amountPerPig, pig.id, parseInt(penId));
            }

            alert('Alimentación masiva registrada correctamente');
            setTotalAmount('');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-white mb-8">Registro de Alimentación</h2>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-emerald-400">Modo Masivo (Por Lote)</h3>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs uppercase tracking-wider">Ahorra Tiempo</span>
                </div>

                <form onSubmit={handleMassFeed} className="space-y-6">
                    {/* Location Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-slate-400 text-sm">Sección</label>
                            <select
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white mt-1"
                                onChange={e => setSectionId(e.target.value)}
                            >
                                <option value="">Seleccionar ubicación...</option>
                                {sections?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-sm">Chiquero</label>
                            <select
                                disabled={!sectionId}
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white mt-1 disabled:opacity-50"
                                onChange={e => setPenId(e.target.value)}
                            >
                                <option value="">Seleccionar chiquero...</option>
                                {filteredPens?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Pig Count Info */}
                    {penId && (
                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg flex items-center gap-3">
                            <div className="text-2xl font-bold text-blue-400">{activePigs?.length || 0}</div>
                            <div className="text-sm text-blue-200">
                                Cerdos activos en este chiquero. <br />
                                <span className="opacity-70">El alimento se dividirá equitativamente.</span>
                            </div>
                        </div>
                    )}

                    {/* Feed & Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-slate-400 text-sm">Alimento</label>
                            <select
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white mt-1"
                                onChange={e => setFeedId(e.target.value)}
                            >
                                <option value="">Seleccionar alimento...</option>
                                {inventory?.map(i => (
                                    <option key={i.id} value={i.id}>{i.name} (Stock: {i.current_stock}kg)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-sm">Cantidad TOTAL (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white mt-1"
                                placeholder="Ej: 50"
                                value={totalAmount}
                                onChange={e => setTotalAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!activePigs?.length}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        Distribuir Alimento
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FeedingLog;
