import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { syncService } from '../services/syncService';

export default function ConnectionBadge() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Real-time count of pending records
    const pendingCount = useLiveQuery(
        () => db.pigs.where('syncStatus').equals('pending').count()
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleManualSync = async () => {
        try {
            await syncService.sync();
        } catch (e) {
            alert('Error en sincronización');
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
            <div className={`px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
            </div>

            {pendingCount > 0 && (
                <button
                    onClick={handleManualSync}
                    disabled={!isOnline}
                    className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                >
                    {pendingCount} Pendientes ☁️
                </button>
            )}
        </div>
    );
}
