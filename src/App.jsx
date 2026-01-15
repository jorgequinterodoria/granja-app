import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { syncService } from './services/syncService';
import PigForm from './components/PigForm';
import PigList from './components/PigList';
import PigDetail from './components/PigDetail';
import ConnectionBadge from './components/ConnectionBadge';
import BiosecurityAccess from './components/BiosecurityAccess';
import WorkerLeaderboard from './components/WorkerLeaderboard';

// Feed Module Components
import InventoryManager from './components/InventoryManager';
import FeedingForm from './components/FeedingForm';

function FeedPage() {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-800">🌽 Gestión de Alimentación</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <FeedingForm />
                <InventoryManager />
            </div>
        </div>
    );
}

function App() {
    // Try to sync on mount and periodically
    useEffect(() => {
        syncService.sync();

        const interval = setInterval(() => {
            syncService.sync();
        }, 60000); // Auto-sync every minute

        return () => clearInterval(interval);
    }, []);

    return (
        <Router>
            <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-20">

                {/* Navbar */}
                <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2 hover:text-blue-300 transition-colors">
                            🐷 Granja Porcina
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link to="/alimentacion" className="hidden md:block text-sm font-bold text-slate-300 hover:text-white transition-colors">
                                🌽 Alimentación
                            </Link>
                            <Link to="/bioseguridad" className="hidden md:block text-sm font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700">
                                🛡️ Bioseguridad
                            </Link>
                            <ConnectionBadge />
                        </div>
                    </div>
                </nav>

                <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/bioseguridad" element={<BiosecurityAccess />} />
                            <Route path="/alimentacion" element={<FeedPage />} />
                        </Routes>
                    </div>

                    {/* Sidebar / Widgets */}
                    <div className="space-y-8">
                        <WorkerLeaderboard />

                        {/* Mobile Links */}
                        <div className="md:hidden space-y-2">
                            <Link to="/alimentacion" className="block w-full text-center font-bold bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-slate-700">
                                🌽 Ir a Alimentación
                            </Link>
                            <Link to="/bioseguridad" className="block w-full text-center font-bold bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-slate-700">
                                🛡️ Ir a Bioseguridad
                            </Link>
                        </div>

                        <Routes>
                            <Route path="/" element={<PigForm />} />
                        </Routes>
                    </div>

                </div>
            </div>
        </Router>
    );
}

function Home() {
    const [selectedPigId, setSelectedPigId] = useState(null);

    if (selectedPigId) {
        return <PigDetail pigId={selectedPigId} onBack={() => setSelectedPigId(null)} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-700">Ganado Porcino</h2>
            </div>
            <PigList onSelectPig={setSelectedPigId} />
        </div>
    );
}

export default App;
