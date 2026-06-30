// src/components/ProductCardSkeleton.js
// Mimics ProductCard's exact layout so the page doesn't "jump"
// when real data replaces the skeleton.
import React from 'react';
import styles from './ProductCard.module.css';

export default function ProductCardSkeleton() {
    return (
        <div className={`${styles.card} skeleton-card`} aria-hidden="true">
            <div className={`${styles.imageWrap} skeleton`} />
            <div className={styles.info}>
                <div className="skeleton skeleton-text sm w-40" />
                <div className="skeleton skeleton-text lg w-80" style={{ marginTop: 6 }} />
                <div className={styles.footer} style={{ marginTop: 10 }}>
                    <div className="skeleton skeleton-text w-25" style={{ marginBottom: 0 }} />
                    <div className="skeleton skeleton-text w-25" style={{ marginBottom: 0, width: 36 }} />
                </div>
            </div>
        </div>
    );
}

/** Render `count` skeleton cards in a grid — drop-in replacement while loading */
export function ProductGridSkeleton({ count = 8 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </>
    );
}
