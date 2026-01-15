import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProfitability } from '../hooks/useProfitability';

export default function CostDashboard({ pigId }) {
    const { totalCost, netProfit, roi, marketValue, isLoading } = useProfitability(pigId);

    if (isLoading) return <div className="text-slate-400 text-sm">Calculando rentabilidad...</div>;

    const data = [
        { name: 'Costo Alimento + Fijos', value: totalCost },
        { name: 'Margen de Ganancia', value: netProfit > 0 ? netProfit : 0 },
    ];

    // Use primary/secondary colors from design tokens
    const COLORS = ['#94A3B8', '#10b981']; // Gray for Cost, Secondary (emerald) for Profit

    // If loss, show red
    if (netProfit < 0) {
        data[1] = { name: 'Pérdida', value: Math.abs(netProfit) };
        COLORS[1] = '#EF4444';
    }

    // Determine trend direction for ROI
    const isPositive = roi >= 0;
    const isExcellent = roi > 15;
    const isCritical = roi < 0;

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            {/* Gradient accent overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl -z-0"></div>
            
            <div className="relative z-10">
                <h3 className="text-sm font-bold text-slate-600 mb-6 uppercase flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        💰 Rentabilidad
                    </span>
                    {isExcellent && (
                        <span className="text-secondary-600 flex items-center gap-1 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                            </svg>
                            Excelente
                        </span>
                    )}
                    {isCritical && (
                        <span className="text-red-500 flex items-center gap-1 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Crítico
                        </span>
                    )}
                </h3>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-48 w-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => `$${value.toLocaleString()}`}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text with enhanced styling */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-xs text-slate-400 font-semibold tracking-wide">ROI</span>
                            <span className={`text-3xl font-display font-bold tabular-nums ${
                                roi >= 0 ? 'text-slate-800' : 'text-red-500'
                            }`}>
                                {roi}%
                            </span>
                            {/* Trend indicator */}
                            <div className="mt-1">
                                {isPositive ? (
                                    <svg className="w-5 h-5 text-secondary-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                        {/* Metric cards with enhanced styling */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-100 hover:border-primary-200 transition-all duration-200">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-slate-600 font-medium">Valor Mercado</span>
                                </div>
                                <span className="font-display text-xl font-bold text-slate-800 tabular-nums">
                                    ${marketValue.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-100 hover:border-primary-200 transition-all duration-200">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-slate-600 font-medium">Costo Total</span>
                                </div>
                                <span className="font-display text-xl font-bold text-slate-800 tabular-nums">
                                    ${totalCost.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                        <div className={`rounded-xl p-4 border-2 transition-all duration-200 ${
                            netProfit >= 0 
                                ? 'bg-gradient-to-br from-secondary-50 to-secondary-100/50 border-secondary-200' 
                                : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
                        }`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <svg className={`w-5 h-5 ${netProfit >= 0 ? 'text-secondary-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span className={`text-sm font-semibold ${netProfit >= 0 ? 'text-secondary-700' : 'text-red-700'}`}>
                                        Ganancia Neta
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-display text-2xl font-bold tabular-nums ${
                                        netProfit >= 0 ? 'text-secondary-700' : 'text-red-700'
                                    }`}>
                                        ${netProfit.toLocaleString()}
                                    </span>
                                    {netProfit >= 0 ? (
                                        <svg className="w-6 h-6 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
