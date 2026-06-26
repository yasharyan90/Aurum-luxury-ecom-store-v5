// src/pages/NotFoundPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.ornament}>✦</div>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Page Not Found</h2>
        <div className={styles.divider} />
        <p className={styles.text}>
          The page you are looking for may have been moved, removed, or does not exist.
          Please return to our boutique and continue browsing our collection.
        </p>
        <div className={styles.actions}>
          <Link to="/"     className="btn btn-primary btn-lg">Return Home</Link>
          <Link to="/shop" className="btn btn-outline btn-lg">View Collection</Link>
        </div>
      </div>
    </main>
  );
}
