import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import Spinner from './Spinner';

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Helper: Add days to date
    const addDays = (dateStr, days) => {
        const result = new Date(dateStr);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);
        
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
            setSuccess(true);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            setError("Error al guardar evento");
        } finally {
            setIsSubmitting(false);
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

            {/* Prediction Card with Glassmorphism */}
            {probablePartoDate && (
                <div className="glass-card p-6 rounded-2xl flex items-center justify-between shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div>
                        <h4 className="text-primary-800 font-bold uppercase text-xs tracking-wider mb-1">Ciclo Activo</h4>
                        <p className="text-slate-900 font-medium">
                            Última Monta: {new Date(lastActiveMonta.event_date).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-primary-600">Fecha Probable de Parto</p>
                        <p className="text-2xl font-bold text-primary-700">
                            {new Date(probablePartoDate).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                        </p>
                        {daysRemaining > 0 ? (
                            <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1.5 rounded-full font-bold">
                                Faltan {daysRemaining} días
                            </span>
                        ) : (
                            <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold animate-pulse">
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
                        {sortedEvents.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-slate-400 text-sm">Sin eventos registrados.</p>
                            </div>
                        )}
                        {sortedEvents.map(event => (
                            <div key={event.id} className="relative pl-6 border-l-2 border-slate-200 pb-2 last:pb-0">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-md
                                    ${event.event_type === 'Monta' ? 'bg-primary-500' :
                                        event.event_type === 'Parto' ? 'bg-secondary-500' : 'bg-accent-500'}`}>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                                            ${event.event_type === 'Monta' ? 'bg-primary-100 text-primary-800' :
                                                event.event_type === 'Parto' ? 'bg-secondary-100 text-secondary-800' : 
                                                'bg-accent-100 text-accent-800'}`}>
                                            {event.event_type}
                                        </span>
                                        <span className="text-xs text-slate-500 font-medium">{new Date(event.event_date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                                    </div>
                                    {event.details && <p className="text-slate-600 text-sm mt-2">{event.details}</p>}
                                    <div className="mt-2 text-right">
                                        <span className={`text-xs font-medium ${event.syncStatus === 'synced' ? 'text-secondary-600' : 'text-amber-600'}`}>
                                            {event.syncStatus === 'synced' ? '☁️ Sincronizado' : '⏳ Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit">
                    <h3 className="font-bold text-slate-700 mb-4">Registrar Evento</h3>
                    
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
                                <p className="text-sm text-secondary-700 mt-1">Evento de reproducción guardado correctamente</p>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSaveEvent} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tipo de Evento</label>
                            <select
                                value={form.event_type}
                                onChange={e => setForm({ ...form, event_type: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                            >
                                <option value="Monta">Monta / IA</option>
                                <option value="Parto">Parto</option>
                                <option value="Destete">Destete</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fecha</label>
                            <input
                                type="date"
                                required
                                value={form.event_date}
                                onChange={e => setForm({ ...form, event_date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Detalles</label>
                            <textarea
                                value={form.details}
                                onChange={e => setForm({ ...form, details: e.target.value })}
                                rows="3"
                                placeholder="Ej: Macho utilizado, Cant. lechones, estado..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none resize-none"
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
                                'Guardar Evento'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
