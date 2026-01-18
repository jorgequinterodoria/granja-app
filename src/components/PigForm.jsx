import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

export default function PigForm() {
    const [formData, setFormData] = useState({
        nombre: '',
        numero_arete: '',
        sexo: 'Macho', // Default
        etapa: 'Lechón', // Default
        peso: '',
        fecha_nacimiento: new Date().toISOString().split('T')[0], // Today
        fecha_ingreso: new Date().toISOString().split('T')[0] // Today - Default
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsSubmitting(true);

        // Business Logic Validations
        if (parseFloat(formData.peso) < 0) {
            setError('El peso no puede ser negativo.');
            setIsSubmitting(false);
            return;
        }

        if (new Date(formData.fecha_nacimiento) > new Date()) {
            setError('La fecha de nacimiento no puede ser futura.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Enforce uniqueness locally if possible, though backend is source of truth.
            // We can check if we already have an "Activo" pig with this arete in our local DB.
            // NOTE: This doesn't guarantee global uniqueness until sync, but helps UX.
            const existing = await db.pigs
                .where('numero_arete').equals(formData.numero_arete)
                .and(p => p.status === 'Activo')
                .first();

            if (existing) {
                setError('Ya existe un animal Activo con este Arete (localmente).');
                setIsSubmitting(false);
                return;
            }

            await db.pigs.add({
                id: uuidv4(),
                ...formData,
                status: 'Activo',
                entry_date: formData.fecha_ingreso, // Map to correct DB field
                syncStatus: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            setSuccess(true);
            setFormData(prev => ({
                ...prev,
                nombre: '',
                numero_arete: ''
            })); // Clear some fields

            // Try to auto-sync if online
            // await syncService.sync(); // Optional: trigger sync immediately
        } catch (err) {
            console.error(err);
            setError('Error al guardar en base de datos local.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Registrar Nuevo Animal</h2>

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
                        <p className="text-sm text-secondary-700 mt-1">Animal guardado localmente y listo para sincronizar</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Identifiers */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Fecha Ingreso *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                value={formData.fecha_ingreso}
                                onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Arete ID *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                value={formData.numero_arete}
                                onChange={e => setFormData({ ...formData, numero_arete: e.target.value })}
                                placeholder="Ej: A-101"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Nombre (Opcional)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Sexo *</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none bg-white"
                            value={formData.sexo}
                            onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                        >
                            <option value="Macho">Macho</option>
                            <option value="Hembra">Hembra</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Inmutable tras creación</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Etapa *</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none bg-white"
                            value={formData.etapa}
                            onChange={e => setFormData({ ...formData, etapa: e.target.value })}
                        >
                            <option value="Lechón">Lechón</option>
                            <option value="Levante">Levante</option>
                            <option value="Ceba">Ceba</option>
                            <option value="Reproductor">Reproductor</option>
                        </select>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Peso (kg) *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                value={formData.peso}
                                onChange={e => setFormData({ ...formData, peso: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Fecha Nacimiento *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                                value={formData.fecha_nacimiento}
                                onChange={e => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        'Guardar Cerdo'
                    )}
                </button>

            </form>
        </div>
    );
}
