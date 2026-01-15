import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Capture event
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible && !isIOS) return null;

    // Don't show if already in standalone mode (checked in useEffect but good to double check)
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
        return null;
    }

    return (
        <div className={`fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-slate-700 animate-slide-up ${isVisible || isIOS ? 'flex' : 'hidden'}`}>
            <div className="flex items-center gap-3">
                <div className="bg-primary-500 p-2 rounded-xl">
                    <span className="text-xl">🐷</span>
                </div>
                <div>
                    <h3 className="font-bold text-sm">Instalar Granja App</h3>
                    <p className="text-xs text-slate-300">
                        {isIOS
                            ? "Toca 'Compartir' y luego 'Agregar a Inicio'"
                            : "Acceso rápido y sin conexión"}
                    </p>
                </div>
            </div>

            {!isIOS && (
                <button
                    onClick={handleInstall}
                    className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Instalar
                </button>
            )}

            {isIOS && (
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-white p-2"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
