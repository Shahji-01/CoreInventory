import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { User, Shield, LogOut, Package, Warehouse, CalendarClock, Settings } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  
  const [form, setForm] = useState({ name: user?.name || '', password: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Validation Error', 'Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const updatedUser = await updateProfile({ name: form.name, password: form.password || undefined });
      setUser(updatedUser);
      toast.success('Profile Updated', 'Your profile has been saved successfully.');
      setForm({ ...form, password: '', confirmPassword: '' });
    } catch (ex) {
      toast.error('Update Failed', ex.response?.data?.error || ex.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">My Profile</div>
          <div className="page-header-sub">Manage your account settings and preferences</div>
        </div>
      </div>

      <div style={{ maxWidth: 800 }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: '32px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--emerald))', 
              color: 'var(--bg)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 600
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{user?.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14}/> {user?.email}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}><Shield size={14}/> {user?.role} Role</span>
              </div>
            </div>

            <button className="btn btn-outline" onClick={logout} style={{ color: 'var(--rose)', borderColor: 'var(--rose-dark)', background: 'transparent' }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Account Details */}
        <div className="card">
          <div className="card-header"><div className="card-title">Account Information</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, padding: '20px 24px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Full Name</div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{user?.name}</div>
              </div>
              <div style={{ flex: 1, padding: '20px 24px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Email Address</div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{user?.email}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1, padding: '20px 24px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>System Role</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--emerald-light)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
              <div style={{ flex: 1, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <CalendarClock size={12}/> Member Since
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
                  {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'Recently'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><div className="card-title">Edit Profile</div></div>
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" className="form-input" style={{ maxWidth: 400 }} value={form.name} onChange={handle} required />
              </div>
              
              <div style={{ marginTop: 24, marginBottom: 16, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Change Password</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Leave blank if you don't want to change your password.</p>
              
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input name="password" type="password" className="form-input" style={{ maxWidth: 400 }} placeholder="Min 6 characters" value={form.password} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input name="confirmPassword" type="password" className="form-input" style={{ maxWidth: 400 }} value={form.confirmPassword} onChange={handle} />
              </div>

              <div style={{ marginTop: 24 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Role Capabilities Indicator */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><div className="card-title">Workspace Permissions</div></div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 16 }}>
              Based on your <strong>{user?.role}</strong> role, you have the following access rights across the platform.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-muted)' }}>
                <div style={{ color: 'var(--emerald)' }}><Package size={18}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Inventory Operations</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>You can view, create, Validate, and manage all core operations.</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-muted)' }}>
                <div style={{ color: 'var(--emerald)' }}><Warehouse size={18}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Locations & Setup</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>You can modify warehouse definitions and system settings.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
