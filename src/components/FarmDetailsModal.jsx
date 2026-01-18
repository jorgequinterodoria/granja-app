import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

const FarmDetailsModal = ({ farm, isOpen, onClose, onUpdate }) => {
    if (!isOpen || !farm) return null;

    const { token } = useAuth();
    const [plan, setPlan] = useState(farm.plan);
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const handleUpdatePlan = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`${API_URL}/admin/farms/${farm.id}/plan`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Plan actualizado correctamente' });
                onUpdate();
            } else {
                setMessage({ type: 'error', text: 'Error al actualizar el plan' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
            return;
        }

        if (!confirm('¿Estás seguro de restablecer la contraseña del administrador?')) return;

        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`${API_URL}/admin/farms/${farm.id}/reset-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Contraseña restablecida correctamente' });
                setNewPassword('');
            } else {
                setMessage({ type: 'error', text: 'Error al restablecer la contraseña' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{farm.name}</h2>
                        <p className="text-sm text-slate-400 font-mono">{farm.id}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Información General</h3>
                        <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Admin Email:</span>
                                <span className="text-white font-medium select-all">{farm.admin_email || 'No disponible'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Fecha Registro:</span>
                                <span className="text-white">{new Date(farm.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Usuarios Totales:</span>
                                <span className="text-white">{farm.user_count}</span>
                            </div>
                        </div>
                    </div>

                    {/* Plan Management */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Gestión de Suscripción</h3>
                        <div className="flex gap-2">
                            <select 
                                value={plan} 
                                onChange={(e) => setPlan(e.target.value)}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Free">Free</option>
                                <option value="Pro">Pro</option>
                            </select>
                            <button 
                                onClick={handleUpdatePlan}
                                disabled={loading || plan === farm.plan}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>

                    {/* Security Actions */}
                    <div className="space-y-3 pt-2 border-t border-slate-700">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Seguridad y Acceso</h3>
                        <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Nueva Contraseña Admin</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 6 caracteres"
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                                    />
                                    <button 
                                        onClick={handleResetPassword}
                                        disabled={loading || !newPassword}
                                        className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Resetear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex justify-end">
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-semibold transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FarmDetailsModal;
