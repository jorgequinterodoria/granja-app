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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

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
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        const targetIds = targetPigs.map(p => p.id);
        const res = await registerFeeding({
            mode,
            foodId: selectedFeedId,
            amount,
            targetIds
        });

        if (res.success) {
            setSuccess(true);
            setAmount('');
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError(res.error);
        }

        setIsSubmitting(false);
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-xl font-bold text-slate-800 mb-6">🍽️ Registrar Alimentación</h2>

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-4 border border-red-200 flex items-start gap-3 animate-shake shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-red-800">Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-secondary-50 text-secondary-500 p-4 rounded-xl mb-4 border border-secondary-200 flex items-start gap-3 animate-slide-up shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-secondary-800">¡Éxito!</p>
                        <p className="text-sm text-secondary-700 mt-1">Alimentación registrada correctamente</p>
                    </div>
                </div>
            )}

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button
                    onClick={() => setMode('batch')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all duration-200 ${mode === 'batch' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    📦 Por Lote / Etapa
                </button>
                <button
                    onClick={() => setMode('individual')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all duration-200 ${mode === 'individual' ? 'bg-white shadow text-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    🐷 Individual
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Mode Specific Selector */}
                {mode === 'batch' ? (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Etapa de Producción</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-slate-400">📊</span>
                            </div>
                            <select
                                value={selectedStage} onChange={e => setSelectedStage(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none hover:border-slate-300"
                            >
                                <option value="Destete">Destete</option>
                                <option value="Levante">Levante</option>
                                <option value="Ceba">Ceba</option>
                                <option value="Reproductor">Reproductor</option>
                            </select>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-right">
                            {targetPigs.length} cerdos seleccionados
                        </p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Cerdo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-slate-400">🐷</span>
                            </div>
                            <select
                                value={selectedPigId} onChange={e => setSelectedPigId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none hover:border-slate-300"
                                required={mode === 'individual'}
                            >
                                <option value="">-- Seleccionar Cerdo --</option>
                                {pigs.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} ({p.numero_arete}) - {p.etapa}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Feed Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Alimento</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400">🌾</span>
                        </div>
                        <select
                            value={selectedFeedId} onChange={e => setSelectedFeedId(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none hover:border-slate-300"
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
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Cantidad TOTAL (Kg)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400">⚖️</span>
                        </div>
                        <input
                            type="number" step="0.01" min="0.1"
                            value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none font-mono hover:border-slate-300"
                            placeholder={mode === 'batch' ? `Total para ${targetPigs.length} cerdos...` : "Cantidad servida..."}
                            required
                        />
                    </div>
                    {mode === 'batch' && amount && targetPigs.length > 0 && (
                        <p className="text-xs text-primary-600 mt-1 font-medium">Promedio: {(amount / targetPigs.length).toFixed(2)} Kg/cerdo</p>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Registrando...</span>
                            </>
                        ) : (
                            <>
                                🍽️ Registrar Alimentación
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
