import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';

export default function InventoryManager() {
    const { inventory, addStock } = useInventory();
    const [isAdding, setIsAdding] = useState(false);

    // New Feed Form
    const [form, setForm] = useState({ name: '', cost_per_kg: '', current_stock_kg: '', batch_number: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        await addStock(form.name, form.cost_per_kg, form.current_stock_kg, form.batch_number);
        setIsAdding(false);
        setForm({ name: '', cost_per_kg: '', current_stock_kg: '', batch_number: '' });
    };

    // Quick Add Modal/State (Simulated for this component) can be enhanced later

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">📦 Inventario de Alimento</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 hover:from-primary-700 hover:to-primary-600"
                >
                    {isAdding ? 'Cancelar' : '+ Nuevo Alimento'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="mb-8 glass-card p-6 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder="Nombre (ej: Inicio, Engorde)"
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        />
                        <input
                            placeholder="Lote #"
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                            value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })}
                        />
                        <input
                            type="number" placeholder="Costo por Kg ($)"
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                            value={form.cost_per_kg} onChange={e => setForm({ ...form, cost_per_kg: e.target.value })} required
                        />
                        <input
                            type="number" placeholder="Stock Inicial (Kg)"
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none"
                            value={form.current_stock_kg} onChange={e => setForm({ ...form, current_stock_kg: e.target.value })} required
                        />
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 hover:from-primary-700 hover:to-primary-600 w-full">
                        Guardar en Inventario
                    </button>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-500 text-xs uppercase border-b border-slate-200">
                            <th className="py-3 font-bold">Alimento</th>
                            <th className="py-3 font-bold text-right">Lote</th>
                            <th className="py-3 font-bold text-right">Costo / Kg</th>
                            <th className="py-3 font-bold text-right">Stock (Kg)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {inventory.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-16 h-16 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <p className="text-slate-400 font-medium">No hay inventario registrado</p>
                                        <p className="text-slate-300 text-sm mt-1">Agrega tu primer alimento para comenzar</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {inventory.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 hover:scale-[1.01] transition-all duration-200 cursor-pointer">
                                <td className="py-4 font-medium text-slate-800">{item.name}</td>
                                <td className="py-4 text-right text-slate-500 text-sm">{item.batch_number || '-'}</td>
                                <td className="py-4 text-right text-slate-600 font-semibold">${item.cost_per_kg.toLocaleString()}</td>
                                <td className={`py-4 text-right font-bold ${item.current_stock_kg < 50 ? 'text-accent-600 animate-pulse' : 'text-secondary-600'}`}>
                                    {item.current_stock_kg < 50 && (
                                        <span className="inline-flex items-center gap-1">
                                            <svg className="w-4 h-4 animate-pulse-glow" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {item.current_stock_kg} kg
                                        </span>
                                    )}
                                    {item.current_stock_kg >= 50 && `${item.current_stock_kg} kg`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
