import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { syncService } from './services/syncService';
import { AuthProvider, useAuth } from './auth/AuthProvider';

// Existing Components
import PigForm from './components/PigForm';
import PigList from './components/PigList';
import PigDetail from './components/PigDetail';
import ConnectionBadge from './components/ConnectionBadge';
import BiosecurityAccess from './components/BiosecurityAccess';
import WorkerLeaderboard from './components/WorkerLeaderboard';
import InventoryManager from './components/InventoryManager';
import LowStockAlert from './components/LowStockAlert';
import FeedingForm from './components/FeedingForm';
import PageTransition from './components/PageTransition';
import InstallPrompt from './components/InstallPrompt';
import DailyTasks from './components/DailyTasks'; // Imported

// SaaS Pages
import Login from './pages/Login';
import FarmSettings from './pages/FarmSettings';
import SaaSPigForm from './pages/PigForm';
import SaaSFeedingLog from './pages/FeedingLog';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Helper for Protected Routes
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

// SuperAdmin Only Route
const SuperAdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    if (user.farmId) return <Navigate to="/" />; // Regular users can't access SuperAdmin
    return children;
};

// Farm Admin Route (users WITH farmId)
const FarmAdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    if (!user.farmId) return <Navigate to="/superadmin" />; // SuperAdmin redirected to their dashboard
    return children;
};

// Existing Feed Page (Hybrid)
function FeedPage() {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-800">🌽 Gestión de Alimentación</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-600">Inventario</h3>
                    <InventoryManager />
                </div>
            </div>
        </div>
    );
}

