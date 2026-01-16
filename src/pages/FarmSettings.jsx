import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, queueChange } from '../db';
import { useAuth } from '../auth/AuthProvider';

const FarmSettings = () => {
    const { hasPermission } = useAuth();

    // Sections & Pens
    const sections = useLiveQuery(() => db.sections.toArray());
    const pens = useLiveQuery(() => db.pens.toArray());

    const [newSection, setNewSection] = useState('');
    const [newPen, setNewPen] = useState({ name: '', sectionId: '', capacity: 10 });

    if (!hasPermission('admin.manage')) {
        return <div className="p-8 text-white">No tienes permisos para ver esta página.</div>;
    }

    const handleAddSection = async () => {
        if (!newSection) return;
        const data = {
            id: crypto.randomUUID(),
            name: newSection,
            syncStatus: 'pending'
        };
        await db.sections.add(data);
        setNewSection('');
    };

    const handleAddPen = async () => {
        if (!newPen.name || !newPen.sectionId) return;
        const data = {
            id: crypto.randomUUID(),
            name: newPen.name,
            section_id: newPen.sectionId,
            capacity: parseInt(newPen.capacity),
            syncStatus: 'pending'
        };
        await db.pens.add(data);
        setNewPen({ ...newPen, name: '' });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-6">Configuración de Granja</h1>

            {/* Sections Management */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h2 className="text-xl font-semibold text-blue-400 mb-4">Secciones (Áreas)</h2>
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        placeholder="Nueva Sección (ej. Maternidad)"
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                    />
                    <button
                        onClick={handleAddSection}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                        Agregar
                    </button>
                </div>
                <ul className="space-y-2">
                    {sections?.map(s => (
                        <li key={s.id} className="flex justify-between bg-slate-700/50 p-3 rounded-lg text-slate-200">
                            <span>{s.name}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Pens Management */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h2 className="text-xl font-semibold text-emerald-400 mb-4">Chiqueros / Corrales</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <select
                        className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        value={newPen.sectionId}
                        onChange={(e) => setNewPen({ ...newPen, sectionId: e.target.value })}
                    >
                        <option value="">Seleccionar Sección</option>
                        {sections?.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        placeholder="Nombre (ej. C1)"
                        value={newPen.name}
                        onChange={(e) => setNewPen({ ...newPen, name: e.target.value })}
                    />
                    <input
                        type="number"
                        className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        placeholder="Capacidad"
                        value={newPen.capacity}
                        onChange={(e) => setNewPen({ ...newPen, capacity: e.target.value })}
                    />
                </div>
                <button
                    onClick={handleAddPen}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg"
                >
                    Agregar Chiquero
                </button>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pens?.map(p => {
                        const sec = sections?.find(s => s.id == p.section_id);
                        return (
                            <div key={p.id} className="bg-slate-700/50 p-3 rounded-lg text-slate-200 flex justify-between">
                                <span>{p.name}</span>
                                <span className="text-slate-400 text-sm">{sec?.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FarmSettings;
