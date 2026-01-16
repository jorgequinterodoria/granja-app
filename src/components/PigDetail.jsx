import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import WeightTracker from './WeightTracker';
import BreedingManager from './BreedingManager';
import Spinner from './Spinner';

import CostDashboard from './CostDashboard';

export default function PigDetail({ pigId, onBack }) {
    const pig = useLiveQuery(() => db.pigs.get(pigId), [pigId]);
    const [activeTab, setActiveTab] = useState('health'); // health, weight, reproduction

    // Live query for health records associated with this pig, ordered by date desc
    const healthRecords = useLiveQuery(
        () => db.health_events
            .where('pig_id')
            .equals(pigId)
            .toArray()
        , [pigId]);

    const [form, setForm] = useState({
        tipo_tratamiento: 'Vacuna',
        nombre_producto: '',
        fecha_aplicacion: new Date().toISOString().split('T')[0],
        observaciones: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSaveRecord = async (e) => {
        e.preventDefault();
        if (!form.nombre_producto) return;

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await db.health_events.add({
                id: uuidv4(),
                pig_id: pigId,
                ...form,
                syncStatus: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            setForm({
                tipo_tratamiento: 'Vacuna',
                nombre_producto: '',
                fecha_aplicacion: new Date().toISOString().split('T')[0],
                observaciones: ''
            });
            setSuccess(true);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving record:", error);
            setError("Error al guardar registro");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!pig) return <div>Cargando...</div>;

    const sortedRecords = healthRecords
        ? [...healthRecords].sort((a, b) => new Date(b.fecha_aplicacion) - new Date(a.fecha_aplicacion))
        : [];

    // Allow reproduction tab for all females (Gilts/Levante + Sows/Reproductor)
    const showReproduction = pig.sexo === 'Hembra';

    return (
        <div className="bg-white rounded-2xl shadow-xl min-h-[50vh] space-y-6">

            {/* Header / Nav */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/80 rounded-full transition-all duration-200 text-slate-600 hover:text-primary-600 hover:scale-105"
                    >
                        ← Volver
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            #{pig.numero_arete} 
                        </h2>
                        <div className="flex gap-3 text-sm text-slate-500 mt-1">
                            <span className="bg-white/80 px-3 py-1 rounded-full text-slate-600 font-medium shadow-sm">{pig.sexo}</span>
                            <span className="bg-white/80 px-3 py-1 rounded-full text-slate-600 font-medium shadow-sm">{pig.etapa}</span>
                            <span className="font-semibold">{pig.peso} kg</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profitability Dashboard */}
            <div className="px-6">
                <CostDashboard pigId={pigId} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'health' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    🏥 Historial Médico
                </button>
                <button
                    onClick={() => setActiveTab('weight')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'weight' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    ⚖️ Engorde y Peso
                </button>
                {showReproduction && (
                    <button
                        onClick={() => setActiveTab('reproduction')}
                        className={`px-6 py-4 font-medium text-sm border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === 'reproduction' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        🧬 Reproducción
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="p-4 md:p-6">

                {/* HEALTH TAB */}
                {activeTab === 'health' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Aplicaciones Recientes</h3>

                            {sortedRecords.length === 0 ? (
                                <p className="text-slate-400 text-sm italic">No hay registros médicos aún.</p>
                            ) : (
                                <div className="space-y-4">
                                    {sortedRecords.map(record => (
                                        <div key={record.id} className="relative pl-6 border-l-2 border-primary-200 pb-2 last:pb-0">
                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-md ${record.tipo_tratamiento === 'Vacuna' ? 'bg-primary-400' : 'bg-secondary-400'}`}></div>
                                            <div className="glass-card p-4 rounded-xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-slate-700">{record.tipo_tratamiento}</span>
                                                    <span className="text-xs text-slate-400">{record.fecha_aplicacion}</span>
                                                </div>
                                                <p className="text-slate-800 mt-1 font-medium">{record.nombre_producto}</p>
                                                {record.observaciones && (
                                                    <p className="text-slate-500 text-sm mt-2 bg-white/60 p-2 rounded-lg border border-slate-100">{record.observaciones}</p>
                                                )}
                                                <div className="mt-2 text-right">
                                                    <span className="text-[10px] text-slate-400">
                                                        {record.syncStatus === 'synced' ? '☁️ Sincronizado' : '⏳ Pendiente'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Form to Add New */}
                        <div className="glass-card p-6 rounded-xl h-fit shadow-lg">
                            <h3 className="font-bold text-slate-700 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Nueva Aplicación</h3>

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
                                        <p className="text-sm text-secondary-700 mt-1">Registro de salud guardado correctamente</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSaveRecord} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tipo</label>
                                    <select
                                        value={form.tipo_tratamiento}
                                        onChange={e => setForm({ ...form, tipo_tratamiento: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                    >
                                        <option value="Vacuna">Vacuna</option>
                                        <option value="Medicamento">Medicamento</option>
                                        <option value="Vitamina">Vitamina</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Producto</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.nombre_producto}
                                        onChange={e => setForm({ ...form, nombre_producto: e.target.value })}
                                        placeholder="Nombre del producto..."
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.fecha_aplicacion}
                                        onChange={e => setForm({ ...form, fecha_aplicacion: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Notas</label>
                                    <textarea
                                        value={form.observaciones}
                                        onChange={e => setForm({ ...form, observaciones: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none resize-none"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Spinner size="sm" color="white" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        'Guardar Registro'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* WEIGHT TAB */}
                {activeTab === 'weight' && (
                    <WeightTracker pigId={pigId} />
                )}

                {/* REPRODUCTION TAB */}
                {activeTab === 'reproduction' && showReproduction && (
                    <BreedingManager pigId={pigId} />
                )}

            </div>
        </div>
    );
}
