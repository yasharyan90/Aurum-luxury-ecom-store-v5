// src/components/ProductCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useToast } from '../App';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const toast = useToast();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast(`${product.name} added to your selection`, 'success');
  };

  const formatPrice = (price) =>
    '₹' + Number(price).toLocaleString('en-IN');

  return (
    <div className={styles.card} onClick={() => navigate(`/product/${product.id}`)}>
      {product.badge && <span className={styles.badge}>{product.badge}</span>}
      <button
        className={styles.wishlistBtn}
        onClick={(e) => { e.stopPropagation(); toast('Added to wishlist ♡', 'success'); }}
        aria-label="Add to wishlist"
      >
        ♡
      </button>

      <div className={styles.imageWrap}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className={styles.productImg} />
        ) : null}
        <div className={`${styles.emoji} ${product.image_url ? styles.emojiSmall : ''}`}>
          {product.emoji || '💎'}
        </div>
        <div className={styles.overlay}>
          <button className="btn btn-outline btn-sm" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <p className={styles.brand}>{product.brand}</p>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {product.rating > 0 && (
            <span className={styles.rating}>★ {product.rating}</span>
          )}
        </div>
        {product.stock <= 3 && product.stock > 0 && (
          <p className={styles.lowStock}>Only {product.stock} left</p>
        )}
        {product.stock === 0 && (
          <p className={styles.outOfStock}>Out of Stock</p>
        )}
      </div>
    </div>
  );
}
