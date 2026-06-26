// src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { fetchProducts } from '../lib/productService';
import styles from './HomePage.module.css';

const CATEGORIES = [
  { key: 'Jewellery',   emoji: '💎', label: 'Jewellery',   sub: 'Fine Gems & Metals'    },
  { key: 'Watches',     emoji: '⌚', label: 'Watches',     sub: 'Timeless Precision'     },
  { key: 'Accessories', emoji: '👜', label: 'Accessories', sub: 'Leather & Silk'         },
  { key: 'Fragrance',   emoji: '🌹', label: 'Fragrance',   sub: 'Rare Essences'          },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchProducts({ limit: 4 }).then(p => { setFeatured(p.slice(0,4)); setLoading(false); });
  }, []);

  return (
    <main className="fade-in">
      {/* ── HERO ──────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>The New Season Collection</p>
          <h1 className={styles.heroTitle}>Where <em>Luxury</em><br/>Meets Legacy</h1>
          <div className={styles.heroDivider} />
          <p className={styles.heroSub}>Curated for the connoisseur</p>
          <div className={styles.heroCtas}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>
              Explore Collection
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/shop?tag=new arrival')}>
              New Arrivals
            </button>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────── */}
      <section className={`section ${styles.catSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Explore by Category</h2>
          <p className={styles.sectionSub}>Exceptional craftsmanship in every category</p>
          <div className={styles.categories}>
            {CATEGORIES.map(cat => (
              <div key={cat.key} className={styles.catCard} onClick={() => navigate(`/shop/${cat.key}`)}>
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <p className={styles.catName}>{cat.label}</p>
                <p className={styles.catSub}>{cat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ──────────────────────────────── */}
      <section className={`section ${styles.featuredSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle} style={{fontStyle:'italic'}}>Featured Pieces</h2>
          <p className={styles.sectionSub}>Hand-selected by our curators</p>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <div className={styles.grid}>
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          <div className={styles.viewAll}>
            <Link to="/shop" className="btn btn-outline">View Full Collection</Link>
          </div>
        </div>
      </section>

      {/* ── PROMISE BANNER ────────────────────────── */}
      <section className={styles.promise}>
        <div className="container">
          <p className={styles.promiseEyebrow}>The AURUM Promise</p>
          <h2 className={styles.promiseTitle}>Every piece tells a story of unparalleled craftsmanship</h2>
          <div className={styles.promiseGrid}>
            {[['✦','Authenticated','Every piece verified by experts'],
              ['✦','Insured Delivery','White-glove, fully insured shipping'],
              ['✦','Lifetime Service','Complimentary cleaning & polishing'],
              ['✦','Bespoke Orders','Tailor-made to your vision'],
            ].map(([icon, title, sub]) => (
              <div key={title} className={styles.promisePillar}>
                <span className={styles.promiseIcon}>{icon}</span>
                <p className={styles.promisePillarTitle}>{title}</p>
                <p className={styles.promisePillarSub}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
