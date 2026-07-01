// src/hooks/useCart.js
import { useState, useContext, createContext, useCallback } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'aurum_cart_v2';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  const persist = useCallback((newItems) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  }, []);

  const addToCart = useCallback((product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      const updated = existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { ...product, qty }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setItems(prev => {
      const updated = prev.map(i => i.id === productId ? { ...i, qty } : i);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '[]');
    setItems([]);
  }, []);

  const totalItems    = items.reduce((s, i) => s + i.qty, 0);
  const subtotal      = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax           = Math.round(subtotal * 0.18);
  const total         = subtotal + tax;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, subtotal, tax, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
