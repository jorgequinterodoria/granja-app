import React from 'react';

export default function SanitaryAlert({ withdrawalEndDate }) {
    if (!withdrawalEndDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(withdrawalEndDate);
    end.setHours(0, 0, 0, 0);

    if (today <= end) {
        const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        
        return (
            <div className="group relative inline-block ml-2">
                <span className="text-xl cursor-help animate-pulse" role="img" aria-label="Biohazard">
                    ☣️
                </span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-red-600 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-lg">
                    <p className="font-bold uppercase mb-1">Periodo de Retiro Activo</p>
                    <p>Faltan {daysLeft} días.</p>
                    <p className="mt-1 font-semibold">PROHIBIDA LA VENTA</p>
                    {/* Triangle */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
                </div>
            </div>
        );
    }

    return null;
}
