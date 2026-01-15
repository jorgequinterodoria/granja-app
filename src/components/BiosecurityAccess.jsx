import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

export default function BiosecurityAccess() {
    const [form, setForm] = useState({
        visitor_name: '',
        company: '',
        vehicle_plate: '',
        origin: '',
        risk_level: 'Bajo'
    });

    const [showAlert, setShowAlert] = useState(false);

    const checkRisk = (origin) => {
        // Simple heuristic for demo
        const riskyTerms = ['matadero', 'feria', 'otra granja', 'mercado', 'hospital'];
        const isRisky = riskyTerms.some(term => origin.toLowerCase().includes(term));
        return isRisky;
    };

    const handleOriginChange = (e) => {
        const val = e.target.value;
        const isRisky = checkRisk(val);
        setForm({
            ...form,
            origin: val,
            risk_level: isRisky ? 'Alto' : 'Bajo'
        });
        setShowAlert(isRisky);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.risk_level === 'Alto') {
            // Block or require override
            const confirm = window.confirm("⚠️ ALERTA DE BIOSEGURIDAD: El origen representa un riesgo Alto. ¿Autoriza ingreso bajo protocolo de cuarentena?");
            if (!confirm) return;
        }

        try {
            await db.access_logs.add({
                id: uuidv4(),
                ...form,
                entry_time: new Date().toISOString(),
                syncStatus: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            alert("✅ Acceso Registrado");
            setForm({ visitor_name: '', company: '', vehicle_plate: '', origin: '', risk_level: 'Bajo' });
            setShowAlert(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                🛡️ Control de Acceso <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Zona Limpia</span>
            </h2>

            {showAlert && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r animate-pulse">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            ⛔️
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-red-800">PROHIBIDO EL INGRESO</h3>
                            <div className="text-sm text-red-700">
                                <p>Riesgo Biológico Detectado. Origen externo de alto riesgo. Aplique protocolo de ducha y cuarentena de 48h.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Visitante</label>
                        <input
                            required
                            value={form.visitor_name}
                            onChange={e => setForm({ ...form, visitor_name: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200"
                            placeholder="Nombre completo"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Empresa</label>
                        <input
                            value={form.company}
                            onChange={e => setForm({ ...form, company: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200"
                            placeholder="Empresa / Motivo"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Origen (¿De dónde viene?)</label>
                    <input
                        required
                        value={form.origin}
                        onChange={handleOriginChange}
                        className={`w-full p-3 rounded-lg border-2 ${showAlert ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                        placeholder="Ej: Casa, Otra Granja, Matadero..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Placa Vehículo</label>
                        <input
                            value={form.vehicle_plate}
                            onChange={e => setForm({ ...form, vehicle_plate: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nivel de Riesgo</label>
                        <select
                            value={form.risk_level}
                            onChange={e => setForm({ ...form, risk_level: e.target.value })}
                            className={`w-full p-3 rounded-lg border font-bold ${form.risk_level === 'Alto' ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                        >
                            <option value="Bajo">Bajo (Seguro)</option>
                            <option value="Medio">Medio (Precaución)</option>
                            <option value="Alto">Alto (Peligro)</option>
                        </select>
                    </div>
                </div>

                <button className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${showAlert ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
                    {showAlert ? '🚨 AUTORIZAR BAJO RESPONSABILIDAD' : '✅ Registrar Ingreso'}
                </button>
            </form>
        </div>
    );
}
