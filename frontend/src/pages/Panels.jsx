// src/pages/Panels.jsx
import { useState, useEffect } from 'react';
import { Plus, Server, Pencil, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPanels, createPanel, updatePanel, deletePanel } from '../services/api';

const DEFAULT_FORM = {
  name: '', apiUrl: '', apiKey: '',
  isDefault: false, isActive: true
};

function PanelModal({ panel, onClose, onSaved }) {
  const [form, setForm] = useState(panel ? { ...panel } : DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({
    ...f,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.apiUrl || !form.apiKey) {
      return toast.error('All fields except checkboxes are required');
    }
    setLoading(true);
    try {
      if (panel) { await updatePanel(panel._id, form); toast.success('Panel updated!'); }
      else { await createPanel(form); toast.success('Panel created!'); }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save panel');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{panel ? 'Edit SMM Panel' : 'Add SMM Panel'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Panel Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Peakerr, JustAnotherPanel" required />
            </div>
            <div className="form-group">
              <label className="form-label">API URL *</label>
              <input className="form-input" value={form.apiUrl} onChange={set('apiUrl')} placeholder="https://panel.example.com/api/v2" type="url" required />
            </div>
            <div className="form-group">
              <label className="form-label">API Key *</label>
              <input className="form-input" value={form.apiKey} onChange={set('apiKey')} placeholder="Your secret API key" type="password" required />
            </div>
            <hr className="divider" />

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {panel ? 'Save Changes' : 'Add Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Panels() {
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try { const r = await getPanels(); setPanels(r.data); }
    catch { toast.error('Failed to load panels'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, name, isDefault) {
    if (isDefault) {
      if (!confirm('This is the default panel! It will be deleted and the next available panel will become default. Continue?')) return;
    } else {
      if (!confirm(`Delete SMM panel "${name}"? Active orders using this panel will fail.`)) return;
    }

    try { await deletePanel(id); toast.success('Panel deleted'); load(); }
    catch { toast.error('Failed to delete panel'); }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">SMM Panels</h1>
            <p className="page-subtitle">Configure external API integrations for order delivery</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={14} /> Add Panel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : panels.length === 0 ? (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <div className="empty-state-icon">🔌</div>
            <div className="empty-state-title">No panels configured</div>
            <div className="empty-state-desc">Add your SMM Panel API details to start delivering views and likes.</div>
          </div>
        </div></div>
      ) : (
        <div className="grid grid-3">
          {panels.map(p => (
            <div key={p._id} className="card" style={{ opacity: p.isActive ? 1 : 0.6 }}>
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Server size={16} color="var(--cyan)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.name}
                        {p.isDefault && <CheckCircle size={14} color="var(--green)" title="Default Panel" />}
                      </div>
                      <div style={{ fontSize: 11, color: p.isActive ? 'var(--green)' : 'var(--red)', marginTop: 2, fontWeight: 600 }}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-secondary" title="Edit" onClick={() => { setEditing(p); setShowModal(true); }}><Pencil size={12} /></button>
                    <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(p._id, p.name, p.isDefault)}><Trash2 size={12} /></button>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border)' }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted">API URL</span>
                    <span className="font-mono text-secondary truncate" title={p.apiUrl} style={{ color: 'var(--text-secondary)' }}>{p.apiUrl}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PanelModal
          panel={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
