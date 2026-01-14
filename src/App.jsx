import { useState, useEffect } from 'react';
import { syncService } from './services/syncService';
import PigForm from './components/PigForm';
import PigList from './components/PigList';
import PigDetail from './components/PigDetail';
import ConnectionBadge from './components/ConnectionBadge';

function App() {
    const [selectedPigId, setSelectedPigId] = useState(null);

    // Try to sync on mount and periodically
    useEffect(() => {
        syncService.sync();

        const interval = setInterval(() => {
            syncService.sync();
        }, 60000); // Auto-sync every minute

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-blue-800 text-white p-6 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-extrabold">Granja Porcina 🐷</h1>
                    <p className="text-blue-200">Sistema Offline-First</p>
                </div>
            </header>

            {/* Components */}
            <ConnectionBadge />

            <main className="max-w-4xl mx-auto p-4 mt-8">
                {selectedPigId ? (
                    <PigDetail
                        pigId={selectedPigId}
                        onBack={() => setSelectedPigId(null)}
                    />
                ) : (
                    <>
                        <PigForm />
                        <PigList onSelectPig={setSelectedPigId} />
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
