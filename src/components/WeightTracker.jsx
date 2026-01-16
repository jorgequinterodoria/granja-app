import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { db } from '../db';
import Spinner from './Spinner';

export default function WeightTracker({ pigId }) {
    const weights = useLiveQuery(
        () => db.weight_logs
            .where('pig_id')
            .equals(pigId)
            // .sortBy('date_measured') // Recharts needs sorted data
            .toArray()
        , [pigId]);

    const [newWeight, setNewWeight] = useState('');
    const [dateMeasured, setDateMeasured] = useState(new Date().toISOString().split('T')[0]);
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);

    // Entrance animation
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleAddWeight = async (e) => {
        e.preventDefault();
        if (!newWeight || newWeight <= 0) return;
        
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await db.weight_logs.add({
                id: uuidv4(),
                pig_id: pigId,
                weight: parseFloat(newWeight),
                date_measured: dateMeasured,
                date: dateMeasured,
                syncStatus: 'pending',
                updated_at: new Date().toISOString()
            });
            setNewWeight('');
            setSuccess(true);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error adding weight:", error);
            setError("Error al guardar peso");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sort for Chart: Oldest -> Newest
    const chartData = weights
        ? [...weights].sort((a, b) => new Date(a.date_measured || a.date) - new Date(b.date_measured || b.date))
        : [];

    // Sort for List: Newest -> Oldest
    const listData = [...chartData].reverse();

    // Calculate metrics
    const currentWeight = listData.length > 0 ? listData[0].weight : 0;
    const previousWeight = listData.length > 1 ? listData[1].weight : currentWeight;
    const weightChange = currentWeight - previousWeight;
    const averageWeight = chartData.length > 0 
        ? (chartData.reduce((sum, log) => sum + log.weight, 0) / chartData.length).toFixed(2)
        : 0;

    return (
        <div className="space-y-8">
            {/* Metric Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Current Weight */}
                <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-2xl shadow-lg border border-primary-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Peso Actual</span>
                        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                    </div>
                    <div className="text-4xl font-bold text-slate-800 font-display">{currentWeight} <span className="text-2xl text-slate-500">kg</span></div>
                </div>

                {/* Weight Change */}
                <div className="bg-gradient-to-br from-secondary-50 to-white p-6 rounded-2xl shadow-lg border border-secondary-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">Cambio</span>
                        {weightChange !== 0 && (
                            <svg className={`w-6 h-6 ${weightChange > 0 ? 'text-secondary-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {weightChange > 0 ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                )}
                            </svg>
                        )}
                    </div>
                    <div className={`text-4xl font-bold font-display ${weightChange > 0 ? 'text-secondary-600' : weightChange < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                        {weightChange > 0 ? '+' : ''}{weightChange.toFixed(2)} <span className="text-2xl text-slate-500">kg</span>
                    </div>
                </div>

                {/* Average Weight */}
                <div className="bg-gradient-to-br from-accent-50 to-white p-6 rounded-2xl shadow-lg border border-accent-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-accent-600 uppercase tracking-wide">Promedio</span>
                        <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div className="text-4xl font-bold text-slate-800 font-display">{averageWeight} <span className="text-2xl text-slate-500">kg</span></div>
                </div>
            </div>

            {/* Chart */}
            <div 
                ref={chartRef}
                className={`bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-80 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
                <h3 className="text-lg font-bold text-slate-700 mb-6">Progreso de Peso</h3>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <defs>
                                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="date_measured"
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                tickLine={false}
                                axisLine={false}
                                unit="kg"
                            />
                            <Tooltip
                                contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                stroke="none"
                                fill="url(#weightGradient)"
                            />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, fill: '#4f46e5' }}
                                animationDuration={1000}
                                animationEasing="ease-in-out"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm">Sin datos suficientes para graficar</p>
                    </div>
                )}
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* List History */}
                <div>
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Historial</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {listData.length === 0 && <p className="text-slate-400 text-sm">No hay registros.</p>}
                                {listData.map(log => (
                                    <div key={log.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all duration-200">
                                <span className="text-slate-600 font-medium">{log.date_measured || log.date}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-800">{log.weight} kg</span>
                                        <span className="text-[10px] text-slate-400">
                                            {log.syncStatus === 'synced' ? '☁️' : '⏳'}
                                        </span>
                                    </div>
                                </div>
                                ))}
                            </div>
                </div>

                {/* Add Form */}
                <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-100 shadow-lg h-fit">
                    <h3 className="font-bold text-slate-700 mb-4">Registrar Nuevo Peso</h3>
                    
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
                                <p className="text-sm text-secondary-700 mt-1">Peso registrado correctamente</p>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleAddWeight} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fecha</label>
                            <input
                                type="date"
                                required
                                value={dateMeasured}
                                onChange={e => setDateMeasured(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Peso (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={newWeight}
                                onChange={e => setNewWeight(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                'Guardar Peso'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
