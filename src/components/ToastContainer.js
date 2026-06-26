// src/components/ToastContainer.js
import React from 'react';

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || ''} fade-in`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
