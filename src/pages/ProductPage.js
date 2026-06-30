// src/pages/ProductPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useToast } from '../App';
import { fetchProductById } from '../lib/productService';
import Footer from '../components/Footer';
import ProductDetailSkeleton from '../components/ProductDetailSkeleton';
import styles from './ProductPage.module.css';

export default function ProductPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const toast = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [activeImgIdx, setActiveImgIdx] = useState(0);

    useEffect(() => {
        setLoading(true);
        fetchProductById(id).then(p => {
            setProduct(p);
            setActiveImgIdx(0);
            setLoading(false);
            if (!p) navigate('/shop', { replace: true });
        });
    }, [id, navigate]);

    if (loading) {
        return (
            <main className="fade-in">
                <div className={styles.breadcrumb}>
                    <Link to="/">Home</Link><span> / </span><Link to="/shop">Collection</Link>
                </div>
                <div className="container">
                    <ProductDetailSkeleton />
                </div>
                <Footer />
            </main>
        );
    }
    if (!product) return null;

    const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
    const images = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image_url ? [product.image_url] : []);
    const activeImage = images[activeImgIdx];

    const handleAddToCart = () => {
        addToCart(product, qty);
        toast(`${product.name} added to your selection`, 'success');
        setQty(1);
    };

    return (
        <main className="fade-in">
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <Link to="/">Home</Link>
                <span> / </span>
                <Link to="/shop">Collection</Link>
                <span> / </span>
                <Link to={`/shop/${product.category}`}>{product.category}</Link>
                <span> / </span>
                <span className={styles.breadcrumbCurrent}>{product.name}</span>
            </div>

            <div className="container">
                <div className={styles.layout}>
                    {/* Image */}
                    <div>
                        <div className={styles.imageWrap}>
                            {product.badge && <span className={styles.badge}>{product.badge}</span>}
                            {activeImage ? (
                                <>
                                    <img src={activeImage} alt={product.name} className={styles.productImg} />
                                    <span className={styles.emojiOverlay}>{product.emoji || '💎'}</span>
                                </>
                            ) : (
                                <div className={styles.emojiDisplay}>{product.emoji || '💎'}</div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className={styles.thumbRow}>
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        className={`${styles.thumb} ${i === activeImgIdx ? styles.thumbActive : ''}`}
                                        onClick={() => setActiveImgIdx(i)}
                                    >
                                        <img src={img} alt={`${product.name} ${i + 1}`} className={styles.thumbImg} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className={styles.info}>
                        <p className={styles.brand}>{product.brand}</p>
                        <h1 className={styles.name}>{product.name}</h1>

                        {product.rating > 0 && (
                            <div className={styles.rating}>
                                <span className={styles.stars}>{'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}</span>
                                <span className={styles.ratingText}>{product.rating} · {product.reviews || 0} reviews</span>
                            </div>
                        )}

                        <p className={styles.price}>{fmt(product.price)}</p>

                        <div className="divider" />

                        <p className={styles.desc}>{product.description}</p>

                        <div className="divider" />

                        {/* Quantity */}
                        {product.stock > 0 ? (
                            <>
                                <div className={styles.qtyRow}>
                                    <span className={styles.qtyLabel}>Quantity</span>
                                    <div className={styles.qtyControl}>
                                        <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease">−</button>
                                        <span className={styles.qtyNum}>{qty}</span>
                                        <button className={styles.qtyBtn} onClick={() => setQty(q => Math.min(product.stock, q + 1))} aria-label="Increase">+</button>
                                    </div>
                                    {product.stock <= 5 && (
                                        <span className={styles.stockNote}>Only {product.stock} left</span>
                                    )}
                                </div>
                                <div className={styles.actions}>
                                    <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ flex: 2 }}>
                                        Add to Selection
                                    </button>
                                    <button className="btn btn-outline" onClick={() => toast('Added to wishlist ♡', 'success')} aria-label="Add to wishlist">
                                        ♡
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="msg msg-info" style={{ marginTop: '1rem' }}>This piece is currently out of stock. Contact us for availability.</div>
                        )}

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className={styles.tags}>
                                {product.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                            </div>
                        )}

                        <div className="divider" />

                        {/* Trust Pillars */}
                        <div className={styles.trust}>
                            {[['🏛', 'Authenticated', 'Every piece verified'],
                                ['📦', 'Insured Delivery', 'Fully insured shipping'],
                                ['✨', 'Lifetime Service', 'Complimentary care'],
                            ].map(([icon, title, sub]) => (
                                <div key={title} className={styles.trustPillar}>
                                    <span>{icon}</span>
                                    <div>
                                        <p className={styles.trustTitle}>{title}</p>
                                        <p className={styles.trustSub}>{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
