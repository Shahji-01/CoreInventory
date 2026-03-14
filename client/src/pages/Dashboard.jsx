import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/dashboardService';
import { Package, Layers, AlertTriangle, XCircle, ArrowDownToLine, ArrowUpFromLine, Shuffle, Sliders } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await getDashboard();
        if (mounted) {
          setData(r);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000); // Poll every 5 seconds for real-time feel

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><div className="empty-state-title">Failed to load dashboard</div></div>;

  const kpis = [
    { title: "Total Products", value: data.totalProducts, icon: Package, accent: "var(--blue)" },
    { title: "Stock Value", value: `₹${data.totalStockValue.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`, icon: Layers, accent: "var(--emerald)" },
    { title: "Low Stock", value: data.lowStockItems, icon: AlertTriangle, accent: "var(--amber)" },
    { title: "Out of Stock", value: data.outOfStockItems, icon: XCircle, accent: "var(--rose)" },
    { title: "Pending Receipts", value: data.pendingReceipts, icon: ArrowDownToLine, accent: "var(--indigo)" },
    { title: "Pending Deliveries", value: data.pendingDeliveries, icon: ArrowUpFromLine, accent: "var(--violet)" },
  ];

  const quickActions = [
    { label: 'New Receipt', sub: 'Receive incoming stock', icon: ArrowDownToLine, path: '/operations/receipts', color: 'var(--emerald)' },
    { label: 'New Delivery', sub: 'Ship to a customer', icon: ArrowUpFromLine, path: '/operations/deliveries', color: 'var(--blue)' },
    { label: 'Transfer Stock', sub: 'Move between locations', icon: Shuffle, path: '/operations/transfers', color: 'var(--amber)' },
    { label: 'Adjust Stock', sub: 'Fix counted variance', icon: Sliders, path: '/operations/adjustments', color: 'var(--violet)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Dashboard
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 20, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', animation: 'pulse-ring 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live</span>
            </div>
            <style>
              {`
                @keyframes pulse-ring {
                  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
              `}
            </style>
          </div>
          <div className="page-header-sub">Overview of your inventory operations</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {quickActions.map(qa => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.path}
              onClick={() => navigate(qa.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = qa.color; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${qa.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={qa.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{qa.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{qa.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="kpi-card">
              <div className="kpi-accent" style={{ background: kpi.accent }} />
              <div className="kpi-label">{kpi.title}</div>
              <div className="kpi-value">{kpi.value}</div>
              <Icon className="kpi-icon" size={18} />
            </div>
          );
        })}
      </div>

      <div className="charts-grid border-border border-b border-r border-t border-l" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Main Chart */}
        <div className="card">
          <div className="card-header"><div className="card-title">Movement Trend (7 Days)</div></div>
          <div className="card-body">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.movementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tickFormatter={val => format(new Date(val), 'MMM d')} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }} itemStyle={{ fontSize: 12, fontWeight: 500 }} labelStyle={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }} />
                  <Area type="monotone" dataKey="receipts" name="Receipts" stroke="var(--chart-2)" fillOpacity={1} fill="url(#colorReceipts)" strokeWidth={2} />
                  <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorDeliveries)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Categories Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><div className="card-title">Stock by Category</div></div>
          <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ width: '100%', flex: 1, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.stockByCategory} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="count" stroke="none">
                    {data.stockByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }} itemStyle={{ fontSize: 12, fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 24, padding: '0 10px' }}>
              {data.stockByCategory.map((c, i) => (
                <div key={c.category} style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], marginRight: 10, flexShrink: 0 }} />
                  <span className="truncate text-muted" style={{ flex: 1, marginRight: 8 }}>{c.category}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid-equal">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Activity</div></div>
          <div className="activity-list">
            {data.recentMovements.slice(0, 5).map(m => (
              <div key={m.id} className="activity-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`activity-icon ${m.quantityChange > 0 ? 'positive' : 'negative'}`}>
                    {m.quantityChange > 0 ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                  </div>
                  <div className="activity-info">
                    <div className="activity-name">{m.productName}</div>
                    <div className="activity-meta" style={{ textTransform: 'capitalize' }}>{m.operationType.replace('_', ' ')} • {m.referenceDocument}</div>
                  </div>
                </div>
                <div className="align-right">
                  <div className={`activity-qty ${m.quantityChange > 0 ? 'positive' : 'negative'}`}>
                    {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                  </div>
                  <div className="activity-time">{format(new Date(m.createdAt), 'MMM d, HH:mm')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header"><div className="card-title">Low Stock Alerts</div> <span className="badge badge-danger">Action Needed</span></div>
          <div className="activity-list">
            {data.lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className="activity-item">
                <div className="activity-info" style={{ marginLeft: 0 }}>
                  <div className="activity-name">{p.name}</div>
                  <div className="activity-meta font-mono">{p.sku}</div>
                </div>
                <div className="align-right">
                  <div className="activity-qty" style={{ color: 'var(--rose)' }}>{p.currentStock} <span className="text-muted" style={{ fontSize: 11, fontWeight: 400 }}>{p.unit}</span></div>
                  <div className="activity-time">Min: {p.reorderLevel}</div>
                </div>
              </div>
            ))}
            {data.lowStockProducts.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div style={{ width: 40, height: 40, background: 'var(--emerald-light)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Package size={20} color="var(--emerald)" />
                </div>
                <div className="empty-state-text">All products are adequately stocked.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
