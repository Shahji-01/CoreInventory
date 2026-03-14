import { useState, useEffect } from 'react';
import { getStockMovements } from '../services/stockMovementService';
import { getProducts } from '../services/productService';
import { getWarehouses } from '../services/warehouseService';
import { Activity, ArrowDownToLine, ArrowUpFromLine, Sliders, Shuffle } from 'lucide-react';
import { format } from 'date-fns';

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ productId: '', warehouseId: '', operationType: '' });
  const [reqs, setReqs] = useState({ products: [], warehouses: [] });
  const [loading, setLoading] = useState(true);

  const load = (pg = 1) => {
    setLoading(true);
    getStockMovements({ ...filters, page: pg }).then(r => {
      // Backend returns paginated {data, total, page, totalPages}
      // which is wrapped in {success, data} by API — Axios interceptor unwraps to inner data
      if (r && Array.isArray(r.data)) {
        setMovements(r.data);
        setTotal(r.total || 0);
        setPage(r.page || 1);
        setTotalPages(r.totalPages || 1);
      } else if (Array.isArray(r)) {
        setMovements(r);
        setTotal(r.length);
        setPage(1);
        setTotalPages(1);
      } else {
        setMovements([]);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([getProducts(), getWarehouses()]).then(([p, w]) => {
      setReqs({
        products: Array.isArray(p) ? p : (p?.data || []),
        warehouses: Array.isArray(w) ? w : [],
      });
    });
  }, []);

  useEffect(() => { load(1); }, [filters]);

  const OpIcon = ({ type }) => {
    if (type?.includes('receipt')) return <ArrowDownToLine size={14} style={{ color: 'var(--emerald)' }} />;
    if (type?.includes('delivery')) return <ArrowUpFromLine size={14} style={{ color: 'var(--blue)' }} />;
    if (type?.includes('transfer')) return <Shuffle size={14} style={{ color: 'var(--amber)' }} />;
    return <Sliders size={14} style={{ color: 'var(--text-muted)' }} />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">Stock Movements</div>
          <div className="page-header-sub">Complete ledger of all inventory changes{total > 0 ? ` — ${total} records` : ''}</div>
        </div>
      </div>

      <div className="page-filters" style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <select className="form-input" style={{ width: 220 }} value={filters.productId} onChange={e => setFilters({ ...filters, productId: e.target.value })}>
          <option value="">All Products</option>
          {reqs.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </select>

        <select className="form-input" style={{ width: 200 }} value={filters.warehouseId} onChange={e => setFilters({ ...filters, warehouseId: e.target.value })}>
          <option value="">All Warehouses</option>
          {reqs.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        <select className="form-input" style={{ width: 180 }} value={filters.operationType} onChange={e => setFilters({ ...filters, operationType: e.target.value })}>
          <option value="">All Operations</option>
          <option value="receipt">Receipts</option>
          <option value="delivery">Deliveries</option>
          <option value="transfer_in">Transfers In</option>
          <option value="transfer_out">Transfers Out</option>
          <option value="adjustment">Adjustments</option>
        </select>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : movements.length === 0 ? (
          <div className="empty-state">
            <Activity className="empty-state-icon" style={{ display: 'inline' }} />
            <div className="empty-state-title">No movements found</div>
            <div className="empty-state-text">Try adjusting your filters or create some operations first.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Operation</th>
                <th>Reference</th>
                <th>Product</th>
                <th>Location</th>
                <th className="align-right">Qty Change</th>
                <th className="align-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td className="text-muted" style={{ fontSize: 12 }}>{format(new Date(m.createdAt), 'MMM d, yyyy HH:mm')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
                      <OpIcon type={m.operationType} />
                      {(m.operationType || '').replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td><span className="op-ref">{m.referenceDocument}</span></td>
                  <td style={{ fontWeight: 500 }}>
                    {m.productName} <span className="text-muted" style={{ fontSize: 11, fontFamily: 'monospace' }}>{m.productSku}</span>
                  </td>
                  <td className="text-muted">
                    {m.operationType === 'transfer_out' ? `${m.sourceWarehouseName} →` :
                     m.operationType === 'transfer_in' ? `→ ${m.destinationWarehouseName}` :
                     (m.sourceWarehouseName || m.destinationWarehouseName || '—')}
                  </td>
                  <td className="align-right">
                    <span style={{ fontWeight: 700, color: m.quantityChange > 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                      {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                    </span>
                  </td>
                  <td className="align-right text-muted tabular-nums">{m.newQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => load(page - 1)}>Previous</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => load(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
