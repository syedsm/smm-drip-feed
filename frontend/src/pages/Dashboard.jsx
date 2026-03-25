// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, ShoppingBag, Layers, TrendingUp, ArrowRight, Link as LinkIcon, Activity } from 'lucide-react';
import { getStats } from '../services/api';
import PlatformIcon from '../components/PlatformIcon';

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className={`card stat-card border-${color}`}>
      <div className="stat-card-icon" style={{ background: `var(--${color}-dim)` }}>
        <Icon size={18} style={{ color: `var(--${color})` }} />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color: `var(--${color})` }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getStats();
      setStats(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  if (loading) return (
    <div className="loading-center"><div className="spinner spinner-lg" /></div>
  );

  const s = stats || {};
  const cards = [
    { label: 'Total Orders', value: s.totalOrders || 0, sub: `${s.activeOrders || 0} running`, color: 'cyan', icon: ShoppingBag },
    { label: 'Views Delivered', value: s.totalViewsDelivered || 0, sub: 'All-time', color: 'purple', icon: Eye },
    { label: 'Likes Delivered', value: s.totalLikesDelivered || 0, sub: 'All-time', color: 'green', icon: ThumbsUp },
    { label: 'Templates', value: s.totalTemplates || 0, sub: `${s.completedOrders || 0} orders done`, color: 'yellow', icon: Layers },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Real-time overview of your SMM drip-feed campaigns</p>
          </div>
          <div className="flex gap-2">
            <Link to="/orders" className="btn btn-primary"><ShoppingBag size={14} /> New Order</Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Recent Orders */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title" style={{ margin: 0 }}><TrendingUp size={16} color="#00d4ff" /> Recent Orders</div>
            <Link to="/orders" className="btn btn-sm btn-secondary" style={{ textDecoration: 'none' }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {(!s.recentOrders || s.recentOrders.length === 0) ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ShoppingBag size={48} /></div>
              <div className="empty-state-title">No orders yet</div>
              <div className="empty-state-desc">Create your first drip-feed order to get started.</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><Activity size={12} /></th>
                    <th><LinkIcon size={12} /> Link</th>
                    <th>Status</th>
                    <th><Eye size={12} /> Views</th>
                    <th><ThumbsUp size={12} /> Likes</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentOrders.map(order => (
                    <tr key={order._id}>
                      <td data-label="Platform"><PlatformIcon platform={order.platform} size={14} /></td>
                      <td data-label="Link">
                        <span className="truncate font-mono" title={order.socialLink}>{order.socialLink}</span>
                      </td>
                      <td data-label="Status">
                        <span className={`badge badge-${order.status}`}>
                          {order.status === 'running' && <span className="pulse-dot" style={{ marginRight: 6 }} />}
                          {order.status}
                        </span>
                      </td>
                      <td data-label="Views" className="text-cyan" style={{ fontWeight: 600 }}>
                        {order.deliveredViews?.toLocaleString()} <span style={{ opacity: 0.5, fontSize: 11 }}>/ {order.totalViews?.toLocaleString()}</span>
                      </td>
                      <td data-label="Likes" className="text-green" style={{ fontWeight: 600 }}>
                        {order.deliveredLikes?.toLocaleString()} <span style={{ opacity: 0.5, fontSize: 11 }}>/ {order.totalLikes?.toLocaleString()}</span>
                      </td>
                      <td>
                        <Link to={`/orders/${order._id}`} className="btn btn-sm btn-secondary" style={{ textDecoration: 'none' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
