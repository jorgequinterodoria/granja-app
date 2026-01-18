import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';

export default function InventoryManager() {
    const { inventory, addStock, updateItem } = useInventory();
    const [isAdding, setIsAdding] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // New Feed Form
    const [form, setForm] = useState({ name: '', cost_per_kg: '', current_stock_kg: '', batch_number: '' });

    // Edit Form
    const [editForm, setEditForm] = useState({ name: '', cost_per_kg: '', current_stock_kg: '', batch_number: '', add_stock: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        await addStock(form.name, form.cost_per_kg, form.current_stock_kg, form.batch_number);
        setIsAdding(false);
        setForm({ name: '', cost_per_kg: '', current_stock_kg: '', batch_number: '' });
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setEditForm({
            name: item.name,
            cost_per_kg: item.cost_per_kg,
            current_stock_kg: item.current_stock_kg,
            batch_number: item.batch_number || '',
            add_stock: ''
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        const newStock = parseFloat(editForm.current_stock_kg) + (parseFloat(editForm.add_stock) || 0);

        await updateItem(selectedItem.id, {
            name: editForm.name,
            cost_per_kg: parseFloat(editForm.cost_per_kg),
            batch_number: editForm.batch_number,
            current_stock_kg: newStock
        });

        setSelectedItem(null);
    };

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

            {/* Create Form */}
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

            {/* Edit Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">Editar / Reabastecer</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-500">Nombre</label>
                                <input
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none"
                                    value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-500">Lote</label>
                                <input
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none"
                                    value={editForm.batch_number} onChange={e => setEditForm({ ...editForm, batch_number: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-500">Costo / Kg</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 outline-none"
                                        value={editForm.cost_per_kg} onChange={e => setEditForm({ ...editForm, cost_per_kg: e.target.value })} required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-500">Stock Actual (Solo Lectura)</label>
                                    <input
                                        type="number" disabled
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-500"
                                        value={editForm.current_stock_kg}
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <label className="text-sm font-bold text-green-700">➕ Agregar Stock (Compra)</label>
                                <input
                                    type="number" placeholder="Cantidad a sumar (Kg)"
                                    className="w-full px-4 py-2 rounded-lg border border-green-300 focus:ring-2 focus:ring-green-200 outline-none mt-1"
                                    value={editForm.add_stock} onChange={e => setEditForm({ ...editForm, add_stock: e.target.value })}
                                />
                                <p className="text-xs text-green-600 mt-1">
                                    Nuevo total será: {(parseFloat(editForm.current_stock_kg || 0) + (parseFloat(editForm.add_stock) || 0))} kg
                                </p>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItem(null)}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-colors"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
                            <tr 
                                key={item.id} 
                                onClick={() => openEdit(item)}
                                className="hover:bg-slate-50 hover:scale-[1.01] transition-all duration-200 cursor-pointer group"
                            >
                                <td className="py-4 font-medium text-slate-800 flex items-center gap-2">
                                    {item.name}
                                    <svg className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </td>
                                <td className="py-4 text-right text-slate-500 text-sm">{item.batch_number || '-'}</td>
                                <td className="py-4 text-right text-slate-600 font-semibold">${item.cost_per_kg.toLocaleString('es-ES')}</td>
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
