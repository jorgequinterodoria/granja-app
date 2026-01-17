import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, queueChange } from '../db';
import { useAuth } from '../auth/AuthProvider';
import RoleSettings from './RoleSettings';

const FarmSettings = () => {
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('infrastructure'); // 'infrastructure' | 'roles'

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
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Configuración de Granja</h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('infrastructure')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                        activeTab === 'infrastructure' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Infraestructura
                </button>
                <button 
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                        activeTab === 'roles' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Roles y Permisos
                </button>
            </div>

            {activeTab === 'roles' && <RoleSettings />}

            {activeTab === 'infrastructure' && (
                <>
                    {/* Sections Management */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">Secciones (Áreas)</h2>
                        <div className="flex gap-4 mb-4">
                            <input
                                type="text"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                placeholder="Nueva Sección (ej. Maternidad)"
                                value={newSection}
                                onChange={(e) => setNewSection(e.target.value)}
                            />
                            <button
                                onClick={handleAddSection}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Agregar
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {sections?.map(s => (
                                <li key={s.id} className="flex justify-between bg-slate-50 p-3 rounded-lg text-slate-700 border border-slate-100">
                                    <span>{s.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pens Management */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">Chiqueros / Corrales</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <select
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
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
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                placeholder="Nombre (ej. C1)"
                                value={newPen.name}
                                onChange={(e) => setNewPen({ ...newPen, name: e.target.value })}
                            />
                            <input
                                type="number"
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                placeholder="Capacidad"
                                value={newPen.capacity}
                                onChange={(e) => setNewPen({ ...newPen, capacity: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={handleAddPen}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg transition-colors font-medium"
                        >
                            Agregar Chiquero
                        </button>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pens?.map(p => {
                                // Loose comparison to handle both string (UUID) and number (Server ID) matches
                                const sec = sections?.find(s => s.id == p.section_id);
                                return (
                                    <div key={p.id} className="bg-slate-50 p-3 rounded-lg text-slate-700 flex justify-between border border-slate-100">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-slate-500 text-sm bg-slate-100 px-2 py-0.5 rounded">{sec?.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FarmSettings;
