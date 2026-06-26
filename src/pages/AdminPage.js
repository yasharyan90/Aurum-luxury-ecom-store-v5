// src/pages/AdminPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../App';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../lib/productService';
import { fetchOrders, updateOrderStatus } from '../lib/orderService';
import ProductModal from '../components/ProductModal';
import styles from './AdminPage.module.css';

const TABS = ['dashboard', 'products', 'orders'];

const STATUS_COLORS = {
    pending:    '#D97706',
    processing: '#3B82F6',
    shipped:    '#8B5CF6',
    delivered:  '#27AE60',
    cancelled:  '#C0392B',
};

const fmt     = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtLakh = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : fmt(n);

export default function AdminPage() {
    const { user, profile, signOut } = useAuth();
    const toast = useToast();

    const [tab,           setTab]           = useState('dashboard');
    const [products,      setProducts]      = useState([]);
    const [orders,        setOrders]        = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [modal,         setModal]         = useState(null); // null | 'add' | product object
    const [search,        setSearch]        = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // ── Data loaders ──────────────────────────────────────────────────────────

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchProducts({ limit: 200 });
            setProducts(data);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchOrders();
            setOrders(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === 'dashboard' || tab === 'products') loadProducts();
        if (tab === 'dashboard' || tab === 'orders')   loadOrders();
    }, [tab, loadProducts, loadOrders]);

    // ── Product CRUD ──────────────────────────────────────────────────────────

    const handleSave = async (data) => {
        if (modal && modal !== 'add') {
            await updateProduct(modal.id, data);
            toast('Product updated successfully', 'success');
        } else {
            await createProduct({ ...data, created_by: user?.id });
            toast('Product added to collection', 'success');
        }
        await loadProducts();
        setModal(null);
    };

    const handleDelete = async (id) => {
        await deleteProduct(id);
        toast('Product removed from collection', 'success');
        setDeleteConfirm(null);
        await loadProducts();
    };

    const handleStatusChange = async (orderId, status) => {
        try {
            await updateOrderStatus(orderId, status);
            setOrders(prev =>
                prev.map(o => o.id === orderId ? { ...o, status } : o)
            );
            toast('Order status updated', 'success');
        } catch {
            toast('Failed to update status', 'error');
        }
    };

    // ── Derived stats ─────────────────────────────────────────────────────────

    const inventoryValue   = products.reduce((s, p) => s + p.price * (p.stock || 0), 0);
    const lowStockCount    = products.filter(p => p.stock < 5 && p.stock > 0).length;
    const ordersTotal      = orders.reduce((s, o) => s + (o.total || 0), 0);
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())     ||
        p.brand.toLowerCase().includes(search.toLowerCase())    ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className={styles.layout}>

            {/* ══════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════ */}
            <aside className={styles.sidebar}>

                <div className={styles.sidebarLogo}>
                    <span className={styles.logoText}>AURUM</span>
                    <span className={styles.logoSub}>Owner Panel</span>
                </div>

                <nav className={styles.sidebarNav}>
                    {TABS.map(t => (
                        <button
                            key={t}
                            className={`${styles.navItem} ${tab === t ? styles.navActive : ''}`}
                            onClick={() => setTab(t)}
                        >
              <span className={styles.navIcon}>
                {t === 'dashboard' ? '📊' : t === 'products' ? '💎' : '📦'}
              </span>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.ownerInfo}>
                        <div className={styles.ownerAvatar}>
                            {(profile?.full_name || user?.email || 'O')[0].toUpperCase()}
                        </div>
                        <div>
                            <p className={styles.ownerName}>{profile?.full_name || 'Owner'}</p>
                            <p className={styles.ownerRole}>Boutique Owner</p>
                        </div>
                    </div>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={signOut}
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        Sign Out
                    </button>
                </div>

            </aside>

            {/* ══════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════ */}
            <main className={styles.main}>

                {/* ─────────────────────────────────────────────────
            TAB: DASHBOARD
        ───────────────────────────────────────────────── */}
                {tab === 'dashboard' && (
                    <div className="fade-in">

                        <div className={styles.pageHeader}>
                            <div>
                                <h1 className={styles.pageTitle}>Dashboard</h1>
                                <p className={styles.pageDate}>
                                    {new Date().toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        day:     'numeric',
                                        month:   'long',
                                        year:    'numeric',
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Stat cards */}
                        <div className={styles.statsGrid}>
                            {[
                                { num: products.length,         label: 'Total Products',  icon: '💎' },
                                { num: fmtLakh(inventoryValue), label: 'Inventory Value', icon: '💰' },
                                { num: lowStockCount,           label: 'Low Stock Items',  icon: '⚠️' },
                                { num: fmtLakh(ordersTotal),    label: 'Total Revenue',   icon: '📈' },
                            ].map(s => (
                                <div key={s.label} className={styles.statCard}>
                                    <div className={styles.statIcon}>{s.icon}</div>
                                    <div className={styles.statNum}>{s.num}</div>
                                    <div className={styles.statLabel}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Category breakdown + recent orders */}
                        <div className={styles.dashGrid}>

                            <div className={styles.panel}>
                                <h2 className={styles.panelTitle}>Category Breakdown</h2>
                                {['Jewellery', 'Watches', 'Accessories', 'Fragrance'].map(cat => {
                                    const count = products.filter(p => p.category === cat).length;
                                    const pct   = products.length
                                        ? Math.round((count / products.length) * 100)
                                        : 0;
                                    return (
                                        <div key={cat} className={styles.catRow}>
                                            <span className={styles.catRowName}>{cat}</span>
                                            <div className={styles.catBar}>
                                                <div
                                                    className={styles.catBarFill}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className={styles.catRowCount}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.panel}>
                                <h2 className={styles.panelTitle}>Recent Orders</h2>
                                {orders.slice(0, 5).map(o => (
                                    <div key={o.id} className={styles.recentOrder}>
                                        <div>
                                            <p className={styles.orderId}>
                                                {o.id?.toString().slice(0, 12)}…
                                            </p>
                                            <p className={styles.orderCust}>
                                                {o.customer_name || o.profiles?.full_name || 'Customer'}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ color: '#9B7D2F', fontWeight: 500, fontSize: 13 }}>
                                                {fmt(o.total)}
                                            </p>
                                            <span
                                                className={styles.statusPill}
                                                style={{
                                                    background: STATUS_COLORS[o.status] + '22',
                                                    color:      STATUS_COLORS[o.status],
                                                }}
                                            >
                        {o.status}
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>

                        {/* Low stock alert */}
                        {lowStockCount > 0 && (
                            <div className={styles.alertBox}>
                                <span className={styles.alertIcon}>⚠️</span>
                                <div>
                                    <strong>
                                        {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low on stock.
                                    </strong>
                                    <span style={{ marginLeft: '0.75rem', color: '#8C8278', fontSize: 12 }}>
                    {products
                        .filter(p => p.stock < 5 && p.stock > 0)
                        .map(p => p.name)
                        .join(', ')}
                  </span>
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setTab('products')}
                                >
                                    View Products
                                </button>
                            </div>
                        )}

                    </div>
                )}

                {/* ─────────────────────────────────────────────────
            TAB: PRODUCTS
        ───────────────────────────────────────────────── */}
                {tab === 'products' && (
                    <div className="fade-in">

                        <div className={styles.pageHeader}>
                            <div>
                                <h1 className={styles.pageTitle}>Products</h1>
                                <p className={styles.pageDate}>{products.length} pieces in collection</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setModal('add')}>
                                + Add Product
                            </button>
                        </div>

                        {/* Search bar */}
                        <div className={styles.tableSearch}>
                            <input
                                className={styles.tableSearchInput}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search products by name, brand or category…"
                            />
                            {search && (
                                <button
                                    className={styles.clearSearch}
                                    onClick={() => setSearch('')}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="spinner-wrap">
                                <div className="spinner" />
                            </div>
                        ) : (
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Rating</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{ textAlign: 'center', padding: '3rem', color: '#8C8278' }}
                                            >
                                                No products found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map(p => (
                                            <tr key={p.id}>

                                                {/* Product name + thumbnail */}
                                                <td>
                                                    <div className={styles.productThumb}>
                                                        {p.image_url ? (
                                                            <img
                                                                src={p.image_url}
                                                                alt={p.name}
                                                                className={styles.productThumbImg}
                                                            />
                                                        ) : (
                                                            <span className={styles.productEmojiLarge}>
                                  {p.emoji || '💎'}
                                </span>
                                                        )}
                                                        <div>
                                                            <div className={styles.productName}>{p.name}</div>
                                                            <div className={styles.productBrand}>{p.brand}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td>
                                                    <span className={styles.categoryPill}>{p.category}</span>
                                                </td>

                                                {/* Price */}
                                                <td className={styles.priceCell}>{fmt(p.price)}</td>

                                                {/* Stock */}
                                                <td>
                            <span
                                style={{
                                    color:      p.stock === 0 ? '#C0392B' : p.stock < 5 ? '#D97706' : '#27AE60',
                                    fontWeight: 500,
                                }}
                            >
                              {p.stock ?? 0}
                                {p.stock === 0 && ' (Out)'}
                                {p.stock > 0 && p.stock < 5 && ' (Low)'}
                            </span>
                                                </td>

                                                {/* Rating */}
                                                <td>
                                                    {p.rating > 0 ? (
                                                        <span className={styles.ratingCell}>★ {p.rating}</span>
                                                    ) : '—'}
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <div className={styles.actionBtns}>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => setModal(p)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => setDeleteConfirm(p)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>
                )}

                {/* ─────────────────────────────────────────────────
            TAB: ORDERS
        ───────────────────────────────────────────────── */}
                {tab === 'orders' && (
                    <div className="fade-in">

                        <div className={styles.pageHeader}>
                            <div>
                                <h1 className={styles.pageTitle}>Orders</h1>
                                <p className={styles.pageDate}>
                                    {orders.length} total orders · {fmt(orders.reduce((s, o) => s + (o.total || 0), 0))} revenue
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="spinner-wrap">
                                <div className="spinner" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#8C8278' }}>
                                <div style={{ fontSize: 40, marginBottom: '1rem', opacity: 0.3 }}>📦</div>
                                <p>No orders yet. Orders will appear here after customers checkout.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {orders.map(o => {
                                    const addr    = o.address || {};
                                    const name    = addr.full_name || o.customer_name || o.profiles?.full_name || 'Customer';
                                    const phone   = addr.phone || '—';
                                    const email   = addr.email || o.profiles?.email || '—';
                                    const addrStr = [
                                        addr.line1, addr.line2, addr.city, addr.state, addr.pincode,
                                    ].filter(Boolean).join(', ');

                                    return (
                                        <div key={o.id} className={styles.orderCard}>

                                            {/* Order header */}
                                            <div className={styles.orderCardTop}>
                                                <div>
                                                    <code className={styles.orderId}>
                                                        {(o.id || '').toString().slice(0, 20)}
                                                    </code>
                                                    <div style={{ marginTop: 4, fontSize: 10, color: '#8C8278' }}>
                                                        {new Date(o.created_at).toLocaleDateString('en-IN', {
                                                            day:    'numeric',
                                                            month:  'long',
                                                            year:   'numeric',
                                                            hour:   '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span className={styles.priceCell} style={{ fontSize: 16 }}>
                            {fmt(o.total)}
                          </span>
                                                    <span
                                                        className={styles.statusPill}
                                                        style={{
                                                            background: STATUS_COLORS[o.status] + '22',
                                                            color:      STATUS_COLORS[o.status],
                                                        }}
                                                    >
                            {o.status}
                          </span>
                                                    <select
                                                        className={styles.statusSelect}
                                                        value={o.status}
                                                        onChange={e => handleStatusChange(o.id, e.target.value)}
                                                    >
                                                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Order details grid */}
                                            <div className={styles.orderCardBody}>

                                                {/* Customer */}
                                                <div className={styles.orderSection}>
                                                    <div className={styles.orderSectionTitle}>👤 Customer</div>
                                                    <div className={styles.orderDetail}><strong>{name}</strong></div>
                                                    <div className={styles.orderDetail}>📞 {phone}</div>
                                                    <div className={styles.orderDetail}>✉️ {email}</div>
                                                </div>

                                                {/* Delivery Address */}
                                                <div className={styles.orderSection}>
                                                    <div className={styles.orderSectionTitle}>📍 Delivery Address</div>
                                                    {addrStr ? (
                                                        <>
                                                            <div className={styles.orderDetail}>
                                                                {addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}
                                                            </div>
                                                            <div className={styles.orderDetail}>
                                                                {addr.city}, {addr.state}
                                                            </div>
                                                            <div className={styles.orderDetail}>
                                                                PIN: {addr.pincode} · {addr.country || 'India'}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={styles.orderDetail} style={{ color: '#8C8278' }}>
                                                            No address saved
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Payment */}
                                                <div className={styles.orderSection}>
                                                    <div className={styles.orderSectionTitle}>💳 Payment</div>
                                                    <div className={styles.orderDetail}>
                                                        Method: <strong>{o.payment_method || 'razorpay'}</strong>
                                                    </div>
                                                    {o.payment_id && (
                                                        <div
                                                            className={styles.orderDetail}
                                                            style={{ wordBreak: 'break-all' }}
                                                        >
                                                            ID: <code style={{ fontSize: 10 }}>{o.payment_id}</code>
                                                        </div>
                                                    )}
                                                    <div className={styles.orderDetail}>
                                                        Subtotal: {fmt(o.subtotal)} + GST: {fmt(o.tax)}
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Order items */}
                                            {o.order_items && o.order_items.length > 0 && (
                                                <div className={styles.orderItems}>
                                                    {o.order_items.map((item, idx) => (
                                                        <span key={idx} className={styles.orderItemChip}>
                              {item.products?.emoji || '💎'}{' '}
                                                            {item.product_name || item.products?.name}{' '}
                                                            ×{item.quantity} · {fmt(item.price * item.quantity)}
                            </span>
                                                    ))}
                                                </div>
                                            )}

                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                )}

            </main>

            {/* ══════════════════════════════════════════════════════
          PRODUCT MODAL
      ══════════════════════════════════════════════════════ */}
            {modal && (
                <ProductModal
                    product={modal !== 'add' ? modal : null}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}

            {/* ══════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════ */}
            {deleteConfirm && (
                <div
                    className={styles.deleteOverlay}
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div
                        className={styles.deleteModal}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.deleteIcon}>🗑</div>
                        <h3 className={styles.deleteTitle}>Remove Product</h3>
                        <p className={styles.deleteText}>
                            Are you sure you want to remove{' '}
                            <strong>{deleteConfirm.name}</strong> from the collection?
                            This action cannot be undone.
                        </p>
                        <div className={styles.deleteActions}>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDelete(deleteConfirm.id)}
                            >
                                Remove Product
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}