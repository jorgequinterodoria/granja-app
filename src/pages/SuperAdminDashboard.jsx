import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

const SuperAdminDashboard = () => {
    const { token } = useAuth();
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        farmName: '',
        adminEmail: '',
        adminPassword: '',
        plan: 'Free'
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        loadFarms();
    }, []);

    const loadFarms = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/farms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFarms(data.farms || []);
            }
        } catch (error) {
            console.error('Error loading farms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFarm = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/admin/create-farm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('✅ Granja creada exitosamente');
                setShowCreateForm(false);
                setFormData({ farmName: '', adminEmail: '', adminPassword: '', plan: 'Free' });
                loadFarms();
            } else {
                const error = await res.json();
                alert('❌ Error: ' + error.error);
            }
        } catch (error) {
            alert('❌ Error al crear granja');
        }
    };

    if (loading) {
        return <div className="text-center text-white mt-20">Cargando...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">🔐 Panel SuperAdmin</h1>
                    <p className="text-slate-400">Gestión de todas las granjas del sistema</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                >
                    {showCreateForm ? '❌ Cancelar' : '➕ Nueva Granja'}
                </button>
            </div>

            {/* Create Farm Form */}
            {showCreateForm && (
                <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Crear Nueva Granja</h2>
                    <form onSubmit={handleCreateFarm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-300 mb-2">Nombre de la Granja</label>
                                <input
                                    required
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="Ej: Granja San José"
                                    value={formData.farmName}
                                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-2">Plan</label>
                                <select
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                >
                                    <option>Free</option>
                                    <option>Pro</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-300 mb-2">Email del Administrador</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="admin@granja.com"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-2">Contraseña del Administrador</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="••••••••"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold"
                        >
                            Crear Granja y Administrador
                        </button>
                    </form>
                </div>
            )}

            {/* Farms List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {farms.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                        <div className="text-6xl mb-4">🏭</div>
                        <p className="text-slate-400 text-lg">No hay granjas registradas aún</p>
                        <p className="text-slate-500 text-sm">Crea la primera granja usando el botón superior</p>
                    </div>
                ) : (
                    farms.map((farm) => (
                        <div
                            key={farm.id}
                            className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all shadow-lg"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{farm.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${farm.plan === 'Pro' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-600 text-slate-300'
                                    }`}>
                                    {farm.plan}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>ID:</span>
                                    <span className="font-mono text-xs">{farm.id.slice(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Creada:</span>
                                    <span>{new Date(farm.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Usuarios:</span>
                                    <span className="font-bold text-white">{farm.user_count || 0}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <button className="w-full text-blue-400 hover:text-blue-300 text-sm font-semibold">
                                    Ver Detalles →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
