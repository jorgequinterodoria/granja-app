import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Spinner from './Spinner';

export default function DailyTasks() {
    const { hasPermission, token } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Only Admin
    if (!hasPermission('admin.manage')) return null;

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                const res = await fetch(`${API_URL}/dashboard/tasks`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data);
                } else {
                    console.error('Failed to fetch tasks');
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar agenda');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [token]);

    if (loading) return <div className="p-4"><Spinner size="md" /></div>;
    if (error) return null; // Fail silently in dashboard or show error?

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    📅 Mi Agenda
                </h3>
                <p className="text-slate-400 text-sm text-center py-8">No hay tareas pendientes para hoy.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full overflow-hidden flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                📅 Mi Agenda <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
            </h3>
            
            <div className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 
                            ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-500'}`}>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-sm group-hover:text-primary-700 transition-colors">
                                {task.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {new Date(task.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            {task.type === 'sanidad' && <span className="text-lg" title="Sanidad">☣️</span>}
                            {task.type === 'parto' && <span className="text-lg" title="Parto">🐣</span>}
                            {task.type === 'destete' && <span className="text-lg" title="Destete">🥛</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
