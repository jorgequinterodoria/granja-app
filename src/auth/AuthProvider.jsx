import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize from LocalStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedPerms = localStorage.getItem('permissions');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            if (storedPerms) setPermissions(JSON.parse(storedPerms));
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            // Replace with your actual API URL
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Login failed');
            }

            const data = await res.json();

            // Save State
            setToken(data.token);
            setUser(data.user);
            setPermissions(data.permissions);

            // Persist
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('permissions', JSON.stringify(data.permissions));

            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setPermissions([]);
        localStorage.clear();
        // Maybe clear local DB or keep it? Offline-first usually keeps it but might warn user.
    };

    const hasPermission = (slug) => {
        return permissions.includes(slug) || permissions.includes('admin.manage');
    };

    return (
        <AuthContext.Provider value={{ user, token, permissions, login, logout, loading, hasPermission }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
