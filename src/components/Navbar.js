// src/components/Navbar.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../App';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isOwner, signOut } = useAuth();
  const { totalItems } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useToast();
  const [search, setSearch]   = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast('Signed out. Au revoir.', 'success');
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoMark}>✦</span>
        AURUM
        <span className={styles.logoSub}>Luxury Boutique</span>
      </Link>

      <div className={styles.center}>
        <Link to="/shop"                   className={`${styles.link} ${isActive('/shop') ? styles.linkActive : ''}`}>Collections</Link>
        <Link to="/shop/Jewellery"         className={`${styles.link} ${isActive('/shop/Jewellery') ? styles.linkActive : ''}`}>Jewellery</Link>
        <Link to="/shop/Watches"           className={`${styles.link} ${isActive('/shop/Watches') ? styles.linkActive : ''}`}>Watches</Link>
        <Link to="/shop/Clothing"          className={`${styles.link} ${isActive('/shop/Clothing') ? styles.linkActive : ''}`}>Clothing</Link>
        <Link to="/shop/Accessories"       className={`${styles.link} ${isActive('/shop/Accessories') ? styles.linkActive : ''}`}>Accessories</Link>
        <Link to="/shop/Fragrance"         className={`${styles.link} ${isActive('/shop/Fragrance') ? styles.linkActive : ''}`}>Fragrance</Link>
        <Link to="/track-order"            className={`${styles.link} ${isActive('/track-order') ? styles.linkActive : ''}`}>Track Order</Link>
      </div>

      <div className={styles.right}>
        {/* Search */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search collection…"
            aria-label="Search products"
          />
        </form>

        {/* Dark Mode Toggle */}
        <button
          className={styles.themeBtn}
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Cart */}
        <Link to="/cart" className={styles.iconBtn} aria-label={`Cart ${totalItems} items`}>
          <span className={styles.iconEmoji}>🛍</span>
          {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
        </Link>

        {/* Account */}
        {user ? (
          <div className={styles.userMenu} ref={menuRef}>
            <button className={styles.iconBtn} onClick={() => setMenuOpen(v => !v)} aria-label="Account">
              <span className={styles.avatarCircle}>
                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
              </span>
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownName}>{user.user_metadata?.full_name || 'Member'}</div>
                  <div className={styles.dropdownEmail}>{user.email}</div>
                  {isOwner && <span className={styles.ownerBadge}>✦ Owner</span>}
                </div>
                {isOwner && (
                  <button className={styles.dropdownItem} onClick={() => { navigate('/admin'); setMenuOpen(false); }}>
                    ⚙ Owner Panel
                  </button>
                )}
                <button className={styles.dropdownItem} onClick={() => { navigate('/my-orders'); setMenuOpen(false); }}>
                  📋 My Orders
                </button>
                <button className={styles.dropdownItem} onClick={() => { navigate('/track-order'); setMenuOpen(false); }}>
                  📍 Track an Order
                </button>
                <button className={styles.dropdownItem} onClick={() => { navigate('/cart'); setMenuOpen(false); }}>
                  🛍 My Cart {totalItems > 0 && `(${totalItems})`}
                </button>
                <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={handleLogout}>
                  ↩ Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className={styles.iconBtn} aria-label="Sign in" title="Sign In">
            <span className={styles.iconEmoji}>👤</span>
          </Link>
        )}

        {isOwner && (
          <Link to="/admin" className={styles.adminBtn} title="Owner Panel">⚙</Link>
        )}
      </div>
    </nav>
  );
}
