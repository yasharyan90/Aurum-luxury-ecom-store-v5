// src/pages/ProductPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useToast } from '../App';
import { fetchProductById } from '../lib/productService';
import VariantSelector from '../components/VariantSelector';
import { getVariantsForCategory } from '../lib/variantConfig';
import Footer from '../components/Footer';
import styles from './ProductPage.module.css';

export default function ProductPage() {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const { addToCart } = useCart();
    const toast      = useToast();

    const [product,  setProduct]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [qty,      setQty]      = useState(1);
    const [variants, setVariants] = useState({});   // selected variant values
    const [variantError, setVariantError] = useState('');
    const [activeImg, setActiveImg] = useState(0);  // image gallery index

    useEffect(() => {
        setLoading(true);
        fetchProductById(id).then(p => {
            setProduct(p);
            setVariants({});
            setActiveImg(0);
            setLoading(false);
            if (!p) navigate('/shop', { replace: true });
        });
    }, [id, navigate]);

    if (loading) return <div className="spinner-wrap" style={{minHeight:'60vh'}}><div className="spinner" /></div>;
    if (!product) return null;

    const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

    // Build image list: uploaded images array > single image_url > emoji fallback
    const images = product.images?.length
        ? product.images
        : product.image_url
            ? [product.image_url]
            : [];

    // Check all required variants are selected
    const variantGroups   = getVariantsForCategory(product.category);
    const requiredVariants = Object.keys(variantGroups);
    const allSelected     = requiredVariants.every(k => variants[k]);

    const handleAddToCart = () => {
        if (requiredVariants.length > 0 && !allSelected) {
            setVariantError('Please select all options above before adding to cart.');
            return;
        }
        setVariantError('');
        addToCart({ ...product, selectedVariants: variants }, qty);
        const variantSummary = Object.values(variants).join(' · ');
        toast(`${product.name}${variantSummary ? ` (${variantSummary})` : ''} added to your selection`, 'success');
        setQty(1);
    };

    // Clothing size guide
    const showSizeGuide = product.category === 'Clothing';

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

                    {/* ── IMAGE PANEL ── */}
                    <div className={styles.imagePanel}>
                        {/* Main image */}
                        <div className={styles.imageWrap}>
                            {product.badge && <span className={styles.badge}>{product.badge}</span>}
                            {images.length > 0 ? (
                                <img
                                    src={images[activeImg]}
                                    alt={product.name}
                                    className={styles.mainImg}
                                />
                            ) : (
                                <div className={styles.emojiDisplay}>{product.emoji || '💎'}</div>
                            )}
                            {/* Emoji badge if image present */}
                            {images.length > 0 && (
                                <div className={styles.emojiBadge}>{product.emoji || '💎'}</div>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div className={styles.thumbRow}>
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        className={`${styles.thumb} ${activeImg === i ? styles.thumbActive : ''}`}
                                        onClick={() => setActiveImg(i)}
                                    >
                                        <img src={img} alt={`view-${i}`} className={styles.thumbImg} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── INFO PANEL ── */}
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

                        {/* ── VARIANT SELECTOR ── */}
                        {requiredVariants.length > 0 && (
                            <>
                                <VariantSelector
                                    category={product.category}
                                    selected={variants}
                                    onChange={(v) => { setVariants(v); setVariantError(''); }}
                                />
                                {variantError && (
                                    <p className={styles.variantError}>{variantError}</p>
                                )}
                            </>
                        )}

                        {/* ── CLOTHING SIZE GUIDE ── */}
                        {showSizeGuide && (
                            <details className={styles.sizeGuide}>
                                <summary className={styles.sizeGuideTrigger}>📏 Size Guide</summary>
                                <div className={styles.sizeGuideTable}>
                                    <table>
                                        <thead>
                                        <tr><th>Size</th><th>Chest (in)</th><th>Waist (in)</th><th>Hip (in)</th></tr>
                                        </thead>
                                        <tbody>
                                        {[
                                            ['XS', '32–34', '24–26', '34–36'],
                                            ['S',  '34–36', '26–28', '36–38'],
                                            ['M',  '36–38', '28–30', '38–40'],
                                            ['L',  '38–40', '30–32', '40–42'],
                                            ['XL', '40–42', '32–34', '42–44'],
                                            ['XXL','42–44', '34–36', '44–46'],
                                        ].map(([s,...v]) => (
                                            <tr key={s} className={variants.size === s ? styles.sizeRowActive : ''}>
                                                <td>{s}</td>{v.map((val,i) => <td key={i}>{val}</td>)}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </details>
                        )}

                        {/* ── QUANTITY & ADD TO CART ── */}
                        {product.stock > 0 ? (
                            <>
                                <div className={styles.qtyRow}>
                                    <span className={styles.qtyLabel}>Quantity</span>
                                    <div className={styles.qtyControl}>
                                        <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                                        <span className={styles.qtyNum}>{qty}</span>
                                        <button className={styles.qtyBtn} onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
                                    </div>
                                    {product.stock <= 5 && (
                                        <span className={styles.stockNote}>Only {product.stock} left</span>
                                    )}
                                </div>

                                {/* Selected variant summary */}
                                {allSelected && requiredVariants.length > 0 && (
                                    <div className={styles.variantSummary}>
                                        {Object.entries(variants).map(([k, v]) => (
                                            <span key={k} className={styles.variantPill}>{v}</span>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.actions}>
                                    <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{flex:2}}>
                                        Add to Selection
                                    </button>
                                    <button className="btn btn-outline" onClick={() => toast('Added to wishlist ♡','success')}>
                                        ♡
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="msg msg-info" style={{marginTop:'1rem'}}>
                                This piece is currently out of stock. Contact us for availability.
                            </div>
                        )}

                        {/* Tags */}
                        {product.tags?.length > 0 && (
                            <div className={styles.tags}>
                                {product.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                            </div>
                        )}

                        <div className="divider" />

                        {/* Trust Pillars */}
                        <div className={styles.trust}>
                            {[
                                ['🏛', 'Authenticated',   'Every piece verified'],
                                ['📦', 'Insured Delivery','Fully insured shipping'],
                                ['✨', 'Lifetime Service','Complimentary care'],
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
