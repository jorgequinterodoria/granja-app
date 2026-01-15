import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('fadeIn');

    // Simple key-based remount animation
    return (
        <div
            key={location.pathname}
            className="animate-fade-in-up"
        >
            {children}
        </div>
    );
}
