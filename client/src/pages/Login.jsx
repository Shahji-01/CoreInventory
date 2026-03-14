import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Package } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (tab === 'login') await login({ email: form.email, password: form.password });
      else await register({ name: form.name, email: form.email, password: form.password });
    } catch (ex) {
      setError(ex.message || 'Authentication failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const switchTab = (t) => { setTab(t); setError(''); };

  return (
    <div className="auth-page">
      {/* Left brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-glow" />
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <div className="auth-brand-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <rect x="3" y="5" width="14" height="2.5" rx="1" fill="#090909"/>
                <rect x="3" y="9" width="10" height="2.5" rx="1" fill="#090909"/>
                <rect x="3" y="13" width="6" height="2.5" rx="1" fill="#090909"/>
              </svg>
            </div>
            <span className="auth-brand-name">CoreInventory</span>
          </div>

          <h1 className="auth-brand-headline">
            Supply chain <span>intelligence,</span><br />elevated.
          </h1>
          <p className="auth-brand-sub">
            The professional standard for tracking, managing, and optimizing your inventory operations with absolute precision.
          </p>

          <div className="auth-brand-footer">
            <div className="auth-brand-footer-line">
              <div className="auth-brand-footer-hr" />
              <span className="auth-brand-footer-label">Trusted by industry leaders</span>
              <div className="auth-brand-footer-hr" />
            </div>
            <div className="auth-brand-logos">
              <div className="auth-brand-logo-block" />
              <div className="auth-brand-logo-block" />
              <div className="auth-brand-logo-block" />
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">


        <div className="auth-form-inner">
          <div className="auth-form-heading">
            <h2 className="auth-form-title">
              {tab === 'login' ? 'Sign in to CoreInventory' : 'Create your account'}
            </h2>
            <p className="auth-form-sub">
              {tab === 'login' ? 'Enter your details to access your workspace' : 'Get started with CoreInventory for free'}
            </p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>Create Account</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {error && <div className="auth-error">{error}</div>}

            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" className="form-input" placeholder="John Smith" value={form.name} onChange={handle} required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input name="email" type="email" className="form-input" placeholder="name@company.com" value={form.email} onChange={handle} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" type="password" className="form-input" placeholder={tab === 'register' ? 'Min. 6 characters' : '••••••••'} value={form.password} onChange={handle} required minLength={6} />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center', padding: '10px 14px', marginTop: 4 }}>
              {loading ? (
                <span className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                <>
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={15} style={{ marginLeft: 4 }} />
                </>
              )}
            </button>

            {tab === 'login' && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>

                <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 500, color: 'var(--primary)', textDecoration: 'none' }}>
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 32 }}>
            By continuing, you agree to our <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
