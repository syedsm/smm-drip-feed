// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, ShoppingBag, Layers, TrendingUp, ArrowRight, Link as LinkIcon, Activity, MessageSquare, Share2 } from 'lucide-react';
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

      {/* Platform Categorized Stats */}
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <Activity size={16} color="var(--cyan)" /> Platform Distribution
      </div>
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {Object.entries(s.platformStats || {}).map(([key, data]) => {
          const colorMap = {
            youtube: 'yt',
            instagram: 'ig',
            tiktok: 'tt',
            facebook: 'fb'
          };
          const nameMap = {
            youtube: 'YouTube',
            instagram: 'Instagram',
            tiktok: 'TikTok',
            facebook: 'Facebook'
          };
          const color = colorMap[key] || 'cyan';
          return (
            <div key={key} className={`card border-${color}`} style={{ padding: '20px 24px', transition: 'var(--transition)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PlatformIcon platform={key} size={16} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {nameMap[key]}
                  </h3>
                </div>
                <span className="badge badge-completed" style={{ fontSize: 11, background: 'rgba(56,189,248,0.1)', color: 'var(--cyan)' }}>
                  {data.activeOrders} Active
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span>Total Campaigns</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.totalOrders}</span>
                </div>
                <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span>Views Delivered</span>
                  <span className="text-cyan" style={{ fontWeight: 600 }}>{data.deliveredViews?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span>Likes Delivered</span>
                  <span className="text-green" style={{ fontWeight: 600 }}>{data.deliveredLikes?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comments & Shares</span>
                  <span className="text-yellow" style={{ fontWeight: 600 }}>
                    {((data.deliveredComments || 0) + (data.deliveredShares || 0))?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
                    <th><MessageSquare size={12} /> Comments</th>
                    <th><Share2 size={12} /> Shares</th>
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
                      <td data-label="Comments" className="text-cyan" style={{ fontWeight: 600 }}>
                        {order.commentsServiceId ? (
                          <>
                            {(order.deliveredComments || 0).toLocaleString()} <span style={{ opacity: 0.5, fontSize: 11 }}>/ {(order.totalComments || 0).toLocaleString()}</span>
                          </>
                        ) : '-'}
                      </td>
                      <td data-label="Shares" className="text-yellow" style={{ fontWeight: 600 }}>
                        {order.sharesServiceId ? (
                          <>
                            {(order.deliveredShares || 0).toLocaleString()} <span style={{ opacity: 0.5, fontSize: 11 }}>/ {(order.totalShares || 0).toLocaleString()}</span>
                          </>
                        ) : '-'}
                      </td>
                      <td data-label="Action">
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
