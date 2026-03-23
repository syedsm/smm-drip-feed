// src/pages/OrderDetail.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Pause, Play, ArrowLeft, Download, RefreshCw, Clock, Eye, ThumbsUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrder, getOrderReport, deleteOrder, updateOrderStatus } from '../services/api';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0e1628', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>Tick {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{Number(p.value).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
}

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return setTimeLeft('Dropping now...');
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  if (!targetDate) return null;
  return (
    <span style={{ fontSize: 13, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, background: 'rgba(251,191,36,0.1)', padding: '4px 10px', borderRadius: 6 }}>
      <Clock size={14} /> Next Drop In: {timeLeft}
    </span>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await getOrder(id);
      setOrder(r.data);
      setLogs(r.logs || []);
    } catch { toast.error('Failed to load order'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(() => { 
      if (['running', 'pending', 'active'].includes(order?.status)) load(); 
    }, 15000);
    return () => clearInterval(t);
  }, [load, order?.status]);

  function handleRefresh() { setRefreshing(true); load(); }

  async function handleDelete() {
    if (!confirm('Delete this order and all logs? This cannot be undone.')) return;
    try { await deleteOrder(id); toast.success('Order deleted'); navigate('/orders'); }
    catch { toast.error('Failed to delete'); }
  }
  
  async function handleTogglePause() {
    if (!order) return;
    const newStatus = order.status === 'paused' ? 'active' : 'paused';
    try { 
      await updateOrderStatus(order._id, newStatus); 
      toast.success(`Order ${newStatus === 'active' ? 'Resumed' : 'Paused'}`); 
      load(); 
    } catch { toast.error('Failed to update status'); }
  }

  async function handleDownloadReport() {
    try {
      const r = await getOrderReport(id);
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smm-report-${id.slice(-8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Failed to generate report'); }
  }

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!order) return <div className="page-header"><p className="text-muted">Order not found.</p></div>;

  // Build chart data: merge schedule (planned) with logs (actual)
  const chartData = order.schedule.map(slot => {
    const log = logs.find(l => l.tick === slot.tick);
    return {
      tick: slot.tick,
      plannedViews: slot.views,
      actualViews: log ? log.views : null,
      plannedLikes: slot.likes,
      actualLikes: log ? log.likes : null,
    };
  });

  // Cumulative chart
  let cumViews = 0, cumLikes = 0;
  const cumulativeData = order.schedule.map(slot => {
    const log = logs.find(l => l.tick === slot.tick);
    if (log) { cumViews += log.views; cumLikes += log.likes; }
    return { tick: slot.tick, cumulativeViews: log ? cumViews : null, cumulativeLikes: log ? cumLikes : null, targetViews: Math.round((slot.tick / order.totalTicks) * order.totalViews) };
  });

  const pct = order.totalViews > 0 ? Math.min(100, Math.round((order.deliveredViews / order.totalViews) * 100)) : 0;
  const likesViewsRatio = order.deliveredViews > 0
    ? ((order.deliveredLikes / order.deliveredViews) * 100).toFixed(1)
    : '0.0';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
          <Link to="/orders" className="btn btn-sm btn-secondary" style={{ textDecoration: 'none' }}><ArrowLeft size={13} /> Back</Link>
          <span className={`badge badge-${order.status}`}>
            {order.status === 'running' && <span className="pulse-dot" />}
            {order.status}
          </span>
          <span style={{ fontSize: 12, color: '#4a5568', textTransform: 'uppercase', fontWeight: 600 }}>{order.platform}</span>
        </div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title" style={{ fontSize: 20 }}>Order Detail</h1>
            <p className="page-subtitle font-mono" style={{ marginBottom: 4 }}>{order.socialLink}</p>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              <Zap size={10} style={{ display: 'inline', marginRight: 2 }} /> Views Service ID: {order.viewsServiceId || 'N/A'} &nbsp;|&nbsp; 
              <ThumbsUp size={10} style={{ display: 'inline', marginLeft: 6, marginRight: 2 }} /> Likes Service ID: {order.likesServiceId || 'N/A'}
            </p>
            
            {['pending', 'running'].includes(order.status) && (() => {
              const nextSlot = order.schedule?.find(s => !s.delivered);
              return nextSlot ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Countdown targetDate={nextSlot.scheduledAt} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Targeting <strong>{nextSlot.views} views</strong> {nextSlot.likes > 0 && `and ${nextSlot.likes} likes`}
                  </span>
                </div>
              ) : null;
            })()}
            
          </div>
          <div className="flex gap-2">
            {['active', 'running', 'paused'].includes(order.status) && (
              <button className="btn btn-sm btn-secondary" onClick={handleTogglePause}>
                {order.status === 'paused' ? <Play size={12} color="#10b981" /> : <Pause size={12} color="#f59e0b" />}
                {order.status === 'paused' ? 'Resume' : 'Pause'}
              </button>
            )}
            <button className="btn btn-sm btn-secondary" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={12} className={refreshing ? 'spinning' : ''} /> Refresh
            </button>
            {order.status === 'completed' && (
              <button className="btn btn-sm btn-primary" onClick={handleDownloadReport}><Download size={12} /> Report</button>
            )}
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Bot Tracker', value: `${pct}%`, sub: order.botStatus || 'Initializing...', color: '#00d4ff', icon: Zap },
          { label: 'Views Delivered', value: order.deliveredViews.toLocaleString(), sub: `of ${order.totalViews.toLocaleString()}`, color: '#a78bfa', icon: Eye },
          { label: 'Likes Delivered', value: order.deliveredLikes.toLocaleString(), sub: `of ${order.totalLikes.toLocaleString()}`, color: '#34d399', icon: ThumbsUp },
          { label: 'Likes/Views Ratio', value: `${likesViewsRatio}%`, sub: 'Overall Campaign Avg', color: '#fbbf24', icon: Clock },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="card stat-card">
            <div className="stat-card-icon" style={{ background: `${color}18` }}><Icon size={16} color={color} /></div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value" style={{ color }}>{value}</div>
            <div className="stat-card-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="progress-wrapper">
            <div className="progress-label">
              <span style={{ fontWeight: 600 }}>Overall Progress</span>
              <span>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            {order.startedAt && (
              <div className="progress-label">
                <span className="text-muted">Started: {new Date(order.startedAt).toLocaleString()}</span>
                {order.completedAt && <span className="text-muted">Completed: {new Date(order.completedAt).toLocaleString()}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-Tick Bar Chart - Removed as requested */}

      {/* Actual Delivery Growth Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="section-title"><Zap size={15} color="#00d4ff" /> Delivery Growth (Actual Views & Likes)</div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Shows the accumulation of views and likes over time as drips are delivered.</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cumulativeData.filter(d => d.cumulativeViews !== null)} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="tick" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="cumulativeViews" name="Views Delivered" stroke="#00d4ff" fill="url(#gViews)" strokeWidth={3} dot={{ r: 4, fill: '#00d4ff', strokeWidth: 2, stroke: '#0e1628' }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="cumulativeLikes" name="Likes Delivered" stroke="#34d399" fill="url(#gLikes)" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 2, stroke: '#0e1628' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delivery Log Table */}
      <div className="card">
        <div className="card-body">
          <div className="section-title"><Clock size={15} color="#fbbf24" /> Delivery Log ({logs.length} entries)</div>
          {logs.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 14, paddingTop: 8 }}>No deliveries yet. The background scheduler will process ticks automatically.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tick</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Status</th>
                    <th>Delivered At</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.tick}>
                      <td><span style={{ fontWeight: 700 }}>#{log.tick}</span></td>
                      <td className="text-cyan">{log.views.toLocaleString()}</td>
                      <td className="text-green">{log.likes.toLocaleString()}</td>
                      <td>
                        {log.success
                          ? <span className="badge badge-completed" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>✓ OK</span>
                          : <span className="badge badge-failed" title={log.errorMessage} style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>✗ {log.errorMessage || 'Error'}</span>}
                      </td>
                      <td style={{ color: '#4a5568', fontSize: 12 }}>{new Date(log.deliveredAt).toLocaleString()}</td>
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
