// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, ShoppingBag, Layers, TrendingUp, ArrowRight } from 'lucide-react';
import { getStats } from '../services/api';

function StatCard({ label, value, sub, color, icon: Icon }) {
  const colors = { cyan: '#00d4ff', green: '#34d399', purple: '#a78bfa', yellow: '#fbbf24' };
  const dims = { cyan: 'rgba(0,212,255,0.12)', green: 'rgba(52,211,153,0.12)', purple: 'rgba(167,139,250,0.12)', yellow: 'rgba(251,191,36,0.12)' };
  return (
    <div className="card stat-card">
      <div className="stat-card-icon" style={{ background: dims[color] }}>
        <Icon size={18} color={colors[color]} />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color: colors[color] }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

function PlatformIcon({ platform }) {
  const icons = { instagram: '📸', youtube: '▶️', tiktok: '🎵', twitter: '🐦', facebook: '📘', other: '🔗' };
  return <span>{icons[platform] || '🔗'}</span>;
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
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No orders yet</div>
              <div className="empty-state-desc">Create your first drip-feed order to get started.</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Link</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentOrders.map(order => (
                    <tr key={order._id}>
                      <td><PlatformIcon platform={order.platform} /></td>
                      <td><span className="truncate font-mono" title={order.socialLink}>{order.socialLink}</span></td>
                      <td>
                        <span className={`badge badge-${order.status}`}>
                          {order.status === 'running' && <span className="pulse-dot" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="text-cyan">{order.deliveredViews?.toLocaleString()} / {order.totalViews?.toLocaleString()}</td>
                      <td className="text-green">{order.deliveredLikes?.toLocaleString()} / {order.totalLikes?.toLocaleString()}</td>
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
