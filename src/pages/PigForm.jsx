import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, queueChange, generateId } from '../db';
import { useAuth } from '../auth/AuthProvider';

const PigForm = () => {
    const { hasPermission } = useAuth();
    const sections = useLiveQuery(() => db.sections.toArray());
    const pens = useLiveQuery(() => db.pens.toArray());

    const [formData, setFormData] = useState({
        tag_number: '',
        sex: 'Macho',
        stage: 'Lechon',
        sectionId: '',
        pen_id: '',
        birth_date: '',
        weight: ''
    });

    // Filter pens based on section
    const availablePens = pens?.filter(p => p.section_id == formData.sectionId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.pen_id) return alert('Seleccione un chiquero');

        const newPig = {
            id: generateId(),
            tag_number: formData.tag_number,
            sex: formData.sex,
            stage: formData.stage,
            pen_id: parseInt(formData.pen_id),
            birth_date: formData.birth_date,
            weight: parseFloat(formData.weight),
            status: 'Activo',
            syncStatus: 'pending',
            updated_at: new Date().toISOString()
        };

        await db.pigs.add(newPig);

        // Log initial weight
        const weightLog = {
            id: generateId(),
            pig_id: newPig.id,
            weight: newPig.weight,
            date: new Date().toISOString().split('T')[0],
            syncStatus: 'pending'
        };
        await db.weight_logs.add(weightLog);

        alert('Cerdo registrado correctamente');
        setFormData({ ...formData, tag_number: '', weight: '' });
    };

    if (!hasPermission('pig.create')) {
        return <div className="text-center text-slate-400 mt-10">No tienes permisos para registrar cerdos.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl mt-8">
            <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">Registrar Nuevo Cerdo</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 mb-1">Arete (Tag)</label>
                        <input
                            required
                            className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                            value={formData.tag_number}
                            onChange={(e) => setFormData({ ...formData, tag_number: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-1">Peso Inicial (kg)</label>
                        <input
                            required
                            type="number"
                            className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 mb-1">Sexo</label>
                        <select
                            className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                            value={formData.sex}
                            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                        >
                            <option>Macho</option>
                            <option>Hembra</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-1">Etapa</label>
                        <select
                            className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                            value={formData.stage}
                            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                        >
                            <option>Lechon</option>
                            <option>Ceba</option>
                            <option>Reemplazo</option>
                            <option>Reproductor</option>
                        </select>
                    </div>
                </div>

                {/* Location Selectors */}
                <div className="bg-slate-700/30 p-4 rounded-lg space-y-4">
                    <label className="text-sm font-semibold text-blue-300">Ubicación</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">Sección</label>
                            <select
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                                value={formData.sectionId}
                                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value, pen_id: '' })}
                            >
                                <option value="">Seleccionar...</option>
                                {sections?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">Chiquero</label>
                            <select
                                disabled={!formData.sectionId}
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                                value={formData.pen_id}
                                onChange={(e) => setFormData({ ...formData, pen_id: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                {availablePens?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {formData.sectionId && availablePens?.length === 0 && (
                                <p className="text-amber-400 text-xs mt-1">
                                    ⚠️ No hay chiqueros en esta sección. <a href="/settings" className="underline">Crear chiqueros</a>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg"
                >
                    Guardar Registro
                </button>
            </form>
        </div>
    );
};

export default PigForm;
