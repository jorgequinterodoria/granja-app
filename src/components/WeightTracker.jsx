import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../db';

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

    const handleAddWeight = async (e) => {
        e.preventDefault();
        if (!newWeight || newWeight <= 0) return;

        try {
            await db.weight_logs.add({
                id: uuidv4(),
                pig_id: pigId,
                weight: parseFloat(newWeight),
                date_measured: dateMeasured,
                syncStatus: 'pending',
                updated_at: new Date().toISOString()
            });
            setNewWeight('');
        } catch (error) {
            console.error("Error adding weight:", error);
            alert("Error al guardar peso");
        }
    };

    // Sort for Chart: Oldest -> Newest
    const chartData = weights
        ? [...weights].sort((a, b) => new Date(a.date_measured) - new Date(b.date_measured))
        : [];

    // Sort for List: Newest -> Oldest
    const listData = [...chartData].reverse();

    return (
        <div className="space-y-8">
            {/* Chart */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-64">
                <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Progreso de Peso</h3>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
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
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#2563EB', fontWeight: 'bold' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#2563EB"
                                strokeWidth={3}
                                dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        Sin datos suficientes para graficar
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* List History */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">Historial</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {listData.length === 0 && <p className="text-slate-400 text-sm">No hay registros.</p>}
                        {listData.map(log => (
                            <div key={log.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-slate-600 font-medium">{log.date_measured}</span>
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
                <div className="bg-slate-50 p-6 rounded-xl h-fit">
                    <h3 className="font-bold text-slate-700 mb-4">Registrar Nuevo Peso</h3>
                    <form onSubmit={handleAddWeight} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Fecha</label>
                            <input
                                type="date"
                                required
                                value={dateMeasured}
                                onChange={e => setDateMeasured(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Peso (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={newWeight}
                                onChange={e => setNewWeight(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95">
                            Guardar Peso
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
