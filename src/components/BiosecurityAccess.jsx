import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import Spinner from './Spinner';

export default function BiosecurityAccess() {
    const [form, setForm] = useState({
        visitor_name: '',
        company: '',
        vehicle_plate: '',
        origin: '',
        risk_level: 'Bajo'
    });

    const [showAlert, setShowAlert] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

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
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);
        
        if (form.risk_level === 'Alto') {
            // Block or require override
            const confirm = window.confirm("⚠️ ALERTA DE BIOSEGURIDAD: El origen representa un riesgo Alto. ¿Autoriza ingreso bajo protocolo de cuarentena?");
            if (!confirm) {
                setIsSubmitting(false);
                return;
            }
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
            setSuccess(true);
            setForm({ visitor_name: '', company: '', vehicle_plate: '', origin: '', risk_level: 'Bajo' });
            setShowAlert(false);
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            setError("Error al registrar acceso");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                🛡️ Control de Acceso <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Zona Limpia</span>
            </h2>

            {showAlert && (
                <div className="mb-6 glass-card border-l-4 border-accent-500 p-4 rounded-r">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-2xl animate-pulse-glow">⛔️</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-accent-800 flex items-center gap-2">
                                PROHIBIDO EL INGRESO
                                <span className="bg-accent-500 text-white text-xs px-2 py-1 rounded-full animate-pulse-glow">ALTO RIESGO</span>
                            </h3>
                            <div className="text-sm text-accent-700">
                                <p>Riesgo Biológico Detectado. Origen externo de alto riesgo. Aplique protocolo de ducha y cuarentena de 48h.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                        <p className="text-sm text-secondary-700 mt-1">Acceso registrado correctamente</p>
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

                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 ${showAlert ? 'bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 hover:shadow-xl hover:scale-105 active:scale-95' : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 hover:shadow-xl hover:scale-105 active:scale-95'}`}
                >
                    {isSubmitting ? (
                        <>
                            <Spinner size="sm" color="white" />
                            <span>Registrando...</span>
                        </>
                    ) : (
                        showAlert ? '🚨 AUTORIZAR BAJO RESPONSABILIDAD' : '✅ Registrar Ingreso'
                    )}
                </button>
            </form>
        </div>
    );
}
