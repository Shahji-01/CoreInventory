import { useState, useEffect } from 'react';
import { getReceipts, createReceipt, updateReceipt, deleteReceipt, validateReceipt, cancelReceipt } from '../../services/receiptService';
import { getProducts } from '../../services/productService';
import { getWarehouses } from '../../services/warehouseService';
import { Plus, CheckCircle, ArrowDownToLine, Trash2, X, XCircle, Edit2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

const STATUS_COLORS = {
  draft: 'badge-secondary',
  done: 'badge-success',
  cancelled: 'badge-danger',
};

export default function Receipts() {
  const [data, setData] = useState([]);
  const [reqs, setReqs] = useState({ products: [], warehouses: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ supplier: '', warehouseId: '', notes: '', lines: [] });
  const toast = useToast();

  const load = () => {
    setLoading(true);
    getReceipts().then(r => {
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

  const addLine = () => setForm({ ...form, lines: [...form.lines, { productId: '', quantity: 1 }] });
  const removeLine = (idx) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx, field, val) => {
    const newLines = [...form.lines];
    newLines[idx][field] = val;
    setForm({ ...form, lines: newLines });
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (editId) {
        await updateReceipt(editId, form);
        toast.success('Receipt updated', `Receipt has been updated.`);
      } else {
        await createReceipt(form);
        toast.success('Receipt created', `Receipt has been added.`);
      }
      setOpen(false); setEditId(null);
      setForm({ supplier: '', warehouseId: '', notes: '', lines: [] });
      load();
    } catch (ex) { 
      const msg = ex.message || `Failed to ${editId ? 'update' : 'create'} receipt`;
      setErr(msg);
      toast.error('Save failed', msg);
    }
    finally { setSaving(false); }
  };

  const validate = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Validate this receipt? Stock will increase immediately.')) return;
    try { 
      await validateReceipt(id); 
      toast.success('Receipt validated', 'Stock has been updated.');
      if (viewItem && viewItem.id === id) setViewItem({...viewItem, status: 'done'});
      load(); 
    }
    catch (ex) { toast.error('Validation failed', ex.message || 'Failed to validate'); }
  };

  const cancelOp = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Cancel this receipt? This action cannot be undone.')) return;
    try { 
      await cancelReceipt(id); 
      toast.success('Receipt cancelled', 'The operation was cancelled.');
      if (viewItem && viewItem.id === id) setViewItem({...viewItem, status: 'cancelled'});
      load(); 
    }
    catch (ex) { toast.error('Cancellation failed', ex.message || 'Failed to cancel'); }
  };

  const deleteOp = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Delete this draft receipt?')) return;
    try {
      await deleteReceipt(id);
      toast.success('Receipt deleted', 'The draft receipt has been removed.');
      if (viewItem && viewItem.id === id) setViewItem(null);
      load();
    } catch (ex) { toast.error('Deletion failed', ex.message || 'Failed to delete receipt'); }
  };

  const openNew = () => {
    setForm({ supplier: '', warehouseId: '', notes: '', lines: [] });
    setEditId(null); setErr(''); setOpen(true);
  };

  const openEdit = (r, e) => {
    if (e) e.stopPropagation();
    setForm({
      supplier: r.supplier || '',
      warehouseId: r.warehouseId || r.warehouse?._id || '',
      notes: r.notes || '',
      lines: r.lines.map(l => ({ 
        productId: l.product?._id || l.productId || l.product, 
        quantity: l.quantity 
      }))
    });
    setEditId(r.id); setViewItem(null); setErr(''); setOpen(true);
  };

  const filtered = statusFilter ? data.filter(r => r.status === statusFilter) : data;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">Receipts</div>
          <div className="page-header-sub">Manage incoming stock from suppliers</div>
        </div>
        <button id="new-receipt-btn" className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New Receipt
        </button>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'draft', 'done', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid',
              borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border)',
              background: statusFilter === s ? 'rgba(0,245,160,0.12)' : 'transparent',
              color: statusFilter === s ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.15s'
            }}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {filtered.length} {filtered.length === 1 ? 'receipt' : 'receipts'}
        </span>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : filtered.length === 0 ? (
          <div className="empty-state">
            <ArrowDownToLine className="empty-state-icon" style={{ display: 'inline' }} />
            <div className="empty-state-title">No receipts found</div>
            <div className="empty-state-text">{statusFilter ? 'No receipts with this status.' : 'Create your first receipt to receive stock.'}</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 140 }}>Reference</th>
                <th>Supplier</th>
                <th>Destination</th>
                <th>Items</th>
                <th>Date</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setViewItem(r)} style={{ cursor: 'pointer' }} className="hover-row">
                  <td><span className="op-ref">{r.reference}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.supplier || '—'}</td>
                  <td><span className="text-muted">{r.warehouseName}</span></td>
                  <td className="text-muted">{r.lines?.length ?? 0} items</td>
                  <td className="text-muted">{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[r.status] || 'badge-secondary'}`} style={{ textTransform: 'capitalize' }}>{r.status}</span>
                  </td>
                  <td className="align-right">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {r.status === 'draft' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={(e) => validate(r.id, e)}><CheckCircle size={12} /> Validate</button>
                          <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }} onClick={(e) => openEdit(r, e)}><Edit2 size={14} /></button>
                        </>
                      )}
                      <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }} onClick={() => setViewItem(r)}><Eye size={14} /></button>
                    </div>
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
              <span className="slide-over-title">{editId ? 'Edit Receipt' : 'New Receipt'}</span>
              <button className="close-btn" type="button" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form id="receipt-form" onSubmit={submit} style={{ display: 'contents' }}>
              <div className="slide-over-body">
                {err && <div className="auth-error">{err}</div>}

                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <input className="form-input" placeholder="Vendor Co." value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Warehouse *</label>
                  <select className="form-input" value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} required>
                    <option value="">Select Warehouse…</option>
                    {reqs.warehouses.map(w => <option key={w.id || w._id} value={w.id || w._id}>{w.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Products to Receive</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={addLine}><Plus size={12} /> Add Line</button>
                  </div>

                  {form.lines.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-elevated)', border: '1px dashed var(--border-muted)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      Click "Add Line" to add products.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {form.lines.map((ln, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg-elevated)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                          <select className="form-input" style={{ flex: 1 }} value={ln.productId} onChange={e => updateLine(i, 'productId', e.target.value)} required>
                            <option value="">Select Product…</option>
                            {reqs.products.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.sku})</option>)}
                          </select>
                          <input type="number" className="form-input" style={{ width: 80 }} min="1" value={ln.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} required />
                          <button type="button" style={{ color: 'var(--rose)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => removeLine(i)}><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" style={{ resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              <div className="slide-over-footer">
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving || form.lines.length === 0}>
                  {saving ? <span className="spinner" /> : (editId ? 'Save Changes' : 'Create Receipt')}
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
                <span className={`badge ${STATUS_COLORS[viewItem.status] || 'badge-secondary'}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>{viewItem.status}</span>
              </span>
              <button className="close-btn" onClick={() => setViewItem(null)}><X size={18} /></button>
            </div>
            <div className="slide-over-body" style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Supplier</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{viewItem.supplier || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Destination</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{viewItem.warehouseName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Date Created</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{format(new Date(viewItem.createdAt), 'MMM d, yyyy HH:mm')}</div>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                Products
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewItem.lines?.map((ln, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{ln.product?.name || 'Unknown Product'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{ln.product?.sku || 'N/A'}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {ln.quantity} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>{ln.product?.unit || 'pcs'}</span>
                    </div>
                  </div>
                ))}
                {(!viewItem.lines || viewItem.lines.length === 0) && (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border-muted)' }}>
                    No products found in this receipt.
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
            <div className="slide-over-footer" style={{ justifyContent: 'space-between' }}>
              <div>
                {viewItem.status === 'draft' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" style={{ color: 'var(--rose)', borderColor: 'var(--rose-dark)' }} onClick={() => cancelOp(viewItem.id)}>
                      <XCircle size={14} /> Cancel
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--rose)' }} onClick={() => deleteOp(viewItem.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {viewItem.status === 'draft' && (
                  <>
                    <button className="btn btn-outline" onClick={() => openEdit(viewItem)}><Edit2 size={14} /> Edit</button>
                    <button className="btn btn-primary" onClick={() => validate(viewItem.id)}><CheckCircle size={14} /> Validate</button>
                  </>
                )}
                <button className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
