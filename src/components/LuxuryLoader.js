// src/components/LuxuryLoader.js
// Full luxury ring loader — gold double-ring spin with pulsing core.
// Use for page-level / full-section loading states (replaces the old
// plain .spinner for anything user-facing and "premium").
import React from 'react';

export default function LuxuryLoader({ label = 'Loading' }) {
  return (
    <div className="luxury-loader-wrap" role="status" aria-live="polite">
      <div className="luxury-loader">
        <div className="luxury-loader-core" />
      </div>
      {label && <span className="luxury-loader-label">{label}</span>}
    </div>
  );
}
