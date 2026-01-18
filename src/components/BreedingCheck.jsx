import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Spinner from './Spinner';

export default function BreedingCheck({ boarId, sowId }) {
    const { hasPermission, token } = useAuth();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Only Admin can see this advanced feature
    if (!hasPermission('admin.manage')) return null;
    
    // Don't run if ids are missing
    if (!boarId || !sowId) return null;

    useEffect(() => {
        const checkGenetics = async () => {
            setLoading(true);
            setResult(null);
            
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                const res = await fetch(`${API_URL}/pigs/check-breeding?boarId=${boarId}&sowId=${sowId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setResult(data);
                } else {
                    console.error('Error checking breeding compatibility');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            checkGenetics();
        }, 500); // Debounce

        return () => clearTimeout(timer);
    }, [boarId, sowId, token]);

    if (loading) {
        return (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Spinner size="xs" /> Verificando genética...
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className={`mt-3 p-3 rounded-lg border text-sm flex items-start gap-3 transition-all duration-300
            ${result.safe ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            
            <div className="text-xl">
                {result.safe ? '🧬' : '⚠️'}
            </div>
            
            <div>
                <p className="font-bold">
                    {result.safe ? 'Compatibilidad Genética Aprobada' : 'Alerta de Consanguinidad'}
                </p>
                {!result.safe && (
                    <p className="mt-1 text-xs opacity-90">
                        {result.warning}
                    </p>
                )}
            </div>
        </div>
    );
}
