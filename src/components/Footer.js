// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>AURUM</div>
          <p className={styles.tagline}>Est. MMXXIV · Luxury Boutique</p>
          <p className={styles.desc}>
            Curating the world's finest luxury goods — from rare jewels to precision timepieces — for those who appreciate the extraordinary.
          </p>
        </div>

        <div>
          <p className={styles.heading}>Collections</p>
          <Link to="/shop/Jewellery"    className={styles.link}>Fine Jewellery</Link>
          <Link to="/shop/Watches"      className={styles.link}>Timepieces</Link>
          <Link to="/shop/Clothing"     className={styles.link}>Clothing</Link>
          <Link to="/shop/Accessories"  className={styles.link}>Accessories</Link>
          <Link to="/shop/Fragrance"    className={styles.link}>Fragrance</Link>
        </div>

        <div>
          <p className={styles.heading}>Client Services</p>
          <Link to="/track-order"        className={styles.link}>Track Your Order</Link>
          <a href="mailto:concierge@aurum-boutique.com" className={styles.link}>Private Appointments</a>
          <a href="mailto:concierge@aurum-boutique.com" className={styles.link}>Bespoke Orders</a>
          <Link to="/track-order"        className={styles.link}>Returns & Care</Link>
        </div>

        <div>
          <p className={styles.heading}>The House</p>
          <span className={styles.link}>Our Story</span>
          <span className={styles.link}>Craftsmanship</span>
          <span className={styles.link}>Sustainability</span>
          <Link to="/owner-login"       className={styles.link}>Owner Portal</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© 2024 AURUM Luxury Boutique. All rights reserved.</span>
        <span>Crafted with precision · Delivered with care.</span>
      </div>
    </footer>
  );
}
