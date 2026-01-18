import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, queueChange } from '../db';
import { useAuth } from '../auth/AuthProvider';
import RoleSettings from './RoleSettings';

const FarmSettings = () => {
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('infrastructure'); // 'infrastructure' | 'roles' | 'medications'

    // Sections & Pens
    const sections = useLiveQuery(() => db.sections.toArray());
    const pens = useLiveQuery(() => db.pens.toArray());
    const medications = useLiveQuery(() => db.medications.toArray());

    const [newSection, setNewSection] = useState('');
    const [newPen, setNewPen] = useState({ name: '', sectionId: '', capacity: 10 });
    const [newMedication, setNewMedication] = useState({ name: '', withdrawal_days: 0 });

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

    const handleAddMedication = async () => {
        if (!newMedication.name) return;
        const data = {
            id: crypto.randomUUID(),
            name: newMedication.name,
            withdrawal_days: parseInt(newMedication.withdrawal_days),
            syncStatus: 'pending'
        };
        await db.medications.add(data);
        setNewMedication({ name: '', withdrawal_days: 0 });
    };

    const handleDeleteMedication = async (id) => {
        if (confirm('¿Estás seguro de eliminar este medicamento?')) {
            // Soft delete for sync
            const med = await db.medications.get(id);
            if (med) {
                await db.medications.put({ ...med, deleted_at: new Date().toISOString(), syncStatus: 'pending' });
            }
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Configuración de Granja</h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
                <button 
                    onClick={() => setActiveTab('infrastructure')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'infrastructure' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Infraestructura
                </button>
                <button 
                    onClick={() => setActiveTab('medications')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'medications' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Medicamentos y Retiro
                </button>
                <button 
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
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
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <input
                                type="text"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                placeholder="Nueva Sección (ej. Maternidad)"
                                value={newSection}
                                onChange={(e) => setNewSection(e.target.value)}
                            />
                            <button
                                onClick={handleAddSection}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors w-full sm:w-auto"
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
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-full"
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
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-full"
                                placeholder="Nombre (ej. C1)"
                                value={newPen.name}
                                onChange={(e) => setNewPen({ ...newPen, name: e.target.value })}
                            />
                            <input
                                type="number"
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-full"
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

            {activeTab === 'medications' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Catálogo de Medicamentos</h2>
                    <p className="text-sm text-slate-500 mb-4">Registra medicamentos y sus tiempos de retiro obligatorio.</p>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                placeholder="Ej: Ivermectina"
                                value={newMedication.name}
                                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                            />
                        </div>
                        <div className="w-full md:w-32">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Días Retiro</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                placeholder="0"
                                value={newMedication.withdrawal_days}
                                onChange={(e) => setNewMedication({ ...newMedication, withdrawal_days: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={handleAddMedication}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors h-[42px] w-full md:w-auto"
                        >
                            Agregar
                        </button>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-4">
                        {medications?.filter(m => !m.deleted_at).map(m => (
                            <div key={m.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-slate-800">{m.name}</h4>
                                    <div className="mt-1">
                                        {m.withdrawal_days > 0 ? (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                                                Retiro: {m.withdrawal_days} días
                                            </span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                                Sin retiro
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteMedication(m.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                                    title="Eliminar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {(!medications || medications.filter(m => !m.deleted_at).length === 0) && (
                            <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg">
                                No hay medicamentos registrados.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-3 text-sm font-semibold text-slate-600">Nombre</th>
                                    <th className="py-3 text-sm font-semibold text-slate-600">Días de Retiro</th>
                                    <th className="py-3 text-sm font-semibold text-slate-600 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medications?.filter(m => !m.deleted_at).map(m => (
                                    <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        <td className="py-3 text-slate-800 font-medium">{m.name}</td>
                                        <td className="py-3 text-slate-600">
                                            {m.withdrawal_days > 0 ? (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                                                    {m.withdrawal_days} días
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                                    0 días
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            <button 
                                                onClick={() => handleDeleteMedication(m.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!medications || medications.filter(m => !m.deleted_at).length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="py-8 text-center text-slate-400 italic">
                                            No hay medicamentos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmSettings;
