// src/pages/CartPage.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../App';
import Footer from '../components/Footer';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { items, removeFromCart, updateQty, clearCart, subtotal, tax, total } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

  const handleCheckout = () => {
    if (!user) {
      toast('Please sign in to continue to checkout', 'error');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (!items.length) {
    return (
      <main className="fade-in">
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛍</span>
          <h2 className={styles.emptyTitle}>Your selection is empty</h2>
          <p className={styles.emptySub}>Discover our curated collection of luxury pieces</p>
          <Link to="/shop" className="btn btn-primary btn-lg">Explore Collection</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="fade-in">
      <div className="container section">
        <h1 className={styles.pageTitle}>Your Selection</h1>

        <div className={styles.layout}>
          {/* ── Cart Items ── */}
          <div className={styles.items}>
            {items.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemImg}>{item.emoji || '💎'}</div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemBrand}>{item.brand}</p>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemPrice}>{fmt(item.price)}</p>
                  <div className={styles.itemControls}>
                    <div className={styles.qtyControl}>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                      <span className={styles.qtyNum}>{item.qty}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                    <button className={styles.removeBtn} onClick={() => { removeFromCart(item.id); toast('Removed from selection', ''); }}>
                      Remove ✕
                    </button>
                  </div>
                </div>
                <div className={styles.itemTotal}>{fmt(item.price * item.qty)}</div>
              </div>
            ))}

            <div className={styles.cartActions}>
              <button className="btn btn-ghost btn-sm" onClick={() => { if(window.confirm('Clear all items?')) clearCart(); }}>
                Clear All
              </button>
              <Link to="/shop" className="btn btn-ghost btn-sm">← Continue Shopping</Link>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className={styles.summaryRow}><span>GST (18%)</span><span>{fmt(tax)}</span></div>
            <div className={styles.summaryRow}><span>Insured Delivery</span><span className={styles.free}>Complimentary</span></div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}><span>Total</span><span>{fmt(total)}</span></div>

            <button className="btn btn-primary w-full" onClick={handleCheckout}
              style={{width:'100%', marginTop:'1.5rem', padding:'16px', fontSize:'12px', letterSpacing:'3px'}}>
              Proceed to Checkout →
            </button>

            {!user && (
              <p className={styles.signInNote}>
                <Link to="/login">Sign in</Link> to complete your order
              </p>
            )}

            <div className={styles.payIcons}>
              <span title="Credit Card">💳</span>
              <span title="UPI">📱</span>
              <span title="Net Banking">🏦</span>
              <span title="Wallets">👛</span>
            </div>
            <p className={styles.secureNote}>🔒 Secured by Razorpay · 256-bit SSL</p>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  );
}
