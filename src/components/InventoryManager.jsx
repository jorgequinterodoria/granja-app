import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';

export default function InventoryManager() {
    const { inventory, addFeed, updateStock } = useInventory();
    const [isAdding, setIsAdding] = useState(false);

    // New Feed Form
    const [form, setForm] = useState({ name: '', cost_per_kg: '', current_stock_kg: '', batch_number: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        await addFeed({
            ...form,
            cost_per_kg: parseFloat(form.cost_per_kg),
            current_stock_kg: parseFloat(form.current_stock_kg)
        });
        setIsAdding(false);
        setForm({ name: '', cost_per_kg: '', current_stock_kg: '', batch_number: '' });
    };

    // Quick Add Modal/State (Simulated for this component) can be enhanced later

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">📦 Inventario de Alimento</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    {isAdding ? 'Cancelar' : '+ Nuevo Alimento'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="mb-8 bg-slate-50 p-4 rounded-xl border border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder="Nombre (ej: Inicio, Engorde)"
                            className="p-3 rounded border border-slate-300"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                        />
                        <input
                            placeholder="Lote #"
                            className="p-3 rounded border border-slate-300"
                            value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })}
                        />
                        <input
                            type="number" placeholder="Costo por Kg ($)"
                            className="p-3 rounded border border-slate-300"
                            value={form.cost_per_kg} onChange={e => setForm({ ...form, cost_per_kg: e.target.value })} required
                        />
                        <input
                            type="number" placeholder="Stock Inicial (Kg)"
                            className="p-3 rounded border border-slate-300"
                            value={form.current_stock_kg} onChange={e => setForm({ ...form, current_stock_kg: e.target.value })} required
                        />
                    </div>
                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold w-full">Guardar en Inventario</button>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-500 text-xs uppercase border-b border-slate-100">
                            <th className="py-3 font-bold">Alimento</th>
                            <th className="py-3 font-bold text-right">Lote</th>
                            <th className="py-3 font-bold text-right">Costo / Kg</th>
                            <th className="py-3 font-bold text-right">Stock (Kg)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {inventory.length === 0 && (
                            <tr><td colSpan="4" className="py-4 text-center text-slate-400 italic">No hay inventario registrado.</td></tr>
                        )}
                        {inventory.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 font-medium text-slate-800">{item.name}</td>
                                <td className="py-3 text-right text-slate-500 text-sm">{item.batch_number || '-'}</td>
                                <td className="py-3 text-right text-slate-600">${item.cost_per_kg.toLocaleString()}</td>
                                <td className={`py-3 text-right font-bold ${item.current_stock_kg < 50 ? 'text-red-500' : 'text-green-600'}`}>
                                    {item.current_stock_kg} kg
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
