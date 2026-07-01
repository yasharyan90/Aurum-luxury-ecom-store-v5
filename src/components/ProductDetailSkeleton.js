// src/components/ProductDetailSkeleton.js
import React from 'react';
import styles from '../pages/ProductPage.module.css';

export default function ProductDetailSkeleton() {
  return (
    <div className={styles.layout} aria-hidden="true">
      <div className={`${styles.imageWrap} skeleton`} style={{ aspectRatio: 'auto' }} />
      <div className={styles.info}>
        <div className="skeleton skeleton-text sm w-25" />
        <div className="skeleton skeleton-text lg w-80" style={{ height: 36, marginTop: 10 }} />
        <div className="skeleton skeleton-text w-40" style={{ marginTop: 14 }} />
        <div className="skeleton skeleton-text lg w-40" style={{ height: 28, marginTop: 16 }} />
        <div className="divider" style={{ margin: '1.5rem 0' }} />
        <div className="skeleton skeleton-text w-full" />
        <div className="skeleton skeleton-text w-full" />
        <div className="skeleton skeleton-text w-60" />
      </div>
    </div>
  );
}
