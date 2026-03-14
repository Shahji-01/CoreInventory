import { useState, useEffect } from 'react';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../services/warehouseService';
import { Plus, Warehouse as WHIcon, Trash2, X, Edit2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const warehouseTypes = ['main', 'production', 'storage', 'transit'];
const initialForm = { name: '', code: '', location: '', type: 'storage', capacity: 1000 };

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();

  const load = () => {
    setLoading(true);
    getWarehouses().then(r => setWarehouses(Array.isArray(r) ? r : [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (editId) {
        await updateWarehouse(editId, { ...form, capacity: Number(form.capacity) });
        toast.success('Warehouse updated', `${form.name} was successfully updated.`);
      } else {
        await createWarehouse({ ...form, capacity: Number(form.capacity) });
        toast.success('Warehouse created', `${form.name} was successfully added.`);
      }
      setOpen(false); setForm(initialForm); setEditId(null); load();
    } catch (ex) { setErr(ex.message || `Failed to ${editId ? 'update' : 'create'} warehouse`); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this warehouse?')) return;
    try {
      await deleteWarehouse(id);
      toast.success('Warehouse deleted', 'The warehouse has been removed.');
      load();
    } catch (ex) {
      toast.error('Deletion failed', ex.message || 'Failed to delete warehouse');
    }
  };

  const openNew = () => {
    setForm(initialForm);
    setEditId(null);
    setErr('');
    setOpen(true);
  };

  const openEdit = (w) => {
    setForm({ name: w.name, code: w.code, location: w.location || '', type: w.type, capacity: w.capacity });
    setEditId(w.id);
    setErr('');
    setOpen(true);
  };

  const utilColor = (pct) => pct > 90 ? 'var(--rose)' : pct > 70 ? 'var(--amber)' : 'var(--primary)';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">Warehouses</div>
          <div className="page-header-sub">{warehouses.length} locations</div>
        </div>
        <button id="new-warehouse-btn" className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New Warehouse
        </button>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <div className="warehouse-grid">
          {warehouses.map(w => {
            const pct = w.capacity > 0 ? Math.round((w.currentItems / w.capacity) * 100) : 0;
            return (
              <div key={w.id} className="card warehouse-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{w.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{w.location || 'No location set'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="op-ref">{w.code}</span>
                    <button className="btn btn-icon btn-secondary btn-sm" onClick={() => openEdit(w)}><Edit2 size={13} /></button>
                    <button className="btn btn-icon btn-danger btn-sm" onClick={() => remove(w.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)' }}>
                  <span style={{ textTransform: 'capitalize' }}>{w.type}</span>
                  <span>{w.currentItems} / {w.capacity} items</span>
                </div>
                <div className="warehouse-progress-bg">
                  <div className="warehouse-progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: utilColor(pct) }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right' }}>{pct}% utilization</div>
              </div>
            );
          })}
          {warehouses.length === 0 && (
            <div className="empty-state">
              <WHIcon className="empty-state-icon" style={{ display: 'inline' }} />
              <div className="empty-state-title">No warehouses yet</div>
              <div className="empty-state-text">Add your first warehouse location.</div>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="slide-over" onClick={e => e.stopPropagation()}>
            <div className="slide-over-header">
              <span className="slide-over-title">{editId ? 'Edit Warehouse' : 'New Warehouse'}</span>
              <button className="close-btn" type="button" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form id="warehouse-form" onSubmit={submit} style={{ display: 'contents' }}>
              <div className="slide-over-body">
                {err && <div className="auth-error">{err}</div>}
                <div className="form-group"><label className="form-label">Name *</label><input name="name" className="form-input" placeholder="Main Warehouse" value={form.name} onChange={handle} required /></div>
                <div className="form-group"><label className="form-label">Code *</label><input name="code" className="form-input font-mono" style={{ textTransform: 'uppercase' }} placeholder="WH-MAIN" value={form.code} onChange={handle} required /></div>
                <div className="form-group"><label className="form-label">Location</label><input name="location" className="form-input" placeholder="Building A, Floor 1" value={form.location} onChange={handle} /></div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select name="type" className="form-input" value={form.type} onChange={handle}>
                      {warehouseTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Capacity</label><input name="capacity" type="number" className="form-input" value={form.capacity} onChange={handle} /></div>
                </div>
              </div>
              <div className="slide-over-footer">
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>{saving ? <span className="spinner" /> : (editId ? 'Save Changes' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
