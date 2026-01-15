import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import PageTransition from './components/PageTransition';
import InstallPrompt from './components/InstallPrompt';

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

function Navbar() {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Track scroll position for enhanced shadow effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check if a route is active
    const isActive = (path) => location.pathname === path;

    return (
        <nav
            className={`
                glass-dark sticky top-0 z-50 
                transition-all duration-300 ease-smooth
                ${isScrolled ? 'shadow-2xl shadow-slate-900/30' : 'shadow-lg shadow-slate-900/20'}
            `}
        >
            {/* Enhanced gradient overlay for visual depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-primary-800/10 to-accent-900/30 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 py-4 relative">
                <div className="flex justify-between items-center">
                    {/* Logo with enhanced hover effect */}
                    <Link
                        to="/"
                        className={`
                            text-2xl font-black tracking-tight flex items-center gap-2 
                            transition-all duration-300 ease-smooth
                            hover:scale-105 active:scale-95
                            ${isActive('/')
                                ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                : 'text-slate-200 hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]'
                            }
                        `}
                    >
                        🐷 Granja Porcina
                    </Link>

                    {/* Desktop Navigation with enhanced styling */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            to="/alimentacion"
                            className={`
                                relative text-sm font-bold px-5 py-2.5 rounded-xl
                                transition-all duration-300 ease-smooth
                                hover:scale-105 active:scale-95
                                ${isActive('/alimentacion')
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/50 ring-2 ring-primary-400/50'
                                    : 'text-slate-200 hover:text-white hover:bg-white/15 hover:shadow-md backdrop-blur-sm'
                                }
                            `}
                        >
                            {isActive('/alimentacion') && (
                                <span className="absolute inset-0 rounded-xl bg-white/20 animate-pulse-glow" />
                            )}
                            <span className="relative flex items-center gap-2">
                                🌽 Alimentación
                            </span>
                        </Link>
                        <Link
                            to="/bioseguridad"
                            className={`
                                relative text-sm font-bold px-5 py-2.5 rounded-xl
                                border-2 transition-all duration-300 ease-smooth
                                hover:scale-105 active:scale-95
                                ${isActive('/bioseguridad')
                                    ? 'bg-gradient-to-r from-accent-600 to-accent-500 text-white border-accent-400 shadow-lg shadow-accent-500/50 ring-2 ring-accent-400/50'
                                    : 'bg-white/5 border-white/30 text-slate-200 hover:text-white hover:bg-white/15 hover:border-white/50 hover:shadow-md backdrop-blur-sm'
                                }
                            `}
                        >
                            {isActive('/bioseguridad') && (
                                <span className="absolute inset-0 rounded-xl bg-white/20 animate-pulse-glow" />
                            )}
                            <span className="relative flex items-center gap-2">
                                🛡️ Bioseguridad
                            </span>
                        </Link>
                        <ConnectionBadge />
                    </div>

                    {/* Mobile Hamburger Menu Button with enhanced animation */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-white p-2.5 rounded-xl hover:bg-white/15 active:bg-white/20 transition-all duration-300 ease-smooth hover:scale-105 active:scale-95"
                        aria-label="Toggle menu"
                    >
                        <div className="w-6 h-5 flex flex-col justify-between">
                            <span
                                className={`
                                    block h-0.5 w-full bg-white rounded-full
                                    transition-all duration-300 ease-smooth origin-center
                                    ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}
                                `}
                            />
                            <span
                                className={`
                                    block h-0.5 w-full bg-white rounded-full
                                    transition-all duration-300 ease-smooth
                                    ${isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
                                `}
                            />
                            <span
                                className={`
                                    block h-0.5 w-full bg-white rounded-full
                                    transition-all duration-300 ease-smooth origin-center
                                    ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}
                                `}
                            />
                        </div>
                    </button>
                </div>

                {/* Mobile Menu with enhanced animations */}
                <div
                    className={`
                        md:hidden overflow-hidden
                        transition-all duration-300 ease-smooth
                        ${isMobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}
                    `}
                >
                    <div className="flex flex-col gap-2.5 pb-2">
                        <Link
                            to="/alimentacion"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                                relative text-sm font-bold px-5 py-3.5 rounded-xl
                                transition-all duration-300 ease-smooth
                                hover:scale-[1.02] active:scale-95
                                ${isActive('/alimentacion')
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-400/50'
                                    : 'text-slate-200 hover:text-white hover:bg-white/15 backdrop-blur-sm'
                                }
                                ${isMobileMenuOpen ? 'animate-slide-up' : ''}
                            `}
                            style={{ animationDelay: '50ms' }}
                        >
                            {isActive('/alimentacion') && (
                                <span className="absolute inset-0 rounded-xl bg-white/20 animate-pulse-glow" />
                            )}
                            <span className="relative flex items-center gap-2">
                                🌽 Alimentación
                            </span>
                        </Link>
                        <Link
                            to="/bioseguridad"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                                relative text-sm font-bold px-5 py-3.5 rounded-xl border-2
                                transition-all duration-300 ease-smooth
                                hover:scale-[1.02] active:scale-95
                                ${isActive('/bioseguridad')
                                    ? 'bg-gradient-to-r from-accent-600 to-accent-500 text-white border-accent-400 shadow-lg shadow-accent-500/30 ring-2 ring-accent-400/50'
                                    : 'bg-white/5 border-white/30 text-slate-200 hover:text-white hover:bg-white/15 hover:border-white/50 backdrop-blur-sm'
                                }
                                ${isMobileMenuOpen ? 'animate-slide-up' : ''}
                            `}
                            style={{ animationDelay: '100ms' }}
                        >
                            {isActive('/bioseguridad') && (
                                <span className="absolute inset-0 rounded-xl bg-white/20 animate-pulse-glow" />
                            )}
                            <span className="relative flex items-center gap-2">
                                🛡️ Bioseguridad
                            </span>
                        </Link>
                        <div
                            className={`px-4 py-2 ${isMobileMenuOpen ? 'animate-slide-up' : ''}`}
                            style={{ animationDelay: '150ms' }}
                        >
                            <ConnectionBadge />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
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
                <InstallPrompt />

                {/* Navbar */}
                <Navbar />

                <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <Routes>
                            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                            <Route path="/bioseguridad" element={<PageTransition><BiosecurityAccess /></PageTransition>} />
                            <Route path="/alimentacion" element={<PageTransition><FeedPage /></PageTransition>} />
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
