import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/authService';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp & new password, 3: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await forgotPassword(email);
      setStep(2);
    } catch (ex) {
      setError(ex.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await resetPassword({ email, otp, newPassword });
      setStep(3);
    } catch (ex) {
      setError(ex.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
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
            Secure your <span>access.</span>
          </h1>
          <p className="auth-brand-sub">
            Follow the automated verification process to securely recover access to your organization's workspace.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner" style={{ position: 'relative' }}>
          <Link to="/login" className="back-link" style={{ position: 'absolute', top: -40, left: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-subtle)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
            <ArrowLeft size={14} /> Back to login
          </Link>

          <div className="auth-form-heading" style={{ marginBottom: 32 }}>
            <h2 className="auth-form-title">
              {step === 1 ? 'Reset password' : step === 2 ? 'Verify OTP' : 'Password Reset Successfully'}
            </h2>
            <p className="auth-form-sub">
              {step === 1 ? "Enter your email address and we'll send you a 6-digit recovery code." : step === 2 ? `Enter the recovery code sent to ${email} and set your new password.` : 'Your password has been successfully updated.'}
            </p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {step === 1 && (
            <form className="auth-form" onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center', padding: '10px 14px', marginTop: 12 }}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (
                  <>Send Recovery Code <ArrowRight size={15} style={{ marginLeft: 4 }} /></>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="auth-form" onSubmit={handleResetPassword}>

              
              <div className="form-group">
                <label className="form-label">6-Digit Recovery Code</label>
                <input type="text" className="form-input" style={{ letterSpacing: 4, fontFamily: 'monospace', fontSize: 16 }} placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Min. 6 characters" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center', padding: '10px 14px', marginTop: 12 }}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Confirm Password Change'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(0, 245, 160, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 size={32} color="var(--primary)" />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>
                You can now sign in using your new credentials.
              </p>
              <button type="button" className="btn btn-primary w-full" onClick={() => navigate('/login')} style={{ justifyContent: 'center', padding: '10px 14px' }}>
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
