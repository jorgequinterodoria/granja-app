import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, queueChange, generateId } from '../db';
import { useAuth } from '../auth/AuthProvider';

const PigForm = () => {
    const { hasPermission } = useAuth();
    const sections = useLiveQuery(() => db.sections.toArray());
    const pens = useLiveQuery(() => db.pens.toArray());
    
    // Fetch active pigs for parents
    const boars = useLiveQuery(() => 
        db.pigs
            .where('sex').equals('Macho')
            .filter(p => !p.deleted_at && p.status === 'Activo' && p.stage === 'Reproductor')
            .toArray()
    );
    const sows = useLiveQuery(() => 
        db.pigs
            .where('sex').equals('Hembra')
            .filter(p => !p.deleted_at && p.status === 'Activo' && p.stage === 'Reproduc')
            .toArray()
    );

    const [formData, setFormData] = useState({
        tag_number: '',
        sex: 'Macho',
        stage: 'Lechon',
        sectionId: '',
        pen_id: '',
        birth_date: '',
        entry_date: '', 
        weight: '',
        father_id: '',
        mother_id: '',
        genetics_score: ''
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
            pen_id: formData.pen_id, 
            birth_date: formData.birth_date || null,
            entry_date: formData.entry_date || new Date().toISOString().split('T')[0], 
            weight: parseFloat(formData.weight),
            status: 'Activo',
            
            // New Fields
            father_id: formData.father_id || null,
            mother_id: formData.mother_id || null,
            genetics_score: formData.genetics_score ? parseInt(formData.genetics_score) : null,

            syncStatus: 'pending',
            created_at: new Date().toISOString(),
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
        setFormData({ 
            tag_number: '', 
            weight: '', 
            sex: 'Macho',
            stage: 'Lechon',
            sectionId: '',
            pen_id: '',
            birth_date: '',
            entry_date: '',
            father_id: '',
            mother_id: '',
            genetics_score: ''
        });
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 mb-1">Fecha de Nacimiento</label>
                        <input
                            type="date"
                            className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-1">Fecha de Ingreso</label>
                        <input
                            type="date"
                            className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                            value={formData.entry_date}
                            onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                        />
                    </div>
                </div>

                {/* Genetics Section */}
                <div className="bg-slate-700/30 p-4 rounded-lg space-y-4">
                    <label className="text-sm font-semibold text-purple-300">Genética (Opcional)</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">Padre (Macho)</label>
                            <select
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                                value={formData.father_id}
                                onChange={(e) => setFormData({ ...formData, father_id: e.target.value })}
                            >
                                <option value="">Desconocido</option>
                                {boars?.map(p => <option key={p.id} value={p.id}>{p.tag_number}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">Madre (Hembra)</label>
                            <select
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                                value={formData.mother_id}
                                onChange={(e) => setFormData({ ...formData, mother_id: e.target.value })}
                            >
                                <option value="">Desconocido</option>
                                {sows?.map(p => <option key={p.id} value={p.id}>{p.tag_number}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">Puntaje Genético (1-100)</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white"
                                value={formData.genetics_score}
                                onChange={(e) => setFormData({ ...formData, genetics_score: e.target.value })}
                            />
                        </div>
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
