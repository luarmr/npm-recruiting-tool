import React, { createContext, useContext, useState } from 'react';

interface AuthUIContextType {
    isAuthOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthUIContext = createContext<AuthUIContextType | undefined>(undefined);

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const openAuthModal = () => setIsAuthOpen(true);
    const closeAuthModal = () => setIsAuthOpen(false);

    return (
        <AuthUIContext.Provider value={{ isAuthOpen, openAuthModal, closeAuthModal }}>
            {children}
        </AuthUIContext.Provider>
    );
}

export function useAuthUI() {
    const context = useContext(AuthUIContext);
    if (context === undefined) {
        throw new Error('useAuthUI must be used within an AuthUIProvider');
    }
    return context;
}