function Navbar() {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => location.pathname === path;

    // If not logged in and not on login page, we might want to hide navbar or show minimal
    // ALSO HIDE ON LOGIN PAGE to avoid white frame
    if (location.pathname === '/login') return null;
    if (!user && location.pathname !== '/login') return null;

    return (
        <nav
            className={`
                glass-dark sticky top-0 z-50 
                transition-all duration-300 ease-smooth
                ${isScrolled ? 'shadow-2xl shadow-slate-900/30' : 'shadow-lg shadow-slate-900/20'}
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-primary-800/10 to-accent-900/30 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 py-4 relative">
                <div className="flex justify-between items-center">
                    <Link
                        to="/"
                        className={`
                            text-2xl font-black tracking-tight flex items-center gap-2 
                            transition-all duration-300 ease-smooth
                            hover:scale-105 active:scale-95
                            ${isActive('/') ? 'text-white' : 'text-slate-200'}
                        `}
                    >
                        🐷 Granja SaaS
                    </Link>

                    {user && (
                        <div className="hidden md:flex items-center gap-3">
                            {/* SuperAdmin Menu */}
                            {!user.farmId ? (
                                <>
                                    <Link to="/superadmin" className={`text-sm font-bold px-4 py-2 rounded-xl text-slate-200 hover:bg-white/10 ${isActive('/superadmin') ? 'bg-white/10' : ''}`}>
                                        🏭 Granjas
                                    </Link>
                                </>
                            ) : (
                                /* Farm Admin Menu */
                                <>
                                    <Link to="/features" className={`text-sm font-bold px-4 py-2 rounded-xl text-slate-200 hover:bg-white/10 ${isActive('/features') ? 'bg-white/10' : ''}`}>
                                        🏠 Dashboard
                                    </Link>
                                    <Link to="/pigs/new" className={`text-sm font-bold px-4 py-2 rounded-xl text-slate-200 hover:bg-white/10 ${isActive('/pigs/new') ? 'bg-white/10' : ''}`}>
                                        ➕ Cerdo
                                    </Link>
                                    <Link to="/feeding" className={`text-sm font-bold px-4 py-2 rounded-xl text-slate-200 hover:bg-white/10 ${isActive('/feeding') ? 'bg-white/10' : ''}`}>
                                        🌽 Masivo
                                    </Link>
                                    <Link to="/alimentacion" className={`text-sm font-bold px-4 py-2 rounded-xl text-slate-200 hover:bg-white/10 ${isActive('/alimentacion') ? 'bg-white/10' : ''}`}>
                                        📦 Inventario
                                    </Link>
                                    <Link to="/settings" className={`text-sm font-bold px-4 py-2 rounded-xl text-slate-200 hover:bg-white/10 ${isActive('/settings') ? 'bg-white/10' : ''}`}>
                                        ⚙️ Config
                                    </Link>
                                </>
                            )}

                            <div className="h-6 w-px bg-slate-600 mx-2"></div>

                            <button onClick={logout} className="text-sm font-bold text-red-400 hover:text-red-300">
                                Salir
                            </button>

                            {user.farmId && <ConnectionBadge />}
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-white p-2"
                    >
                        <span className="text-xl">☰</span>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && user && (
                    <div className="md:hidden mt-4 pb-4 space-y-2">
                        {!user.farmId ? (
                            /* SuperAdmin Mobile Menu */
                            <>
                                <Link to="/superadmin" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-200 hover:text-white py-2">Granjas</Link>
                            </>
                        ) : (
                            /* Farm Admin Mobile Menu */
                            <>
                                <Link to="/pigs/new" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-200 hover:text-white py-2">Nuevo Cerdo</Link>
                                <Link to="/feeding" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-200 hover:text-white py-2">Alimentación Masiva</Link>
                                <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-200 hover:text-white py-2">Configuración</Link>
                            </>
                        )}
                        <button onClick={() => { logout(); setIsMobileMenuOpen(false) }} className="block text-red-400 py-2">Cerrar Sesión</button>
                    </div>
                )}
            </div>
        </nav>
    );
}

function App() {
    useEffect(() => {
        // Init sync
        syncService.sync();
        const interval = setInterval(() => syncService.sync(), 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

// Separate component to use hooks like useLocation
function AppContent() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <div className={`min-h-screen font-sans ${isLoginPage ? 'bg-slate-900' : 'bg-slate-100 pb-20'}`}>
            <InstallPrompt />
            <Navbar />

            {/* If login page, don't constrain width/padding. Else use standard layout container */}
            <div className={isLoginPage ? '' : 'max-w-6xl mx-auto p-4 md:p-8'}>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />

                    {/* SuperAdmin Dashboard */}
                    <Route path="/superadmin" element={
                        <SuperAdminRoute>
                            <PageTransition><SuperAdminDashboard /></PageTransition>
                        </SuperAdminRoute>
                    } />

                    {/* Root - Redirect based on user type */}
                    <Route path="/" element={
                        <PrivateRoute>
                            <PageTransition><Home /></PageTransition>
                        </PrivateRoute>
                    } />

                    {/* Farm Admin Routes */}
                    <Route path="/pigs/new" element={
                        <FarmAdminRoute>
                            <PageTransition><SaaSPigForm /></PageTransition>
                        </FarmAdminRoute>
                    } />

                    <Route path="/feeding" element={
                        <FarmAdminRoute>
                            <PageTransition><SaaSFeedingLog /></PageTransition>
                        </FarmAdminRoute>
                    } />

                    <Route path="/settings" element={
                        <FarmAdminRoute>
                            <PageTransition><FarmSettings /></PageTransition>
                        </FarmAdminRoute>
                    } />

                    {/* Existing Routes (Protected for Farm Admins) */}
                    <Route path="/features" element={
                        <FarmAdminRoute>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <PageTransition><Home /></PageTransition>
                                </div>
                                <div className="space-y-8">
                                    <LowStockAlert />
                                    {/* Daily Tasks Widget */}
                                    <div className="h-96">
                                        <DailyTasks />
                                    </div>
                                    <WorkerLeaderboard />
                                    <div className="bg-white p-6 rounded-xl shadow-sm">
                                        <h3 className="font-bold mb-4">Acciones Rápidas</h3>
                                        <Link to="/pigs/new" className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg mb-2">
                                            Registrar Cerdo
                                        </Link>
                                        <Link to="/feeding" className="block w-full text-center bg-emerald-600 text-white py-2 rounded-lg">
                                            Alimentación Masiva
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </FarmAdminRoute>
                    } />

                    <Route path="/bioseguridad" element={<FarmAdminRoute><PageTransition><BiosecurityAccess /></PageTransition></FarmAdminRoute>} />
                    <Route path="/alimentacion" element={<FarmAdminRoute><PageTransition><FeedPage /></PageTransition></FarmAdminRoute>} />

                </Routes>
            </div>
        </div>
    );
}

function Home() {
    const { user } = useAuth();
    const [selectedPigId, setSelectedPigId] = useState(null);

    // Redirect SuperAdmin to their dashboard
    if (user && !user.farmId) {
        return <Navigate to="/superadmin" />;
    }

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
