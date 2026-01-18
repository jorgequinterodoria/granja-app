import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, queueChange, generateId } from '../db';
import { useAuth } from '../auth/AuthProvider';
import BreedingManager from './BreedingManager';

const PigDetail = ({ pigId, onBack }) => {
    const { hasPermission } = useAuth();
    const pig = useLiveQuery(() => db.pigs.get(pigId), [pigId]);
    const pen = useLiveQuery(() => pig?.pen_id ? db.pens.get(pig.pen_id) : null, [pig?.pen_id]);
    const section = useLiveQuery(() => pen?.section_id ? db.sections.get(pen.section_id) : null, [pen?.section_id]);
    const weightLogs = useLiveQuery(() => 
        db.weight_logs
            .where('pig_id').equals(pigId)
            .reverse()
            .sortBy('date')
        , [pigId]);

    const healthEvents = useLiveQuery(() =>
        db.health_events
            .where('pig_id').equals(pigId)
            .reverse()
            .sortBy('date')
        , [pigId]);

    // Fetch Medications
    const medications = useLiveQuery(() => db.medications.toArray());

    const [activeTab, setActiveTab] = useState('info'); // info | health | growth | reproduction
    const [weightForm, setWeightForm] = useState({ weight: '', date: new Date().toISOString().split('T')[0] });
    const [healthForm, setHealthForm] = useState({ 
        type: 'Vacunación', 
        description: '', 
        date: new Date().toISOString().split('T')[0], 
        cost: '',
        medication_id: '',
        withdrawal_end_date: ''
    });

    if (!pig) return null;

    const handleAddWeight = async (e) => {
        e.preventDefault();
        if (!weightForm.weight) return;

        const newLog = {
            id: generateId(),
            pig_id: pigId,
            weight: parseFloat(weightForm.weight),
            date: weightForm.date,
            syncStatus: 'pending'
        };

        await db.weight_logs.add(newLog);

        // Update pig current weight
        await db.pigs.update(pigId, {
            weight: parseFloat(weightForm.weight),
            updated_at: new Date().toISOString(),
            syncStatus: 'pending'
        });

        setWeightForm({ weight: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleMedicationChange = (e) => {
        const medId = e.target.value;
        let withdrawalDate = '';

        if (medId) {
            const med = medications?.find(m => m.id === medId);
            if (med && med.withdrawal_days > 0) {
                const date = new Date(healthForm.date);
                date.setDate(date.getDate() + med.withdrawal_days);
                withdrawalDate = date.toISOString().split('T')[0];
            }
        }

        setHealthForm({
            ...healthForm,
            medication_id: medId,
            withdrawal_end_date: withdrawalDate
        });
    };
    
    // Update withdrawal date if event date changes
    const handleDateChange = (e) => {
        const newDate = e.target.value;
        let withdrawalDate = healthForm.withdrawal_end_date;

        if (healthForm.medication_id) {
            const med = medications?.find(m => m.id === healthForm.medication_id);
            if (med && med.withdrawal_days > 0) {
                const d = new Date(newDate);
                d.setDate(d.getDate() + med.withdrawal_days);
                withdrawalDate = d.toISOString().split('T')[0];
            }
        }
        
        setHealthForm({
            ...healthForm,
            date: newDate,
            withdrawal_end_date: withdrawalDate
        });
    };

    const handleAddHealth = async (e) => {
        e.preventDefault();
        const newEvent = {
            id: generateId(),
            pig_id: pigId,
            type: healthForm.type,
            description: healthForm.description,
            date: healthForm.date,
            cost: parseFloat(healthForm.cost) || 0,
            medication_id: healthForm.medication_id || null,
            withdrawal_end_date: healthForm.withdrawal_end_date || null,
            syncStatus: 'pending'
        };

        await db.health_events.add(newEvent);
        setHealthForm({ 
            type: 'Vacunación', 
            description: '', 
            date: new Date().toISOString().split('T')[0], 
            cost: '',
            medication_id: '',
            withdrawal_end_date: ''
        });
    };

    const handleDeletePig = async () => {
        if (confirm('¿Estás seguro de eliminar este cerdo?')) {
            await db.pigs.update(pigId, {
                deleted_at: new Date().toISOString(),
                syncStatus: 'pending'
            });
            onBack();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 font-medium transition-colors mb-4">
                ← Volver a la lista
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🐷</span>
                        <h1 className="text-3xl font-black text-slate-800">{pig.tag_number}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pig.sex === 'Macho' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {pig.sex}
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded text-sm">📍 {section?.name || '...'} - {pen?.name || '...'}</span>
                        <span className="text-slate-300">•</span>
                        <span>{pig.stage}</span>
                    </p>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Peso Actual</p>
                        <p className="text-3xl font-bold text-slate-800">{pig.weight} <span className="text-lg text-slate-400 font-normal">kg</span></p>
                    </div>
                    {hasPermission('pig.delete') && (
                        <button 
                            onClick={handleDeletePig}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-colors"
                            title="Eliminar Cerdo"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-slate-800 p-1 rounded-xl inline-flex shadow-inner">
                {['info', 'growth', 'health', 'reproduction'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                            activeTab === tab 
                                ? 'bg-white text-slate-800 shadow-md transform scale-105' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab === 'info' && '📋 Info'}
                        {tab === 'growth' && '📈 Crecimiento'}
                        {tab === 'health' && '💉 Salud'}
                        {tab === 'reproduction' && '🧬 Reproducción'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
                
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 border-b pb-2">Datos Generales</h3>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div className="text-slate-500">Fecha Nacimiento</div>
                                <div className="font-medium">{pig.birth_date || 'No registrada'}</div>
                                
                                <div className="text-slate-500">Fecha Ingreso</div>
                                <div className="font-medium">{pig.entry_date || 'No registrada'}</div>
                                
                                <div className="text-slate-500">Edad Aprox.</div>
                                <div className="font-medium">
                                    {pig.birth_date 
                                        ? Math.floor((new Date() - new Date(pig.birth_date)) / (1000 * 60 * 60 * 24 * 30)) + ' meses' 
                                        : '-'}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                             <h3 className="font-bold text-slate-700 border-b pb-2">Genética</h3>
                             <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div className="text-slate-500">Padre</div>
                                <div className="font-medium">{pig.father_id ? 'Registrado' : 'Desconocido'}</div>

                                <div className="text-slate-500">Madre</div>
                                <div className="font-medium">{pig.mother_id ? 'Registrado' : 'Desconocido'}</div>

                                <div className="text-slate-500">Puntaje Genético</div>
                                <div className="font-medium">
                                    {pig.genetics_score ? (
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            pig.genetics_score >= 80 ? 'bg-green-100 text-green-700' : 
                                            pig.genetics_score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {pig.genetics_score}/100
                                        </span>
                                    ) : '-'}
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'growth' && (
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-700 mb-4">Historial de Peso</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {weightLogs?.map(log => (
                                    <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-slate-500 text-sm">{log.date}</span>
                                        <span className="font-bold text-slate-800">{log.weight} kg</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-full md:w-80 bg-slate-50 p-6 rounded-xl h-fit">
                            <h3 className="font-bold text-slate-700 mb-4">Registrar Peso</h3>
                            <form onSubmit={handleAddWeight} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-2 rounded-lg border border-slate-200"
                                        value={weightForm.date}
                                        onChange={e => setWeightForm({...weightForm, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        className="w-full p-2 rounded-lg border border-slate-200"
                                        value={weightForm.weight}
                                        onChange={e => setWeightForm({...weightForm, weight: e.target.value})}
                                    />
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    Guardar
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'health' && (
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-700 mb-4">Historial Clínico</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {healthEvents?.map(event => (
                                    <div key={event.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        {event.withdrawal_end_date && new Date(event.withdrawal_end_date) >= new Date() && (
                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                                                RETIRO ACTIVO
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                                event.type === 'Vacunación' ? 'bg-emerald-100 text-emerald-700' :
                                                event.type === 'Tratamiento' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {event.type}
                                            </span>
                                            <span className="text-slate-400 text-xs">{event.date}</span>
                                        </div>
                                        <p className="text-slate-700 font-medium text-sm">{event.description}</p>
                                        {event.withdrawal_end_date && (
                                            <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
                                                ☣️ Retiro hasta: {event.withdrawal_end_date}
                                            </p>
                                        )}
                                        {event.cost > 0 && <p className="text-slate-400 text-xs mt-1">Costo: ${event.cost}</p>}
                                    </div>
                                ))}
                                {(!healthEvents || healthEvents.length === 0) && (
                                    <p className="text-center text-slate-400 italic py-8">Sin eventos registrados</p>
                                )}
                            </div>
                        </div>
                        <div className="w-full md:w-80 bg-slate-50 p-6 rounded-xl h-fit">
                            <h3 className="font-bold text-slate-700 mb-4">Nuevo Evento</h3>
                            <form onSubmit={handleAddHealth} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                    <select 
                                        className="w-full p-2 rounded-lg border border-slate-200"
                                        value={healthForm.type}
                                        onChange={e => setHealthForm({...healthForm, type: e.target.value})}
                                    >
                                        <option>Vacunación</option>
                                        <option>Tratamiento</option>
                                        <option>Desparasitación</option>
                                        <option>Cirugía</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medicamento (Opcional)</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-slate-200"
                                        value={healthForm.medication_id}
                                        onChange={handleMedicationChange}
                                    >
                                        <option value="">Ninguno / Otro</option>
                                        {medications?.filter(m => !m.deleted_at).map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Aplicación</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-2 rounded-lg border border-slate-200"
                                        value={healthForm.date}
                                        onChange={handleDateChange}
                                    />
                                </div>
                                {healthForm.withdrawal_end_date && (
                                    <div className="bg-red-50 p-2 rounded border border-red-100">
                                        <p className="text-xs text-red-700 font-bold">Fecha Fin de Retiro:</p>
                                        <p className="text-sm text-red-800">{healthForm.withdrawal_end_date}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                                    <textarea 
                                        className="w-full p-2 rounded-lg border border-slate-200"
                                        rows="2"
                                        value={healthForm.description}
                                        onChange={e => setHealthForm({...healthForm, description: e.target.value})}
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 rounded-lg border border-slate-200"
                                        value={healthForm.cost}
                                        onChange={e => setHealthForm({...healthForm, cost: e.target.value})}
                                    />
                                </div>
                                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                                    Registrar Evento
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'reproduction' && (
                    <BreedingManager pigId={pigId} />
                )}

            </div>
        </div>
    );
};

export default PigDetail;
