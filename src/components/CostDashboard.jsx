import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProfitability } from '../hooks/useProfitability';

export default function CostDashboard({ pigId }) {
    const { totalCost, netProfit, roi, marketValue, isLoading } = useProfitability(pigId);

    if (isLoading) return <div className="text-slate-400 text-sm">Calculando rentabilidad...</div>;

    const data = [
        { name: 'Costo Alimento + Fijos', value: totalCost },
        { name: 'Margen de Ganancia', value: netProfit > 0 ? netProfit : 0 },
    ];

    const COLORS = ['#94A3B8', '#10B981']; // Gray for Cost, Green for Profit

    // If loss, show red
    if (netProfit < 0) {
        data[1] = { name: 'Pérdida', value: Math.abs(netProfit) };
        COLORS[1] = '#EF4444';
    }

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase flex justify-between">
                <span>💰 Rentabilidad</span>
                {roi > 15 && <span className="text-green-600">🚀 Excelente</span>}
                {roi < 0 && <span className="text-red-500">⚠️ Crítico</span>}
            </h3>

            <div className="flex flex-col md:flex-row items-center">
                <div className="h-40 w-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-[10px] text-slate-400 font-bold">ROI</span>
                        <span className={`text-sm font-bold ${roi >= 0 ? 'text-slate-700' : 'text-red-500'}`}>{roi}%</span>
                    </div>
                </div>

                <div className="ml-4 flex-1 space-y-2 w-full">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Valor Mercado:</span>
                        <span className="font-bold text-slate-800">${marketValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Costo Total:</span>
                        <span className="font-bold text-slate-800">${totalCost.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-px bg-slate-100 my-2"></div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Neto:</span>
                        <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${netProfit.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
