// src/pages/OwnerLoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../App';
import styles from './AuthPage.module.css';

export default function OwnerLoginPage() {
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const { ownerSignIn } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !pass) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      await ownerSignIn({ email, password: pass });
      toast('Welcome, Owner! Access granted.', 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      // Give a clear, specific error
      const msg = err.message || 'Login failed.';
      if (msg.toLowerCase().includes('invalid')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('owner')) {
        setError('This account does not have owner privileges.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page} style={{ background: '#0A0908' }}>
      <div className={styles.card} style={{ borderTop: '3px solid #C9A84C' }}>
        <div className={styles.logo}>AURUM</div>
        <p className={styles.subtitle} style={{ color: '#9B7D2F' }}>Owner Portal</p>

        {error && <div className="msg msg-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Owner Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="owner@aurum.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem', background: '#9B7D2F' }}
          >
            {loading ? 'Verifying…' : 'Access Owner Panel'}
          </button>
        </form>

        <div className={styles.ornament}>
          <div className={styles.line} />
          <span className={styles.ornamentText}>Back</span>
          <div className={styles.line} />
        </div>

        <Link
          to="/login"
          className="btn btn-ghost w-full"
          style={{ width: '100%', display: 'block', textAlign: 'center' }}
        >
          ← Customer Login
        </Link>

        {/* Setup reminder */}
        <div className={styles.demoBox}>
          <strong>Setup Reminder</strong>
          <p>Make sure you have:</p>
          <p>1. Created user in Supabase Auth</p>
          <p>2. Run: <code>UPDATE profiles SET role='owner' WHERE email='...'</code></p>
          <p>3. Confirmed email in Auth → Users</p>
        </div>
      </div>
    </main>
  );
}
