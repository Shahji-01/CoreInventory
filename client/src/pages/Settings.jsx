import { useState } from 'react';
import { seedDemo, clearDemo } from '../services/seedService';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Database, Trash2, CheckCircle, AlertTriangle, Shield, Bell, Key, Palette, Sun, Moon, Monitor, Zap } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [msg, setMsg] = useState(null);
  const [theme, setTheme] = useState('dark');

  const handleSeed = async () => {
    if (!confirm('This will replace ALL existing inventory data with demo data. Continue?')) return;
    setSeeding(true); setMsg(null);
    try {
      const res = await seedDemo();
      const c = res.counts || res.data?.counts || res;
      setMsg({ type: 'success', text: `Demo data loaded! ${c.products} products, ${c.warehouses} warehouses, ${c.receipts} receipts, ${c.deliveries} deliveries, ${c.movements} movements.` });
    } catch (ex) { setMsg({ type: 'error', text: ex.response?.data?.error || 'Failed to seed demo data.' }); }
    finally { setSeeding(false); }
  };
  const handleClear = async () => {
    if (!confirm('This will permanently delete ALL inventory data. Are you sure?')) return;
    setClearing(true); setMsg(null);
    try {
      await clearDemo();
      setMsg({ type: 'success', text: 'All demo data cleared successfully.' });
    } catch (ex) { setMsg({ type: 'error', text: ex.response?.data?.error || 'Failed to clear data.' }); }
    finally { setClearing(false); }
  };

  const SectionHeader = ({ icon: Icon, title, sub }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border-light)', paddingBottom: 20, marginBottom: 28 }}>
      <div style={{ width: 40, height: 40, background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
        <Icon size={18} />
      </div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{title}</h2>
        {sub && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      <SectionHeader icon={SettingsIcon} title="Settings" sub="Manage your organization preferences and configurations." />

      {/* Appearance */}
      <div className="settings-section">
        <div className="settings-section-label">
          <h3><Palette size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Appearance</h3>
          <p>Customize how CoreInventory looks on your device.</p>
        </div>
        <div className="card">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Theme</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Select your preferred color theme.</div>
            </div>
            <div className="theme-toggle-group">
              {[['light', <Sun size={13} />, 'Light'], ['dark', <Moon size={13} />, 'Dark'], ['system', <Monitor size={13} />, 'System']].map(([val, icon, label]) => (
                <button key={val} className={`theme-toggle-btn ${theme === val ? 'active' : ''}`} onClick={() => {
                  setTheme(val);
                  if (val === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
                  else if (val === 'light') document.documentElement.setAttribute('data-theme', 'light');
                  else document.documentElement.removeAttribute('data-theme');
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Interface Density</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Adjust element spacing.</div>
            </div>
            <div className="theme-toggle-group">
              <button className="theme-toggle-btn active">Comfortable</button>
              <button className="theme-toggle-btn">Compact</button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-divider" />

      {/* Account */}
      <div className="settings-section">
        <div className="settings-section-label">
          <h3>Account</h3>
          <p>Your profile and authentication details.</p>
        </div>
        <div className="card card-body">
          <div style={{ display: 'grid', gap: 14 }}>
            <div><div className="form-label">Full Name</div><div style={{ marginTop: 5, fontWeight: 600, fontSize: 13 }}>{user?.name}</div></div>
            <div><div className="form-label">Email</div><div style={{ marginTop: 5, color: 'var(--text-muted)', fontSize: 13 }}>{user?.email}</div></div>
            <div><div className="form-label">Role</div><div style={{ marginTop: 5 }}><span className="badge badge-default" style={{ textTransform: 'capitalize' }}>{user?.role}</span></div></div>
          </div>
        </div>
      </div>

      <div className="settings-divider" />

      {/* Security */}
      <div className="settings-section">
        <div className="settings-section-label">
          <h3><Shield size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Security & Access</h3>
          <p>Manage who has access to your workspace and their permissions.</p>
        </div>
        <div className="card card-body">
          <div style={{ padding: 16, border: '1px dashed var(--border-muted)', borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', gap: 12 }}>
            <Zap size={18} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Enterprise Feature</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Advanced RBAC and custom roles require an Enterprise plan.</div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} disabled>Upgrade Plan</button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-divider" />

      {/* Notifications */}
      <div className="settings-section">
        <div className="settings-section-label">
          <h3><Bell size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Notifications</h3>
          <p>Configure alerts for stock levels and operational updates.</p>
        </div>
        <div className="card">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Low Stock Daily Digest</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Receive an email at 8am with items below reorder level.</div>
              </div>
              <button className="toggle-switch"><div className="toggle-knob" /></button>
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Operation Validations</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Notify when receipts or deliveries are confirmed.</div>
              </div>
              <button className="toggle-switch toggle-switch-off"><div className="toggle-knob" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-divider" />

      {/* Developer */}
      <div className="settings-section">
        <div className="settings-section-label">
          <h3><Key size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Developer</h3>
          <p>Manage API keys and webhooks for integrations.</p>
        </div>
        <div className="card card-body">
          <button className="btn btn-outline btn-sm" disabled>Generate New Key</button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>API access is currently disabled for this workspace.</p>
        </div>
      </div>

      <div className="settings-divider" />

      {/* Demo Data */}
      <div className="settings-section">
        <div className="settings-section-label">
          <h3><Database size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Demo Data</h3>
          <p>Seed the database with realistic inventory data to explore all features.</p>
        </div>
        <div className="card card-body">
          {msg && (
            <div style={{ background: msg.type === 'success' ? 'var(--emerald-light)' : 'var(--rose-light)', border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`, color: msg.type === 'success' ? 'var(--emerald)' : 'var(--rose)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {msg.type === 'success' ? <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
              {msg.text}
            </div>
          )}
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Creates products, warehouses, receipts, deliveries, transfers, adjustments, and stock movements with realistic sample data.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button id="seed-demo-btn" className="btn btn-primary" onClick={handleSeed} disabled={seeding || clearing}>
              {seeding ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Database size={14} />}
              {seeding ? 'Loading Demo Data…' : 'Load Demo Data'}
            </button>
            <button id="clear-data-btn" className="btn btn-danger" onClick={handleClear} disabled={seeding || clearing}>
              {clearing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
              {clearing ? 'Clearing…' : 'Clear All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
