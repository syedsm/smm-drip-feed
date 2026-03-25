// src/pages/Templates.jsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/api';

const DEFAULT_FORM = {
  name: '', description: '',
  viewsServiceId: '', likesServiceId: '',
  minViewsPerCycle: 100, maxViewsPerCycle: 250, maxViewsTotal: 5000,
  minLikesPerCycle: 10, maxLikesPerCycle: 30,
  totalHits: 0,
  likesStartTick: 3,
  minGapMins: 60, maxGapMins: 120,
};

function TemplateModal({ template, onClose, onSaved }) {
  const [form, setForm] = useState(template ? {
    name: template.name, description: template.description || '',
    viewsServiceId: template.viewsServiceId || '', likesServiceId: template.likesServiceId || '',
    minViewsPerCycle: template.minViewsPerCycle, maxViewsPerCycle: template.maxViewsPerCycle, maxViewsTotal: template.maxViewsTotal,
    minLikesPerCycle: template.minLikesPerCycle || 10, maxLikesPerCycle: template.maxLikesPerCycle || 0,
    totalHits: template.totalHits || 0,
    likesStartTick: template.likesStartTick || 1,
    minGapMins: template.minGapMins, maxGapMins: template.maxGapMins,
  } : DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) return toast.error('Template name is required');
    if (form.minViewsPerCycle > form.maxViewsPerCycle) return toast.error('Min Views Per Cycle must be ≤ Max Views Per Cycle');
    if (form.minLikesPerCycle > form.maxLikesPerCycle) return toast.error('Min Likes Per Cycle must be ≤ Max Likes Per Cycle');
    setLoading(true);
    try {
      if (template) { await updateTemplate(template._id, form); toast.success('Template updated!'); }
      else { await createTemplate(form); toast.success('Template created!'); }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save template');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{template ? 'Edit Template' : 'New Drip-Feed Template'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Viral Boost, Organic Growth..." required />
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label className="form-label">Views Service ID *</label>
                <input className="form-input" value={form.viewsServiceId} onChange={set('viewsServiceId')} placeholder="e.g. 1042" required />
              </div>
              <div className="form-group">
                <label className="form-label">Likes Service ID *</label>
                <input className="form-input" value={form.likesServiceId} onChange={set('likesServiceId')} placeholder="e.g. 1055" required />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Optional notes..." rows={2} />
            </div>
            <hr className="divider" />
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontSize: 13, color: 'var(--purple)' }}>Total Campaign Limit</label>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Max Views (Stop Condition)</label>
                  <input className="form-input btn-sm" type="number" min="100" value={form.maxViewsTotal} onChange={set('maxViewsTotal')} required />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 13, color: 'var(--cyan)' }}>Per-Cycle View Settings</label>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Min Views / Cycle</label>
                  <input className="form-input btn-sm" type="number" min="100" value={form.minViewsPerCycle} onChange={set('minViewsPerCycle')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Max Views / Cycle</label>
                  <input className="form-input btn-sm" type="number" min="100" value={form.maxViewsPerCycle} onChange={set('maxViewsPerCycle')} required />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 13, color: 'var(--green)' }}>Systematic Likes Logic</label>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Start @ Tick #</label>
                  <input className="form-input btn-sm" type="number" min="1" value={form.likesStartTick} onChange={set('likesStartTick')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Min Likes / Hit</label>
                  <input className="form-input btn-sm" type="number" min="10" value={form.minLikesPerCycle} onChange={set('minLikesPerCycle')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Max Likes / Hit</label>
                  <input className="form-input btn-sm" type="number" min="10" value={form.maxLikesPerCycle} onChange={set('maxLikesPerCycle')} required />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 8 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Total Hits (Random Ticks)</label>
                  <input className="form-input btn-sm" type="number" min="0" value={form.totalHits} onChange={set('totalHits')} placeholder="e.g. 10" />
                </div>
              </div>
              <span className="form-hint" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                * Deliver likes on <b>Total Hits</b> random ticks across the campaign cycle.
              </span>
            </div>

            <hr className="divider" />
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Min Gap (mins)</label>
                <input className="form-input btn-sm" type="number" min="1" value={form.minGapMins} onChange={set('minGapMins')} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Max Gap (mins)</label>
                <input className="form-input btn-sm" type="number" min="1" value={form.maxGapMins} onChange={set('maxGapMins')} required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try { const r = await getTemplates(); setTemplates(r.data); }
    catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, name) {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try { await deleteTemplate(id); toast.success('Template deleted'); load(); }
    catch { toast.error('Failed to delete template'); }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Templates</h1>
            <p className="page-subtitle">Configure drip-feed delivery templates with view/like parameters</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={14} /> New Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : templates.length === 0 ? (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No templates yet</div>
            <div className="empty-state-desc">Create a template to define how views and likes are drip-fed.</div>
          </div>
        </div></div>
      ) : (
        <div className="grid grid-3">
          {templates.map(t => (
             <div key={t._id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={16} color="var(--cyan)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                      {t.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.description}</div>}
                      {(t.viewsServiceId || t.likesServiceId) && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 8 }}>
                          {t.viewsServiceId && <span>👁 Srv: {t.viewsServiceId}</span>}
                          {t.likesServiceId && <span>👍 Srv: {t.likesServiceId}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-secondary" title="Edit" onClick={() => { setEditing(t); setShowModal(true); }}><Pencil size={12} /></button>
                    <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(t._id, t.name)}><Trash2 size={12} /></button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div className="border-purple" style={{ background: 'var(--purple-dim)', borderRadius: 8, padding: '8px 12px', border: '1px solid transparent' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, marginBottom: 2 }}>TOTAL LIMIT</span>
                    <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{t.maxViewsTotal?.toLocaleString()} v</span>
                  </div>
                  <div className="border-cyan" style={{ background: 'var(--cyan-dim)', borderRadius: 8, padding: '8px 12px', border: '1px solid transparent' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, marginBottom: 2 }}>VIEWS/CYCLE</span>
                    <span className="text-cyan" style={{ fontWeight: 700 }}>{t.minViewsPerCycle?.toLocaleString()}–{t.maxViewsPerCycle?.toLocaleString()}</span>
                  </div>
                  <div className="border-green" style={{ background: 'var(--green-dim)', borderRadius: 8, padding: '8px 12px', gridColumn: '1 / span 2', border: '1px solid transparent' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, marginBottom: 2 }}>LIKES (ORGANIC)</span>
                    <div style={{ color: 'var(--green)', fontWeight: 700 }}>
                      {t.totalHits > 0 ? (
                        <span>Hits: {t.totalHits} random ticks</span>
                      ) : (
                        <span>{t.minLikesPerCycle}–{t.maxLikesPerCycle} /hit</span>
                      )}
                      <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 8 }}>• From Tick {t.likesStartTick}</span>
                    </div>
                  </div>
                  <div className="border-yellow" style={{ background: 'var(--yellow-dim)', borderRadius: 8, padding: '8px 12px', gridColumn: '1 / span 2', border: '1px solid transparent' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, marginBottom: 2 }}>GAP (MINS)</span>
                    <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>{t.minGapMins}–{t.maxGapMins}</span>
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  Created {new Date(t.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TemplateModal
          template={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
