import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

export default function BreedingManager({ pigId }) {
    const events = useLiveQuery(
        () => db.breeding_events
            .where('pig_id')
            .equals(pigId)
            .toArray()
        , [pigId]);

    const [form, setForm] = useState({
        event_type: 'Monta',
        event_date: new Date().toISOString().split('T')[0],
        details: ''
    });

    // Helper: Add days to date
    const addDays = (dateStr, days) => {
        const result = new Date(dateStr);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            await db.breeding_events.add({
                id: uuidv4(),
                pig_id: pigId,
                ...form,
                syncStatus: 'pending',
                updated_at: new Date().toISOString()
            });
            setForm({
                event_type: 'Monta',
                event_date: new Date().toISOString().split('T')[0],
                details: ''
            });
        } catch (error) {
            console.error(error);
            alert("Error al guardar evento");
        }
    };

    const sortedEvents = events
        ? [...events].sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
        : [];

    // Logic: Find most recent 'Monta' without a subsequent 'Parto'
    const lastActiveMonta = sortedEvents.find(e => {
        // Simple logic: Is it a Monta? (In real app, check if followed by Parto would require more complex filtering)
        // For now, let's just show prediction based on the LATEST Monta found.
        return e.event_type === 'Monta' || e.event_type === 'Inseminacion';
    });

    const probablePartoDate = lastActiveMonta ? addDays(lastActiveMonta.event_date, 114) : null;
    const daysRemaining = probablePartoDate
        ? Math.ceil((new Date(probablePartoDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="space-y-8">

            {/* Prediction Card */}
            {probablePartoDate && (
                <div className="bg-pink-50 border border-pink-200 p-6 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                        <h4 className="text-pink-800 font-bold uppercase text-xs tracking-wider mb-1">Ciclo Activo</h4>
                        <p className="text-pink-900 font-medium">
                            Última Monta: {new Date(lastActiveMonta.event_date).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-pink-600">Fecha Probable de Parto</p>
                        <p className="text-2xl font-bold text-pink-700">
                            {new Date(probablePartoDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        </p>
                        {daysRemaining > 0 ? (
                            <span className="bg-pink-200 text-pink-800 text-xs px-2 py-1 rounded-full font-bold">
                                Faltan {daysRemaining} días
                            </span>
                        ) : (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                ¡Atención! Fecha alcanzada
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Timeline */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Historial Reproductivo</h3>
                    <div className="space-y-4">
                        {sortedEvents.length === 0 && <p className="text-slate-400 text-sm">Sin eventos registrados.</p>}
                        {sortedEvents.map(event => (
                            <div key={event.id} className="relative pl-6 border-l-2 border-slate-200 pb-2 last:pb-0">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white 
                                    ${event.event_type === 'Monta' ? 'bg-purple-400' :
                                        event.event_type === 'Parto' ? 'bg-green-400' : 'bg-orange-400'}`}>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-slate-700">{event.event_type}</span>
                                        <span className="text-xs text-slate-400">{new Date(event.event_date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                                    </div>
                                    {event.details && <p className="text-slate-600 text-sm mt-1">{event.details}</p>}
                                    <div className="mt-1 text-right">
                                        <span className="text-[10px] text-slate-400">
                                            {event.syncStatus === 'synced' ? '☁️ Sincronizado' : '⏳ Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="bg-slate-50 p-6 rounded-xl h-fit">
                    <h3 className="font-bold text-slate-700 mb-4">Registrar Evento</h3>
                    <form onSubmit={handleSaveEvent} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tipo de Evento</label>
                            <select
                                value={form.event_type}
                                onChange={e => setForm({ ...form, event_type: e.target.value })}
                                className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                            >
                                <option value="Monta">Monta / IA</option>
                                <option value="Parto">Parto</option>
                                <option value="Destete">Destete</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Fecha</label>
                            <input
                                type="date"
                                required
                                value={form.event_date}
                                onChange={e => setForm({ ...form, event_date: e.target.value })}
                                className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Detalles</label>
                            <textarea
                                value={form.details}
                                onChange={e => setForm({ ...form, details: e.target.value })}
                                rows="3"
                                placeholder="Ej: Macho utilizado, Cant. lechones, estado..."
                                className="w-full p-3 rounded-lg border border-slate-200"
                            ></textarea>
                        </div>
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95">
                            Guardar Evento
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
