import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import { Search, Plus, PackageOpen, Edit2, AlertTriangle, XCircle, X, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const initialForm = { sku: '', name: '', category: '', unit: 'pcs', costPrice: 0, reorderLevel: 10 };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const load = () => {
    setLoading(true);
    getProducts({ search: debouncedSearch }).then(r => {
      const list = Array.isArray(r) ? r : (r?.data || []);
      setProducts(list);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, [debouncedSearch]);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const openNew = () => { setEditingId(null); setForm(initialForm); setErr(''); setOpen(true); };
  const openEdit = (p) => { setEditingId(p.id); setForm({ ...p }); setErr(''); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (editingId) {
        await updateProduct(editingId, { ...form, costPrice: Number(form.costPrice), reorderLevel: Number(form.reorderLevel) });
        toast.success('Product updated', `${form.name} was successfully updated.`);
      } else {
        await createProduct({ ...form, costPrice: Number(form.costPrice), reorderLevel: Number(form.reorderLevel) });
        toast.success('Product created', `${form.name} was successfully added.`);
      }
      setOpen(false); load();
    } catch (ex) { 
      const msg = ex.message || 'Failed to save product';
      setErr(msg);
      toast.error('Save failed', msg);
    }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted', 'The product has been removed.');
      load();
    } catch (ex) {
      toast.error('Deletion failed', ex.message || 'Failed to delete product');
    }
  };

  const stockStatus = (current, reorder) => {
    if (current <= 0) return { label: 'Out of Stock', cls: 'badge-danger', color: 'var(--rose)' };
    if (current <= reorder) return { label: 'Low Stock', cls: 'badge-warning', color: 'var(--amber)' };
    return { label: 'In Stock', cls: 'badge-success', color: 'var(--emerald)' };
  };

  const displayed = categoryFilter ? products.filter(p => p.category === categoryFilter) : products;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">Products</div>
          <div className="page-header-sub">Manage your inventory catalog — {products.length} items</div>
        </div>
        <button id="new-product-btn" className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New Product
        </button>
      </div>

      {/* Filters row */}
      <div className="page-filters" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-wrap" style={{ width: 280 }}>
          <Search size={15} />
          <input className="form-input" placeholder="Search SKU or name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {categories.length > 0 && (
          <select className="form-input" style={{ width: 180 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Stock health badges */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={13} /> {products.filter(p => p.currentStock <= 0).length} out</span>
          <span style={{ color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={13} /> {products.filter(p => p.currentStock > 0 && p.currentStock <= p.reorderLevel).length} low</span>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <PackageOpen className="empty-state-icon" style={{ display: 'inline' }} />
            <div className="empty-state-title">No products found</div>
            <div className="empty-state-text">Adjust your search or create a new product.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 110 }}>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th className="align-right">On Hand</th>
                <th className="align-right">Reorder At</th>
                <th className="align-right">Cost</th>
                <th style={{ width: 100 }}>Stock Status</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(p => {
                const st = stockStatus(p.currentStock, p.reorderLevel);
                return (
                  <tr key={p.id}>
                    <td><span className="op-ref">{p.sku}</span></td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td className="text-muted">{p.category || '—'}</td>
                    <td className="align-right tabular-nums" style={{ fontWeight: 600, color: st.color }}>
                      {p.currentStock} <span className="text-muted" style={{ fontWeight: 400, fontSize: 11 }}>{p.unit}</span>
                    </td>
                    <td className="align-right tabular-nums text-muted">{p.reorderLevel}</td>
                    <td className="align-right tabular-nums text-muted">₹{Number(p.costPrice).toFixed(2)}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td className="align-right">
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => openEdit(p)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--rose)', cursor: 'pointer' }} onClick={() => remove(p.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="slide-over" onClick={e => e.stopPropagation()}>
            <div className="slide-over-header">
              <span className="slide-over-title">{editingId ? 'Edit Product' : 'New Product'}</span>
              <button className="close-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form id="product-form" onSubmit={submit} style={{ display: 'contents' }}>
              <div className="slide-over-body">
                {err && <div className="auth-error">{err}</div>}

                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input name="sku" className="form-input font-mono" style={{ textTransform: 'uppercase' }} placeholder="PRD-001" value={form.sku} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input name="name" className="form-input" placeholder="Premium Widget" value={form.name} onChange={handle} required />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input name="category" className="form-input" placeholder="Electronics" value={form.category} onChange={handle} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input name="unit" className="form-input" placeholder="pcs" value={form.unit} onChange={handle} />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Cost Price</label>
                    <input name="costPrice" type="number" step="0.01" min="0" className="form-input" value={form.costPrice} onChange={handle} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Level</label>
                    <input name="reorderLevel" type="number" min="0" className="form-input" value={form.reorderLevel} onChange={handle} />
                  </div>
                </div>


              </div>

              <div className="slide-over-footer">
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? <span className="spinner" /> : (editingId ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
