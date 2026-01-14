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
        fecha_nacimiento: new Date().toISOString().split('T')[0] // Today
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Business Logic Validations
        if (parseFloat(formData.peso) < 0) {
            setError('El peso no puede ser negativo.');
            return;
        }

        if (new Date(formData.fecha_nacimiento) > new Date()) {
            setError('La fecha de nacimiento no puede ser futura.');
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
                return;
            }

            await db.pigs.add({
                id: uuidv4(),
                ...formData,
                status: 'Activo',
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
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Registrar Nuevo Animal</h2>

            {error && (
                <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4 border border-red-200">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-4 border border-green-200">
                    ¡Guardado localmente! ⏳
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Identifiers */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Arete ID *</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.numero_arete}
                            onChange={e => setFormData({ ...formData, numero_arete: e.target.value })}
                            placeholder="Ej: A-101"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Nombre (Opcional)</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Sexo *</label>
                        <select
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.peso}
                            onChange={e => setFormData({ ...formData, peso: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Fecha Nacimiento *</label>
                        <input
                            type="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.fecha_nacimiento}
                            onChange={e => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 mt-4"
                >
                    Guardar Cerdo
                </button>

            </form>
        </div>
    );
}
