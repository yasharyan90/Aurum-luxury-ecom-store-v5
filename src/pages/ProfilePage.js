// src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../App';
import {
    fetchProfile, updateProfile,
    fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
} from '../lib/profileService';
import Footer from '../components/Footer';
import styles from './ProfilePage.module.css';

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

const EMPTY_ADDR = {
    label: '', full_name: '', phone: '', line1: '', line2: '',
    city: '', state: '', pincode: '', country: 'India',
};

// ── Tab nav ───────────────────────────────────────────────
const TABS = [
    { id: 'profile',   icon: '👤', label: 'Profile'       },
    { id: 'addresses', icon: '📍', label: 'Address Book'  },
];

export default function ProfilePage() {
    const { user } = useAuth();
    const toast    = useToast();

    const [tab, setTab]         = useState('profile');
    const [loading, setLoading] = useState(true);

    // ── Profile state ─────────────────────────────────────
    const [profile, setProfile]         = useState({ full_name: '', phone: '', email: '' });
    const [profileSaving, setProfileSaving] = useState(false);

    // ── Address state ─────────────────────────────────────
    const [addresses, setAddresses]     = useState([]);
    const [addrModal, setAddrModal]     = useState(false); // open/close
    const [editAddr, setEditAddr]       = useState(null);  // null = new, obj = edit
    const [addrForm, setAddrForm]       = useState(EMPTY_ADDR);
    const [addrSaving, setAddrSaving]   = useState(false);
    const [addrErrors, setAddrErrors]   = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // ── Load data ─────────────────────────────────────────
    const loadAll = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [prof, addrs] = await Promise.all([
                fetchProfile(user.id),
                fetchAddresses(user.id),
            ]);
            if (prof) {
                setProfile({
                    full_name: prof.full_name || user.user_metadata?.full_name || '',
                    phone:     prof.phone     || '',
                    email:     user.email     || '',
                });
            } else {
                setProfile({
                    full_name: user.user_metadata?.full_name || '',
                    phone:     '',
                    email:     user.email || '',
                });
            }
            setAddresses(addrs || []);
        } catch (err) {
            toast('Failed to load profile data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => { loadAll(); }, [loadAll]);

    // ── Profile save ──────────────────────────────────────
    const handleProfileSave = async () => {
        if (!profile.full_name.trim()) { toast('Name is required.', 'error'); return; }
        setProfileSaving(true);
        try {
            await updateProfile(user.id, {
                full_name: profile.full_name.trim(),
                phone:     profile.phone.trim(),
            });
            toast('Profile updated successfully.', 'success');
        } catch (err) {
            toast(err.message || 'Failed to update profile.', 'error');
        } finally { setProfileSaving(false); }
    };

    // ── Address modal helpers ─────────────────────────────
    const openNew  = () => { setEditAddr(null); setAddrForm(EMPTY_ADDR); setAddrErrors({}); setAddrModal(true); };
    const openEdit = (addr) => {
        setEditAddr(addr);
        setAddrForm({
            label:     addr.label     || '',
            full_name: addr.full_name || '',
            phone:     addr.phone     || '',
            line1:     addr.line1     || '',
            line2:     addr.line2     || '',
            city:      addr.city      || '',
            state:     addr.state     || '',
            pincode:   addr.pincode   || '',
            country:   addr.country   || 'India',
        });
        setAddrErrors({});
        setAddrModal(true);
    };
    const closeModal = () => { setAddrModal(false); setEditAddr(null); setAddrErrors({}); };

    const setField = (f) => (e) => {
        setAddrForm(prev => ({ ...prev, [f]: e.target.value }));
        setAddrErrors(prev => ({ ...prev, [f]: '' }));
    };

    const validateAddr = () => {
        const e = {};
        if (!addrForm.full_name.trim()) e.full_name = 'Required';
        if (!addrForm.phone.trim() || !/^\d{10}$/.test(addrForm.phone.trim())) e.phone = 'Valid 10-digit number required';
        if (!addrForm.line1.trim())    e.line1   = 'Required';
        if (!addrForm.city.trim())     e.city    = 'Required';
        if (!addrForm.state)           e.state   = 'Required';
        if (!addrForm.pincode.trim() || !/^\d{6}$/.test(addrForm.pincode.trim())) e.pincode = 'Valid 6-digit PIN required';
        setAddrErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleAddrSave = async () => {
        if (!validateAddr()) return;
        setAddrSaving(true);
        try {
            if (editAddr) {
                const updated = await updateAddress(editAddr.id, addrForm);
                setAddresses(prev => prev.map(a => a.id === editAddr.id ? { ...a, ...updated } : a));
                toast('Address updated.', 'success');
            } else {
                const newAddr = await addAddress(user.id, addrForm);
                setAddresses(prev => [newAddr, ...prev]);
                toast('Address added.', 'success');
            }
            closeModal();
        } catch (err) {
            toast(err.message || 'Failed to save address.', 'error');
        } finally { setAddrSaving(false); }
    };

    const handleDelete = async (id) => {
        try {
            await deleteAddress(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
            toast('Address removed.', 'success');
        } catch { toast('Failed to delete address.', 'error'); }
        setDeleteConfirm(null);
    };

    const handleSetDefault = async (addr) => {
        if (addr.is_default) return;
        try {
            await setDefaultAddress(user.id, addr.id);
            setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === addr.id })));
            toast('Default address updated.', 'success');
        } catch { toast('Failed to update default.', 'error'); }
    };

    // ── Avatar letter ─────────────────────────────────────
    const avatarLetter = (profile.full_name || user?.email || 'U')[0].toUpperCase();

    if (loading) return (
        <main className={styles.page}>
            <div className="spinner-wrap"><div className="spinner" /></div>
        </main>
    );

    return (
        <main className={`${styles.page} fade-in`}>
            <div className="container section">

                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.avatar}>{avatarLetter}</div>
                    <div>
                        <h1 className={styles.name}>{profile.full_name || 'Welcome'}</h1>
                        <p className={styles.email}>{user?.email}</p>
                    </div>
                </div>

                {/* ── Tab Bar ── */}
                <div className={styles.tabs}>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            <span>{t.icon}</span> {t.label}
                        </button>
                    ))}
                </div>

                <div className={styles.body}>

                    {/* ══════════════ PROFILE TAB ══════════════ */}
                    {tab === 'profile' && (
                        <div className={`${styles.card} slide-up`}>
                            <h2 className={styles.cardTitle}>Personal Information</h2>
                            <div className="divider-gold" />

                            <div className={styles.formGrid}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        className="form-input"
                                        value={profile.full_name}
                                        onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        className="form-input"
                                        value={profile.phone}
                                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="10-digit mobile"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    className="form-input"
                                    value={profile.email}
                                    readOnly
                                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                                />
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.5px' }}>
                                    Email cannot be changed here. Contact support if needed.
                                </p>
                            </div>

                            <div className={styles.profileActions}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleProfileSave}
                                    disabled={profileSaving}
                                    style={{ minWidth: 160 }}
                                >
                                    {profileSaving ? 'Saving…' : 'Save Changes'}
                                </button>
                                <Link to="/my-orders" className="btn btn-ghost">View My Orders →</Link>
                            </div>

                            {/* Quick links */}
                            <div className={styles.quickLinks}>
                                <div className={styles.quickLink} onClick={() => setTab('addresses')}>
                                    <span className={styles.quickLinkIcon}>📍</span>
                                    <div>
                                        <p className={styles.quickLinkTitle}>Address Book</p>
                                        <p className={styles.quickLinkSub}>{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
                                    </div>
                                    <span className={styles.quickLinkArrow}>→</span>
                                </div>
                                <Link to="/my-orders" className={styles.quickLink}>
                                    <span className={styles.quickLinkIcon}>📦</span>
                                    <div>
                                        <p className={styles.quickLinkTitle}>My Orders</p>
                                        <p className={styles.quickLinkSub}>Track & manage orders</p>
                                    </div>
                                    <span className={styles.quickLinkArrow}>→</span>
                                </Link>
                                <Link to="/cart" className={styles.quickLink}>
                                    <span className={styles.quickLinkIcon}>🛍</span>
                                    <div>
                                        <p className={styles.quickLinkTitle}>My Cart</p>
                                        <p className={styles.quickLinkSub}>Continue shopping</p>
                                    </div>
                                    <span className={styles.quickLinkArrow}>→</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ══════════════ ADDRESS BOOK TAB ══════════════ */}
                    {tab === 'addresses' && (
                        <div className="slide-up">
                            <div className={styles.addrHeader}>
                                <h2 className={styles.cardTitle}>Address Book</h2>
                                <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Address</button>
                            </div>
                            <div className="divider-gold" style={{ marginBottom: '1.5rem' }} />

                            {addresses.length === 0 ? (
                                <div className={styles.emptyAddr}>
                                    <span className={styles.emptyAddrIcon}>📍</span>
                                    <p className={styles.emptyAddrTitle}>No addresses saved yet</p>
                                    <p className={styles.emptyAddrSub}>Add your delivery addresses for faster checkout</p>
                                    <button className="btn btn-primary" onClick={openNew}>Add First Address</button>
                                </div>
                            ) : (
                                <div className={styles.addrGrid}>
                                    {addresses.map(addr => (
                                        <div key={addr.id} className={`${styles.addrCard} ${addr.is_default ? styles.addrCardDefault : ''}`}>
                                            {addr.is_default && (
                                                <div className={styles.defaultBadge}>✦ Default</div>
                                            )}
                                            {addr.label && <p className={styles.addrLabel}>{addr.label}</p>}
                                            <p className={styles.addrName}>{addr.full_name}</p>
                                            <p className={styles.addrPhone}>{addr.phone}</p>
                                            <p className={styles.addrText}>
                                                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                                                {addr.city}, {addr.state}<br />
                                                {addr.pincode} · {addr.country}
                                            </p>
                                            <div className={styles.addrActions}>
                                                <button className={styles.addrBtn} onClick={() => openEdit(addr)}>Edit</button>
                                                {!addr.is_default && (
                                                    <button className={styles.addrBtn} onClick={() => handleSetDefault(addr)}>Set Default</button>
                                                )}
                                                <button
                                                    className={`${styles.addrBtn} ${styles.addrBtnDelete}`}
                                                    onClick={() => setDeleteConfirm(addr.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add new card */}
                                    <button className={styles.addrAddCard} onClick={openNew}>
                                        <span className={styles.addrAddIcon}>+</span>
                                        <span className={styles.addrAddText}>Add New Address</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ══ Address Modal ══ */}
            {addrModal && (
                <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className={styles.modal}>
                        <button className={styles.modalClose} onClick={closeModal}>✕</button>
                        <h2 className={styles.modalTitle}>{editAddr ? 'Edit Address' : 'Add New Address'}</h2>
                        <div className="divider-gold" />

                        <div className="form-group">
                            <label className="form-label">Address Label <span style={{ color: '#8C8278', fontSize: 10 }}>(optional)</span></label>
                            <input className="form-input" value={addrForm.label} onChange={setField('label')} placeholder="e.g. Home, Office, Parents" />
                        </div>

                        <div className={styles.modalGrid}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className={`form-input ${addrErrors.full_name ? 'error' : ''}`} value={addrForm.full_name} onChange={setField('full_name')} placeholder="Recipient name" />
                                {addrErrors.full_name && <p className="form-error">{addrErrors.full_name}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone *</label>
                                <input className={`form-input ${addrErrors.phone ? 'error' : ''}`} value={addrForm.phone} onChange={setField('phone')} placeholder="10-digit mobile" maxLength={10} />
                                {addrErrors.phone && <p className="form-error">{addrErrors.phone}</p>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address Line 1 *</label>
                            <input className={`form-input ${addrErrors.line1 ? 'error' : ''}`} value={addrForm.line1} onChange={setField('line1')} placeholder="House / Flat / Building & Street" />
                            {addrErrors.line1 && <p className="form-error">{addrErrors.line1}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address Line 2</label>
                            <input className="form-input" value={addrForm.line2} onChange={setField('line2')} placeholder="Landmark, Area (optional)" />
                        </div>

                        <div className={styles.modalGrid3}>
                            <div className="form-group">
                                <label className="form-label">City *</label>
                                <input className={`form-input ${addrErrors.city ? 'error' : ''}`} value={addrForm.city} onChange={setField('city')} placeholder="City" />
                                {addrErrors.city && <p className="form-error">{addrErrors.city}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">State *</label>
                                <select className={`form-input form-select ${addrErrors.state ? 'error' : ''}`} value={addrForm.state} onChange={setField('state')}>
                                    <option value="">Select</option>
                                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                                </select>
                                {addrErrors.state && <p className="form-error">{addrErrors.state}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">PIN Code *</label>
                                <input className={`form-input ${addrErrors.pincode ? 'error' : ''}`} value={addrForm.pincode} onChange={setField('pincode')} placeholder="6-digit" maxLength={6} />
                                {addrErrors.pincode && <p className="form-error">{addrErrors.pincode}</p>}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-primary" onClick={handleAddrSave} disabled={addrSaving}>
                                {addrSaving ? 'Saving…' : editAddr ? 'Update Address' : 'Save Address'}
                            </button>
                            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Delete Confirm Modal ══ */}
            {deleteConfirm && (
                <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
                    <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
                        <p className={styles.confirmText}>Remove this address from your book?</p>
                        <div className={styles.confirmActions}>
                            <button className="btn btn-primary" style={{ background: '#C0392B', borderColor: '#C0392B' }} onClick={() => handleDelete(deleteConfirm)}>
                                Yes, Remove
                            </button>
                            <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
