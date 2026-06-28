// src/App.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { ThemeProvider } from './hooks/useTheme';

import Navbar         from './components/Navbar';
import ToastContainer from './components/ToastContainer';

import HomePage       from './pages/HomePage';
import ShopPage       from './pages/ShopPage';
import ProductPage    from './pages/ProductPage';
import CartPage       from './pages/CartPage';
import CheckoutPage   from './pages/CheckoutPage';
import MyOrdersPage   from './pages/MyOrdersPage';
import ProfilePage    from './pages/ProfilePage';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import OwnerLoginPage from './pages/OwnerLoginPage';
import AdminPage      from './pages/AdminPage';
import NotFoundPage   from './pages/NotFoundPage';

// ── Toast Context ─────────────────────────────────────────
export const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

// ── Protected Route — must be logged in ──────────────────
function AuthRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
    if (!user)   return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    return children;
}

// ── Protected Route — must be owner ──────────────────────
function OwnerRoute({ children }) {
    const { user, isOwner, loading } = useAuth();
    if (loading)          return <div className="spinner-wrap"><div className="spinner" /></div>;
    if (!user || !isOwner) return <Navigate to="/owner-login" replace />;
    return children;
}

// ── App Shell ─────────────────────────────────────────────
function AppShell() {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = '') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            <Navbar />
            <Routes>
                <Route path="/"               element={<HomePage />} />
                <Route path="/shop"           element={<ShopPage />} />
                <Route path="/shop/:category" element={<ShopPage />} />
                <Route path="/product/:id"    element={<ProductPage />} />
                <Route path="/cart"           element={<CartPage />} />
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/register"       element={<RegisterPage />} />
                <Route path="/owner-login"    element={<OwnerLoginPage />} />

                {/* Protected: must be logged in */}
                <Route path="/checkout"   element={<AuthRoute><CheckoutPage /></AuthRoute>} />
                <Route path="/my-orders"  element={<AuthRoute><MyOrdersPage /></AuthRoute>} />
                <Route path="/profile"    element={<AuthRoute><ProfilePage /></AuthRoute>} />

                {/* Protected: owner only */}
                <Route path="/admin"  element={<OwnerRoute><AdminPage /></OwnerRoute>} />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
}

// ── Root ──────────────────────────────────────────────────
export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <AppShell />
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
