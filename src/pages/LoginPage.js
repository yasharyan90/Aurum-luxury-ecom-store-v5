// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../App';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, demoLogin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useToast();
  const from      = location.state?.from || '/';

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !pass) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn({ email, password: pass });
      toast('Welcome back to AURUM', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      // If Supabase is not configured, fall back to demo session
      const isConfigured = process.env.REACT_APP_SUPABASE_URL &&
        !process.env.REACT_APP_SUPABASE_URL.includes('placeholder');

      if (!isConfigured && pass.length >= 6) {
        demoLogin(email, email.split('@')[0]);
        toast('Welcome to AURUM (demo mode)', 'success');
        navigate(from, { replace: true });
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>AURUM</div>
        <p className={styles.subtitle}>Member Login</p>

        {error && <div className="msg msg-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
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
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Signing in…' : 'Enter the Boutique'}
          </button>
        </form>

        <div className={styles.ornament}>
          <div className={styles.line} />
          <span className={styles.ornamentText}>or</span>
          <div className={styles.line} />
        </div>

        <p className={styles.toggle}>
          New to AURUM?{' '}
          <Link to="/register" className={styles.toggleLink}>Create an account</Link>
        </p>

        <div className={styles.ornament} style={{ marginTop: '1.5rem' }}>
          <div className={styles.line} />
          <span className={styles.ornamentText}>Owner</span>
          <div className={styles.line} />
        </div>

        <Link
          to="/owner-login"
          className="btn btn-dark w-full"
          style={{ width: '100%', display: 'block', textAlign: 'center' }}
        >
          Owner Portal →
        </Link>
      </div>
    </main>
  );
}
