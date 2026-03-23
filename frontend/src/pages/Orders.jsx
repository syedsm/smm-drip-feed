// src/pages/Orders.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Trash2, Pause, Play, Settings2, FileText, Server, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrders, createOrder, deleteOrder, updateOrderStatus, getTemplates, getPanels } from '../services/api';

const PLATFORMS = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'other'];

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
    <span style={{ fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
      <Clock size={12} /> {timeLeft}
    </span>
  );
}

function CreateOrderModal({ onClose, onCreated }) {
  const [templates, setTemplates] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('template'); // 'template' or 'custom'
  const [targetMode, setTargetMode] = useState('single'); // 'single' or 'batch'

  const [form, setForm] = useState({
    linksText: '',
    singleLink: '',
    platform: 'instagram',
    panelId: '',
    templateId: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([getTemplates(), getPanels()]).then(([t, p]) => {
      setTemplates(t.data);
      const activePanels = p.data.filter(x => x.isActive);
      setPanels(activePanels);
      
      const defaultPanel = activePanels.find(x => x.isDefault) || activePanels[0];
      if (defaultPanel) setForm(f => ({ ...f, panelId: defaultPanel._id }));
    }).catch(() => toast.error('Failed to load form data'));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setCustom = (k) => (e) => setForm(f => ({ ...f, customRules: { ...f.customRules, [k]: parseFloat(e.target.value) } }));

  // Service IDs are now pulled automatically from the template in the backend

  async function handleSubmit(e) {
    e.preventDefault();
    let links = [];
    if (targetMode === 'single') {
      if (!form.singleLink.trim()) return toast.error('Link is required');
      links = [form.singleLink.trim()];
    } else {
      links = form.linksText.split('\n').map(l => l.trim()).filter(l => l);
      if (!links.length) return toast.error('At least one link is required');
    }

    if (!form.panelId) return toast.error('Please select an SMM Panel');
    if (!form.templateId) return toast.error('Please select a template');

    setLoading(true);
    try {
      const payload = {
        links,
        platform: form.platform,
        panelId: form.panelId,
        templateId: form.templateId,
        notes: form.notes
      };

      await createOrder(payload);
      const msg = links.length > 1 ? `Created ${links.length} orders in bulk! 🚀` : 'Order created! Drip-feed started 🚀';
      toast.success(msg);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">Create New Order(s)</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Target Mode Toggle */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button type="button" className={`btn btn-sm ${targetMode === 'single' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTargetMode('single')} style={{ flex: 1 }}>
                Single Target
              </button>
              <button type="button" className={`btn btn-sm ${targetMode === 'batch' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTargetMode('batch')} style={{ flex: 1 }}>
                Batch (Multiple Links)
              </button>
            </div>

            {targetMode === 'single' ? (
              <div className="form-group">
                <label className="form-label">Single Target Link *</label>
                <input className="form-input" required type="url" value={form.singleLink} onChange={set('singleLink')} placeholder="https://instagram.com/p/..." />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label flex items-center justify-between">
                  <span>Target Links *</span>
                  <span className="form-hint" style={{ fontWeight: 'normal' }}>Paste 1 link per line</span>
                </label>
                <textarea className="form-textarea" required value={form.linksText} onChange={set('linksText')} placeholder="https://instagram.com/p/one&#10;https://instagram.com/p/two" rows={3} style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre' }} />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select className="form-select" value={form.platform} onChange={set('platform')}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label flex items-center gap-2"><Server size={14} color="#00d4ff" /> SMM Panel</label>
                <select className="form-select" value={form.panelId} onChange={set('panelId')} required>
                  {panels.length === 0 && <option value="">— No active panels —</option>}
                  {panels.map(p => <option key={p._id} value={p._id}>{p.name} {p.isDefault ? '(Default)' : ''}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)', marginTop: 12 }}>
                <label className="form-label text-cyan">Step 2: Select Saved Template *</label>
                {templates.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#f87171', margin: '8px 0' }}>⚠️ No templates found. Create one first!</p>
                ) : (
                  <select className="form-select" value={form.templateId} onChange={set('templateId')} required>
                    <option value="">— Select a template —</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} (Max: {t.maxViewsTotal?.toLocaleString()}v | {t.minLikesPerCycle}-{t.maxLikesPerCycle} Likes/cyc | Tick {t.likesStartTick}-{t.likesEndTick})
                      </option>
                    ))}
                  </select>
                )}
              </div>

            <div className="form-row mt-4">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes} onChange={set('notes')} placeholder="Optional..." />
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || panels.length === 0 || templates.length === 0}>
              {loading ? <span className="spinner" /> : '⚡'} Create Order(s)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function progressPct(order) {
  // Simple progress: let's say 10 drips is 100% for this "dummy" logic
  // or use order.totalViews if available.
  if (!order.totalViews) return Math.min(100, (order.delivered || 0) * 10);
  return Math.min(100, Math.round((order.deliveredViews / order.totalViews) * 100));
}

import { io } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const socket = io(SOCKET_URL);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const r = await getOrders(params);
      setOrders(r.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }

  useEffect(() => { 
    load();
    
    // Listen for real-time updates
    socket.on('order-update', (data) => {
      setOrders(prev => prev.map(order => 
        order._id === data.orderId 
          ? { 
              ...order, 
              delivered: data.delivered, 
              deliveredViews: data.deliveredViews,
              deliveredLikes: data.deliveredLikes,
              status: data.status, 
              nextDripAt: data.nextDripAt 
            }
          : order
      ));
    });

    return () => {
      socket.off('order-update');
    };
  }, [filter]);

  async function handleDelete(id) {
    if (!confirm('Delete this order and all its logs? This cannot be undone.')) return;
    try { await deleteOrder(id); toast.success('Order deleted'); load(); }
    catch { toast.error('Failed to delete order'); }
  }

  async function handleTogglePause(order) {
    const newStatus = order.status === 'paused' ? 'active' : 'paused';
    try { await updateOrderStatus(order._id, newStatus); toast.success(`Order ${newStatus === 'active' ? 'Resumed' : 'Paused'}`); load(); }
    catch { toast.error('Failed to update status'); }
  }

  const FILTERS = [
    { value: '', label: 'All' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Orders</h1>
            <p className="page-subtitle">Manage and monitor your drip-feed campaigns</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Order
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f.value} className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : orders.length === 0 ? (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No orders {filter ? `with status "${filter}"` : 'yet'}</div>
            <div className="empty-state-desc">Create your first drip-feed order to begin a campaign.</div>
          </div>
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => {
            const pct = progressPct(order);
            return (
              <div key={order._id} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                        <span className={`badge badge-${order.status}`}>
                          {order.status === 'running' && <span className="pulse-dot" />}
                          {order.status}
                        </span>
                        <span style={{ fontSize: 12, color: '#4a5568', textTransform: 'uppercase', fontWeight: 600 }}>{order.platform}</span>
                        {order.template && <span style={{ fontSize: 12, color: '#63b3ed' }}>📋 {order.template.name}</span>}
                      </div>
                      <div className="font-mono truncate" style={{ maxWidth: '80%', fontSize: 13, color: '#94a3b8' }} title={order.socialLink}>
                        {order.socialLink}
                      </div>
                      
                      {/* Live Timer Line */}
                      {order.status === 'active' && order.nextDripAt && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Next Drop In:</span>
                          <Countdown targetDate={order.nextDripAt} />
                        </div>
                      )}

                    </div>
                    <div className="flex gap-2">
                      {['active', 'running', 'paused'].includes(order.status) && (
                        <button className="btn btn-sm btn-secondary" title={order.status === 'paused' ? 'Resume' : 'Pause'} onClick={() => handleTogglePause(order)}>
                          {order.status === 'paused' ? <Play size={12} color="#10b981" /> : <Pause size={12} color="#f59e0b" />}
                        </button>
                      )}
                      <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(order._id)}><Trash2 size={12} /></button>
                      <Link to={`/orders/${order._id}`} className="btn btn-sm btn-secondary" style={{ textDecoration: 'none' }}>
                        Details <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>

                  <div className="progress-wrapper">
                    <div className="progress-label">
                      <span>Drip Progress</span>
                      <span className="truncate" style={{ maxWidth: '60%', textAlign: 'right' }} title={order.botStatus}>
                        {order.delivered || 0} drops completed
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="progress-label">
                      <span className="text-cyan">👁 Total Delivered: {order.delivered || 0}</span>
                      <span className="text-green">Status: {order.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
    </div>
  );
}
