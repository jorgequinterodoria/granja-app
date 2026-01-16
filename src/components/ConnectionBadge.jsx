import { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';
import Spinner from './Spinner';

export default function ConnectionBadge() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        const loadPending = async () => {
            const total = await syncService.getPendingCount();
            if (mounted) setPendingCount(total);
        };
        loadPending();
        const interval = setInterval(loadPending, 5000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleOnline = async () => {
            setIsOnline(true);
            try {
                setIsSyncing(true);
                await syncService.sync();
            } finally {
                setIsSyncing(false);
            }
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleManualSync = async () => {
        if (isSyncing) return;
        
        setIsSyncing(true);
        setSyncProgress('Iniciando sincronización...');
        
        try {
            setSyncProgress('Sincronizando datos...');
            const result = await syncService.sync();
            setSyncProgress(`Sincronizado: ${result.count} elementos`);
            
            // Show success message briefly
            setTimeout(() => {
                setSyncProgress(null);
            }, 2000);
        } catch (e) {
            setSyncProgress('Error en sincronización');
            setTimeout(() => {
                setSyncProgress(null);
            }, 3000);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 items-end">
            {/* Online/Offline Status Badge with Glassmorphism */}
            <div className={`glass-dark px-5 py-2.5 rounded-full font-semibold shadow-lg flex items-center gap-2.5 backdrop-blur-xl transition-all duration-300 ${
                isOnline 
                    ? 'text-secondary-100 shadow-glow' 
                    : 'text-red-100'
            }`}>
                <span className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    isOnline 
                        ? 'bg-secondary-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]' 
                        : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'
                }`}></span>
                <span className="text-sm font-bold tracking-wide">
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>

            {/* Pending Sync Badge with Glassmorphism */}
            {(pendingCount > 0 || isSyncing) && (
                <button
                    onClick={handleManualSync}
                    disabled={!isOnline || isSyncing}
                    className="glass-card px-5 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-accent-800 hover:text-accent-900"
                >
                    {isSyncing ? (
                        <>
                            <Spinner size="sm" color="accent" />
                            <span className="text-sm font-bold">Sincronizando...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-sm font-bold">{pendingCount} Pendientes</span>
                            <span className="text-lg">☁️</span>
                        </>
                    )}
                </button>
            )}

            {/* Sync Progress Message */}
            {syncProgress && (
                <div className="glass-card px-4 py-2 rounded-lg text-sm font-medium text-slate-700 shadow-lg max-w-xs text-center">
                    {syncProgress}
                </div>
            )}
        </div>
    );
}
