import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import WeightTracker from './WeightTracker';
import BreedingManager from './BreedingManager';

export default function PigDetail({ pigId, onBack }) {
    const pig = useLiveQuery(() => db.pigs.get(pigId), [pigId]);
    const [activeTab, setActiveTab] = useState('health'); // health, weight, reproduction

    // Live query for health records associated with this pig, ordered by date desc
    const healthRecords = useLiveQuery(
        () => db.health_records
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

    const handleSaveRecord = async (e) => {
        e.preventDefault();
        if (!form.nombre_producto) return;

        try {
            await db.health_records.add({
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
        } catch (error) {
            console.error("Error saving record:", error);
            alert("Error al guardar registro");
        }
    };

    if (!pig) return <div>Cargando...</div>;

    const sortedRecords = healthRecords
        ? [...healthRecords].sort((a, b) => new Date(b.fecha_aplicacion) - new Date(a.fecha_aplicacion))
        : [];

    // Allow reproduction tab for all females (Gilts/Levante + Sows/Reproductor)
    const showReproduction = pig.sexo === 'Hembra';

    return (
        <div className="bg-white rounded-2xl shadow-xl min-h-[50vh]">

            {/* Header / Nav */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        ← Volver
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {pig.nombre || 'Sin Nombre'} <span className="text-slate-400 font-normal">#{pig.numero_arete}</span>
                        </h2>
                        <div className="flex gap-3 text-sm text-slate-500 mt-1">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{pig.sexo}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{pig.etapa}</span>
                            <span>{pig.peso} kg</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'health' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    🏥 Historial Médico
                </button>
                <button
                    onClick={() => setActiveTab('weight')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'weight' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    ⚖️ Engorde y Peso
                </button>
                {showReproduction && (
                    <button
                        onClick={() => setActiveTab('reproduction')}
                        className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reproduction' ? 'border-pink-600 text-pink-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        🧬 Reproducción
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="p-6">

                {/* HEALTH TAB */}
                {activeTab === 'health' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Aplicaciones Recientes</h3>

                            {sortedRecords.length === 0 ? (
                                <p className="text-slate-400 text-sm italic">No hay registros médicos aún.</p>
                            ) : (
                                <div className="space-y-4">
                                    {sortedRecords.map(record => (
                                        <div key={record.id} className="relative pl-6 border-l-2 border-slate-200 pb-2 last:pb-0">
                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${record.tipo_tratamiento === 'Vacuna' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-slate-700">{record.tipo_tratamiento}</span>
                                                    <span className="text-xs text-slate-400">{record.fecha_aplicacion}</span>
                                                </div>
                                                <p className="text-slate-800 mt-1">{record.nombre_producto}</p>
                                                {record.observaciones && (
                                                    <p className="text-slate-500 text-sm mt-1 bg-white p-2 rounded border border-slate-100">{record.observaciones}</p>
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
                        <div className="bg-slate-50 p-6 rounded-xl h-fit">
                            <h3 className="font-bold text-slate-700 mb-4">Nueva Aplicación</h3>
                            <form onSubmit={handleSaveRecord} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tipo</label>
                                    <select
                                        value={form.tipo_tratamiento}
                                        onChange={e => setForm({ ...form, tipo_tratamiento: e.target.value })}
                                        className="w-full p-2 rounded border border-slate-200 bg-white"
                                    >
                                        <option value="Vacuna">Vacuna</option>
                                        <option value="Medicamento">Medicamento</option>
                                        <option value="Vitamina">Vitamina</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Producto</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.nombre_producto}
                                        onChange={e => setForm({ ...form, nombre_producto: e.target.value })}
                                        placeholder="Nombre del producto..."
                                        className="w-full p-2 rounded border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.fecha_aplicacion}
                                        onChange={e => setForm({ ...form, fecha_aplicacion: e.target.value })}
                                        className="w-full p-2 rounded border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Notas</label>
                                    <textarea
                                        value={form.observaciones}
                                        onChange={e => setForm({ ...form, observaciones: e.target.value })}
                                        rows="2"
                                        className="w-full p-2 rounded border border-slate-200"
                                    ></textarea>
                                </div>
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95">
                                    Guardar Registro
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
