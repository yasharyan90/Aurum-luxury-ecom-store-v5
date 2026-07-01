// src/pages/ShopPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import Footer from '../components/Footer';
import { fetchProducts } from '../lib/productService';
import styles from './ShopPage.module.css';

const CATEGORIES = ['', 'Jewellery', 'Watches', 'Clothing', 'Accessories', 'Fragrance'];

export default function ShopPage() {
  const { category: routeCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState(routeCategory || searchParams.get('category') || '');
  const [sort,     setSort]     = useState('newest');
  const search = searchParams.get('search') || '';

  const load = useCallback(async () => {
    setLoading(true);
    let data = await fetchProducts({ category, search });
    if (sort === 'price-low')  data = [...data].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') data = [...data].sort((a, b) => b.price - a.price);
    if (sort === 'rating')     data = [...data].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    setProducts(data);
    setLoading(false);
  }, [category, search, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (routeCategory) setCategory(routeCategory); }, [routeCategory]);

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.delete('search'); return p; });
  };

  const pageTitle = category || (search ? `Results for "${search}"` : 'The Collection');

  return (
    <main className="fade-in">
      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          <span className={styles.filterLabel}>Filter:</span>
          <select className={styles.filterSelect} value={category} onChange={handleCategoryChange}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>

          <span className={styles.filterLabel}>Sort:</span>
          <select className={styles.filterSelect} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          <span className={styles.count}>{loading ? '…' : `${products.length} pieces`}</span>

          {(category || search) && (
            <button
              className={styles.clearBtn}
              onClick={() => { setCategory(''); setSearchParams({}); }}
            >
              Clear filters ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>{pageTitle}</h1>
          <p className={styles.subtitle}>Discover our curated luxury pieces</p>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <section className="section">
        <div className="container">
          {loading ? (
            <div className={styles.grid}>
              <ProductGridSkeleton count={8} />
            </div>
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No pieces found</h3>
              <p>Try adjusting your filters or search term</p>
              <button className="btn btn-outline" onClick={() => { setCategory(''); setSearchParams({}); }}>
                View All
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
