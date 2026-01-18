import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';

export default function LowStockAlert() {
    const lowStockItems = useLiveQuery(() => 
        db.feed_inventory
            .filter(item => item.current_stock_kg < 50)
            .toArray()
    );

    if (!lowStockItems || lowStockItems.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="font-bold text-red-800">Alerta de Stock Bajo</h3>
            </div>
            
            <div className="space-y-2 mb-4">
                {lowStockItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-red-100">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="font-bold text-red-600">{item.current_stock_kg} kg</span>
                    </div>
                ))}
            </div>

            <Link 
                to="/alimentacion" 
                className="block w-full text-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
                Gestionar Inventario
            </Link>
        </div>
    );
}
