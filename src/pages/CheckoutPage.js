// src/pages/CheckoutPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../App';
import { placeOrder } from '../lib/orderService';
import styles from './CheckoutPage.module.css';

// ── Load Razorpay script ────────────────────────────────
function loadRazorpay() {
    return new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload  = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

export default function CheckoutPage() {
    // ── PATCH 1: added discount and coupon from useCart ──
    const { items, subtotal, tax, total, clearCart, totalItems, discount, coupon } = useCart();
    const { user } = useAuth();
    const navigate  = useNavigate();
    const toast     = useToast();

    const [step, setStep]      = useState(1); // 1=address, 2=review, 3=done
    const [paying, setPaying]  = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [errors, setErrors]  = useState({});

    const [address, setAddress] = useState({
        full_name:   user?.user_metadata?.full_name || '',
        phone:       '',
        email:       user?.email || '',
        line1:       '',
        line2:       '',
        city:        '',
        state:       '',
        pincode:     '',
        country:     'India',
    });

    useEffect(() => {
        if (!user)       { navigate('/login', { state: { from: '/checkout' } }); return; }
        if (!totalItems) { navigate('/cart'); }
    }, [user, totalItems, navigate]);

    const set = (field) => (e) => {
        setAddress(a => ({ ...a, [field]: e.target.value }));
        setErrors(er => ({ ...er, [field]: '' }));
    };

    // ── Validation ──────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!address.full_name.trim()) e.full_name = 'Required';
        if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.trim())) e.phone = 'Enter valid 10-digit mobile number';
        if (!address.email.trim())    e.email   = 'Required';
        if (!address.line1.trim())    e.line1   = 'Required';
        if (!address.city.trim())     e.city    = 'Required';
        if (!address.state)           e.state   = 'Required';
        if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim())) e.pincode = 'Enter valid 6-digit pincode';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Razorpay Payment ─────────────────────────────────────
    const handlePayment = async () => {
        if (!validate()) { toast('Please fill in all required fields correctly.', 'error'); return; }
        setPaying(true);

        const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;

        // If no Razorpay key — simulate payment (demo mode)
        if (!razorpayKey || razorpayKey === 'your_razorpay_key_id') {
            try {
                // ── PATCH 2a: added discount + couponCode ──
                const order = await placeOrder({
                    userId:        user.id,
                    items,
                    subtotal,
                    discount,
                    couponCode:    coupon?.code || null,
                    tax,
                    total,
                    address,
                    paymentId:     'DEMO_PAY_' + Date.now(),
                    paymentMethod: 'demo',
                });
                clearCart();
                setOrderId(order.id);
                setStep(3);
                toast('Order placed successfully! (Demo mode)', 'success');
            } catch (err) {
                toast(err.message || 'Order failed. Please try again.', 'error');
            } finally { setPaying(false); }
            return;
        }

        // Load Razorpay
        const loaded = await loadRazorpay();
        if (!loaded) { toast('Payment gateway failed to load. Please try again.', 'error'); setPaying(false); return; }

        const options = {
            key:         razorpayKey,
            amount:      Math.round(total) * 100, // in paise
            currency:    'INR',
            name:        'AURUM Luxury Boutique',
            description: `Order of ${totalItems} item${totalItems > 1 ? 's' : ''}`,
            image:       '', // add your logo URL here
            prefill: {
                name:    address.full_name,
                email:   address.email,
                contact: address.phone,
            },
            notes: {
                address: `${address.line1}, ${address.city}, ${address.state} - ${address.pincode}`,
            },
            theme: { color: '#C9A84C' },
            handler: async (response) => {
                // Payment successful — save order to Supabase
                try {
                    // ── PATCH 2b: added discount + couponCode ──
                    const order = await placeOrder({
                        userId:        user.id,
                        items,
                        subtotal,
                        discount,
                        couponCode:    coupon?.code || null,
                        tax,
                        total,
                        address,
                        paymentId:     response.razorpay_payment_id,
                        paymentMethod: 'razorpay',
                    });
                    clearCart();
                    setOrderId(order.id);
                    setStep(3);
                    toast('Payment successful! Order confirmed.', 'success');
                } catch (err) {
                    toast('Payment done but order save failed. Contact support.', 'error');
                } finally { setPaying(false); }
            },
            modal: {
                ondismiss: () => { setPaying(false); toast('Payment cancelled.', ''); }
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
            toast('Payment failed: ' + (response.error?.description || 'Unknown error'), 'error');
            setPaying(false);
        });
        rzp.open();
    };

    const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

    // ── Step 3: Success ───────────────────────────────────────
    if (step === 3) return (
        <main className={styles.page}>
            <div className={styles.successCard}>
                <div className={styles.successIcon}>✦</div>
                <h1 className={styles.successTitle}>Order Confirmed</h1>
                <div className="divider-gold" />
                <p className={styles.successText}>
                    Thank you, {address.full_name}. Your order has been placed and will be delivered to:
                </p>
                <div className={styles.addressSummary}>
                    <p>{address.line1}{address.line2 ? ', ' + address.line2 : ''}</p>
                    <p>{address.city}, {address.state} — {address.pincode}</p>
                    <p>{address.country}</p>
                </div>
                <p className={styles.orderRef}>
                    Order Reference: <code>{orderId?.toString().slice(0, 20)}</code>
                </p>
                <p className={styles.confirmEmail}>A confirmation has been sent to <strong>{address.email}</strong></p>
                <div className={styles.successActions}>
                    <Link to="/my-orders" className="btn btn-primary">Track My Order</Link>
                    <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
                </div>
            </div>
        </main>
    );

    return (
        <main className={`${styles.page} fade-in`}>
            <div className="container section">

                {/* ── Progress Bar ── */}
                <div className={styles.progress}>
                    {['Delivery Address', 'Review & Pay'].map((label, i) => (
                        <React.Fragment key={label}>
                            <div className={`${styles.progressStep} ${step > i + 1 ? styles.done : step === i + 1 ? styles.active : ''}`}>
                                <div className={styles.progressDot}>{step > i + 1 ? '✓' : i + 1}</div>
                                <span className={styles.progressLabel}>{label}</span>
                            </div>
                            {i === 0 && <div className={`${styles.progressLine} ${step > 1 ? styles.progressLineDone : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className={styles.layout}>
                    {/* ── LEFT: Form / Review ── */}
                    <div className={styles.left}>

                        {/* STEP 1: Address */}
                        {step === 1 && (
                            <div className={`${styles.card} slide-up`}>
                                <h2 className={styles.cardTitle}>Delivery Address</h2>
                                <div className="divider-gold" />

                                <div className={styles.formGrid2}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input className={`form-input ${errors.full_name ? 'error' : ''}`} value={address.full_name} onChange={set('full_name')} placeholder="As on government ID" />
                                        {errors.full_name && <p className="form-error">{errors.full_name}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mobile Number *</label>
                                        <input className={`form-input ${errors.phone ? 'error' : ''}`} value={address.phone} onChange={set('phone')} placeholder="10-digit mobile" maxLength={10} />
                                        {errors.phone && <p className="form-error">{errors.phone}</p>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" value={address.email} onChange={set('email')} placeholder="For order confirmation" />
                                    {errors.email && <p className="form-error">{errors.email}</p>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address Line 1 *</label>
                                    <input className={`form-input ${errors.line1 ? 'error' : ''}`} value={address.line1} onChange={set('line1')} placeholder="House / Flat / Building number & Street" />
                                    {errors.line1 && <p className="form-error">{errors.line1}</p>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address Line 2</label>
                                    <input className="form-input" value={address.line2} onChange={set('line2')} placeholder="Landmark, Area (optional)" />
                                </div>

                                <div className={styles.formGrid3}>
                                    <div className="form-group">
                                        <label className="form-label">City *</label>
                                        <input className={`form-input ${errors.city ? 'error' : ''}`} value={address.city} onChange={set('city')} placeholder="City" />
                                        {errors.city && <p className="form-error">{errors.city}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">State *</label>
                                        <select className={`form-input form-select ${errors.state ? 'error' : ''}`} value={address.state} onChange={set('state')}>
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        {errors.state && <p className="form-error">{errors.state}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">PIN Code *</label>
                                        <input className={`form-input ${errors.pincode ? 'error' : ''}`} value={address.pincode} onChange={set('pincode')} placeholder="6-digit PIN" maxLength={6} />
                                        {errors.pincode && <p className="form-error">{errors.pincode}</p>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input className="form-input" value={address.country} readOnly style={{opacity:0.6}} />
                                </div>

                                <button className="btn btn-primary" onClick={() => { if (validate()) setStep(2); }} style={{width:'100%', padding:'14px', marginTop:'0.5rem'}}>
                                    Continue to Review →
                                </button>
                            </div>
                        )}

                        {/* STEP 2: Review */}
                        {step === 2 && (
                            <div className={`${styles.card} slide-up`}>
                                <div className={styles.cardTitleRow}>
                                    <h2 className={styles.cardTitle}>Review Order</h2>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Edit Address</button>
                                </div>
                                <div className="divider-gold" />

                                {/* Address Preview */}
                                <div className={styles.addressPreview}>
                                    <div className={styles.addressPreviewIcon}>📍</div>
                                    <div>
                                        <p className={styles.addressPreviewName}>{address.full_name} · {address.phone}</p>
                                        <p className={styles.addressPreviewText}>
                                            {address.line1}{address.line2 ? ', ' + address.line2 : ''}, {address.city}, {address.state} — {address.pincode}
                                        </p>
                                    </div>
                                </div>

                                <div className="divider" />

                                {/* Items */}
                                <h3 className={styles.itemsTitle}>Items ({totalItems})</h3>
                                {items.map(item => (
                                    <div key={item.id} className={styles.reviewItem}>
                                        <div className={styles.reviewItemImg}>{item.emoji || '💎'}</div>
                                        <div className={styles.reviewItemInfo}>
                                            <p className={styles.reviewItemBrand}>{item.brand}</p>
                                            <p className={styles.reviewItemName}>{item.name}</p>
                                            <p className={styles.reviewItemQty}>Qty: {item.qty}</p>
                                        </div>
                                        <div className={styles.reviewItemPrice}>{fmt(item.price * item.qty)}</div>
                                    </div>
                                ))}

                                <div className="divider" />

                                {/* Payment Methods */}
                                <h3 className={styles.itemsTitle}>Payment Method</h3>
                                <div className={styles.paymentMethods}>
                                    <div className={styles.paymentMethod}>
                                        <div className={styles.paymentMethodIcon}>💳</div>
                                        <div>
                                            <p className={styles.paymentMethodName}>Razorpay Secure Checkout</p>
                                            <p className={styles.paymentMethodSub}>Credit / Debit Card · UPI · Net Banking · Wallets</p>
                                        </div>
                                        <div className={styles.paymentMethodCheck}>✓</div>
                                    </div>
                                </div>

                                <div className={styles.secureNote}>
                                    🔒 Payments secured by Razorpay · PCI-DSS Compliant · 256-bit SSL
                                </div>

                                <button
                                    className="btn btn-razorpay"
                                    onClick={handlePayment}
                                    disabled={paying}
                                    style={{width:'100%', padding:'16px', marginTop:'1.5rem', fontSize:'13px', letterSpacing:'3px'}}
                                >
                                    {paying ? 'Processing…' : `Pay ${fmt(total)} Securely`}
                                </button>

                                <p className={styles.demoNote}>
                                    No Razorpay key set? Add <code>REACT_APP_RAZORPAY_KEY_ID</code> to <code>.env</code> — otherwise demo mode is used.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Order Summary ── */}
                    <aside className={styles.summary}>
                        <div className={styles.summaryInner}>
                            <h2 className={styles.summaryTitle}>Order Summary</h2>

                            <div className={styles.summaryItems}>
                                {items.map(item => (
                                    <div key={item.id} className={styles.summaryItem}>
                                        <span className={styles.summaryEmoji}>{item.emoji}</span>
                                        <span className={styles.summaryItemName}>{item.name} <span className={styles.summaryQty}>×{item.qty}</span></span>
                                        <span className={styles.summaryItemPrice}>{fmt(item.price * item.qty)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="divider" style={{margin:'1rem 0'}} />

                            <div className={styles.summaryRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>

                            {/* ── PATCH 3: discount row ── */}
                            {discount > 0 && (
                                <div className={styles.summaryRow} style={{color:'#27AE60'}}>
                                    <span>Discount ({coupon?.code})</span>
                                    <span>− {fmt(discount)}</span>
                                </div>
                            )}

                            <div className={styles.summaryRow}><span>GST (18%)</span><span>{fmt(tax)}</span></div>
                            <div className={styles.summaryRow}><span>Insured Delivery</span><span className={styles.free}>Complimentary</span></div>

                            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                                <span>Total</span>
                                <span>{fmt(total)}</span>
                            </div>

                            {/* Savings badge */}
                            {discount > 0 && (
                                <div style={{
                                    textAlign:'center', background:'rgba(39,174,96,0.08)',
                                    border:'1px solid rgba(39,174,96,0.2)', color:'#27AE60',
                                    fontSize:'11px', padding:'6px', marginTop:'0.5rem', letterSpacing:'0.5px'
                                }}>
                                    🎉 You're saving {fmt(discount)}
                                </div>
                            )}

                            <div className={styles.trustBadges}>
                                <div className={styles.trustBadge}><span>🏛</span> Authenticated</div>
                                <div className={styles.trustBadge}><span>📦</span> Insured</div>
                                <div className={styles.trustBadge}><span>🔒</span> Secure</div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}