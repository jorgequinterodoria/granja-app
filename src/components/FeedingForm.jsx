import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useInventory } from '../hooks/useInventory';
import { useFeeding } from '../hooks/useFeeding';

export default function FeedingForm() {
    const { inventory } = useInventory();
    const { registerFeeding } = useFeeding();
    const pigs = useLiveQuery(() => db.pigs.where('status').equals('Activo').toArray(), []) || [];

    const [mode, setMode] = useState('batch'); // 'batch' or 'individual'

    // Form Inputs
    const [selectedStage, setSelectedStage] = useState('Levante'); // For Batch
    const [selectedPigId, setSelectedPigId] = useState(''); // For Individual
    const [selectedFeedId, setSelectedFeedId] = useState('');
    const [amount, setAmount] = useState('');

    // Filter Logic
    const targetPigs = mode === 'batch'
        ? pigs.filter(p => p.etapa === selectedStage)
        : pigs.filter(p => p.id === selectedPigId);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const targetIds = targetPigs.map(p => p.id);
        const res = await registerFeeding({
            mode,
            foodId: selectedFeedId,
            amount,
            targetIds
        });

        if (res.success) {
            alert("🍽️ Alimentación registrada correctamente");
            setAmount('');
        } else {
            alert("❌ Error: " + res.error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-xl font-bold text-slate-800 mb-6">🍽️ Registrar Alimentación</h2>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button
                    onClick={() => setMode('batch')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${mode === 'batch' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    📦 Por Lote / Etapa
                </button>
                <button
                    onClick={() => setMode('individual')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${mode === 'individual' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🐷 Individual
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Mode Specific Selector */}
                {mode === 'batch' ? (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Etapa de Producción</label>
                        <select
                            value={selectedStage} onChange={e => setSelectedStage(e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50"
                        >
                            <option value="Destete">Destete</option>
                            <option value="Levante">Levante</option>
                            <option value="Ceba">Ceba</option>
                            <option value="Reproductor">Reproductor</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1 text-right">
                            {targetPigs.length} cerdos seleccionados
                        </p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Cerdo</label>
                        <select
                            value={selectedPigId} onChange={e => setSelectedPigId(e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50"
                            required={mode === 'individual'}
                        >
                            <option value="">-- Seleccionar Cerdo --</option>
                            {pigs.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} ({p.numero_arete}) - {p.etapa}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Feed Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Alimento</label>
                    <select
                        value={selectedFeedId} onChange={e => setSelectedFeedId(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-200"
                        required
                    >
                        <option value="">-- Seleccionar del Inventario --</option>
                        {inventory.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} (Stock: {item.current_stock_kg}kg)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Cantidad TOTAL (Kg)
                    </label>
                    <input
                        type="number" step="0.01" min="0.1"
                        value={amount} onChange={e => setAmount(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-200 font-mono"
                        placeholder={mode === 'batch' ? `Total para ${targetPigs.length} cerdos...` : "Cantidad servida..."}
                        required
                    />
                    {mode === 'batch' && amount && targetPigs.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">Promedio: {(amount / targetPigs.length).toFixed(2)} Kg/cerdo</p>
                    )}
                </div>

                <div className="pt-2">
                    <button className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">
                        🍽️ Registrar Alimentación
                    </button>
                </div>

            </form>
        </div>
    );
}
