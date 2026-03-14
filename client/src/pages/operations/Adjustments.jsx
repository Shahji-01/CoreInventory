import { useState, useEffect } from 'react';
import { getAdjustments, createAdjustment } from '../../services/adjustmentService';
import { getProducts } from '../../services/productService';
import { getWarehouses } from '../../services/warehouseService';
import { Plus, CheckCircle, Sliders, Trash2, X, Eye } from 'lucide-react';
import { format } from 'date-fns';

const REASONS = [
  { value: 'inventory_count', label: 'Inventory Count' },
  { value: 'damage', label: 'Damage' },
  { value: 'loss', label: 'Loss / Theft' },
  { value: 'other', label: 'Other' },
];

export default function Adjustments() {
  const [data, setData] = useState([]);
  const [reqs, setReqs] = useState({ products: [], warehouses: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState({ warehouseId: '', reason: 'inventory_count', notes: '', lines: [] });

  const load = () => {
    setLoading(true);
    getAdjustments().then(r => {
      const list = Array.isArray(r) ? r : (r?.data || []);
      setData(list);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    Promise.all([getProducts(), getWarehouses()]).then(([p, w]) => {
      setReqs({
        products: Array.isArray(p) ? p : (p?.data || []),
        warehouses: Array.isArray(w) ? w : [],
      });
    });
  }, []);

  const addLine = () => setForm({ ...form, lines: [...form.lines, { productId: '', countedQuantity: 0 }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx, field, val) => {
    const newLines = [...form.lines];
    newLines[idx][field] = val;
    setForm({ ...form, lines: newLines });
  };

  // Find product details for the selected product on the form line
  const getProduct = (id) => reqs.products.find(p => p.id === id);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await createAdjustment(form);
      setOpen(false);
      setForm({ warehouseId: '', reason: 'inventory_count', notes: '', lines: [] });
      load();
    } catch (ex) { setErr(ex.message || 'Failed to create adjustment'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">Inventory Adjustments</div>
          <div className="page-header-sub">Correct stock levels after a count or damage event</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ warehouseId: '', reason: 'inventory_count', notes: '', lines: [] }); setErr(''); setOpen(true); }}>
          <Plus size={15} /> New Adjustment
        </button>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : data.length === 0 ? (
          <div className="empty-state">
            <Sliders className="empty-state-icon" style={{ display: 'inline' }} />
            <div className="empty-state-title">No adjustments yet</div>
            <div className="empty-state-text">Create your first adjustment to correct stock discrepancies.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 140 }}>Reference</th>
                <th>Location</th>
                <th>Reason</th>
                <th>Items</th>
                <th>Date</th>
                <th style={{ width: 90 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id} onClick={() => setViewItem(r)} style={{ cursor: 'pointer' }} className="hover-row">
                  <td><span className="op-ref">{r.reference}</span></td>
                  <td><span className="text-muted">{r.warehouseName}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{(r.reason || '').replace(/_/g, ' ')}</td>
                  <td className="text-muted">{r.lines?.length ?? 0} items</td>
                  <td className="text-muted">{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                  <td style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${r.status === 'done' ? 'badge-success' : 'badge-secondary'}`} style={{ textTransform: 'capitalize' }}>{r.status}</span>
                    <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }} onClick={(e) => { e.stopPropagation(); setViewItem(r); }}><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="slide-over" onClick={e => e.stopPropagation()}>
            <div className="slide-over-header">
              <span className="slide-over-title">New Adjustment</span>
              <button className="close-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={submit} style={{ display: 'contents' }}>
              <div className="slide-over-body">
                {err && <div className="auth-error">{err}</div>}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Warehouse *</label>
                    <select className="form-input" value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} required>
                      <option value="">Select Warehouse…</option>
                      {reqs.warehouses.map(w => <option key={w.id || w._id} value={w.id || w._id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason *</label>
                    <select className="form-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required>
                      {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Products Counted</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={addLine}><Plus size={12} /> Add Line</button>
                  </div>

                  {form.lines.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-elevated)', border: '1px dashed var(--border-muted)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      Click "Add Line" to add products to count.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 28px', gap: 8, padding: '0 2px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <span>Product</span><span style={{ textAlign: 'center' }}>On Hand</span><span style={{ textAlign: 'center' }}>New Qty</span><span></span>
                      </div>
                      {form.lines.map((ln, i) => {
                        const prod = getProduct(ln.productId);
                        return (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 28px', gap: 8, alignItems: 'center', background: 'var(--bg-elevated)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                            <select className="form-input" value={ln.productId} onChange={e => updateLine(i, 'productId', e.target.value)} required>
                              <option value="">Select Product…</option>
                              {reqs.products.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.sku})</option>)}
                            </select>
                            <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: 13 }}>
                              {prod ? prod.currentStock : '—'}
                            </div>
                            <input type="number" className="form-input" min="0" value={ln.countedQuantity} onChange={e => updateLine(i, 'countedQuantity', Number(e.target.value))} required />
                            <button type="button" style={{ color: 'var(--rose)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => removeLine(i)}><Trash2 size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>

                <div style={{ background: 'var(--amber-light, rgba(245,158,11,0.1))', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)', marginTop: 12 }}>
                  ⚠️ Adjustments apply immediately and cannot be undone. Stock will be set to the counted quantity.
                </div>
              </div>

              <div className="slide-over-footer">
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving || form.lines.length === 0}>
                  {saving ? <span className="spinner" /> : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="slide-over" onClick={e => e.stopPropagation()}>
            <div className="slide-over-header">
              <span className="slide-over-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {viewItem.reference}
                <span className={`badge ${viewItem.status === 'done' ? 'badge-success' : 'badge-secondary'}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>{viewItem.status}</span>
              </span>
              <button className="close-btn" onClick={() => setViewItem(null)}><X size={18} /></button>
            </div>
            <div className="slide-over-body" style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Location</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{viewItem.warehouseName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Reason</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' }}>{(viewItem.reason || '').replace(/_/g, ' ')}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{format(new Date(viewItem.createdAt), 'MMM d, yyyy HH:mm')}</div>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                Counted Products
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewItem.lines?.map((ln, i) => {
                  const diff = ln.difference || (ln.adjustedQuantity - ln.previousQuantity);
                  const diffColor = diff > 0 ? 'var(--emerald)' : diff < 0 ? 'var(--rose)' : 'var(--text-muted)';
                  const diffPrefix = diff > 0 ? '+' : ''; 
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{ln.productName || 'Unknown Product'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{ln.productSku || 'N/A'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {ln.adjustedQuantity} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>pcs</span>
                        </div>
                        <div style={{ fontSize: 11, color: diffColor, fontWeight: 500, marginTop: 2 }}>
                          {diff !== 0 ? `${diffPrefix}${diff} pcs (was ${ln.previousQuantity})` : `No change (was ${ln.previousQuantity})`}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!viewItem.lines || viewItem.lines.length === 0) && (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border-muted)' }}>
                    No products found in this adjustment.
                  </div>
                )}
              </div>

              {viewItem.notes && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: 14, borderRadius: 8, border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap' }}>
                    {viewItem.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="slide-over-footer" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
