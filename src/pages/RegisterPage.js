// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../App';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp, demoLogin } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!name || !email || !pass) { setError('Please fill in all fields.'); return; }
    if (pass.length < 6)          { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');

    const isConfigured = process.env.REACT_APP_SUPABASE_URL &&
      !process.env.REACT_APP_SUPABASE_URL.includes('placeholder');

    try {
      if (isConfigured) {
        await signUp({ email, password: pass, fullName: name });
        setSuccess('Account created! Please check your email to verify, then sign in.');
      } else {
        // Demo mode — create local session with proper UUID
        demoLogin(email, name);
        toast(`Welcome to AURUM, ${name}!`, 'success');
        navigate('/');
      }
    } catch (err) {
      // If Supabase sign-up fails (e.g. user exists), fall back to demo
      if (!isConfigured) {
        demoLogin(email, name);
        toast(`Welcome to AURUM, ${name}!`, 'success');
        navigate('/');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>AURUM</div>
        <p className={styles.subtitle}>Create Account</p>

        {error   && <div className="msg msg-error">{error}</div>}
        {success && <div className="msg msg-success">{success}</div>}

        {!success && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating account…' : 'Join the Boutique'}
            </button>
          </form>
        )}

        {success && (
          <Link to="/login" className="btn btn-primary w-full" style={{ width: '100%', display: 'block', textAlign: 'center', marginTop: '1rem' }}>
            Go to Login →
          </Link>
        )}

        <div className={styles.ornament}>
          <div className={styles.line} />
          <span className={styles.ornamentText}>or</span>
          <div className={styles.line} />
        </div>

        <p className={styles.toggle}>
          Already a member?{' '}
          <Link to="/login" className={styles.toggleLink}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
