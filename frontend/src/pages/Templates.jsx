// src/pages/Templates.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Pencil, Trash2, Layers, Server, Clock, Settings2, 
  Eye, ThumbsUp, MessageSquare, Share2, HelpCircle, 
  ChevronDown, ChevronUp, Search, Info, Check, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getTemplates, createTemplate, updateTemplate, deleteTemplate, 
  getPanels 
} from '../services/api';

const CATEGORIES = [
  { value: 'Starter', label: 'Starter', range: '3K–5K Target', color: 'var(--green)', colorDim: 'var(--green-dim)', iconStyle: 'border-green-badge' },
  { value: 'Growth', label: 'Growth', range: '10K–25K Target', color: 'var(--cyan)', colorDim: 'var(--cyan-dim)', iconStyle: 'border-cyan-badge' },
  { value: 'Momentum', label: 'Momentum', range: '25K–100K Target', color: 'var(--yellow)', colorDim: 'var(--yellow-dim)', iconStyle: 'border-yellow-badge' },
  { value: 'Viral', label: 'Viral', range: '100K+ Target', color: 'var(--purple)', colorDim: 'var(--purple-dim)', iconStyle: 'border-purple-badge' },
  { value: 'Elite', label: 'Elite', range: '500K+ Target', color: 'var(--red)', colorDim: 'var(--red-dim)', iconStyle: 'border-danger-badge' },
];

export { CATEGORIES };

import TemplateModal from '../components/TemplateModal';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([getTemplates(), getPanels()]);
      setTemplates(tRes.data || []);
      setPanels(pRes.data || []);
    } catch {
      toast.error('Failed to load Organic preset templates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, name) {
    if (!confirm(`Delete SMM Preset template "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTemplate(id);
      toast.success('Preset Template Deleted Successfully!');
      load();
    } catch {
      toast.error('Failed to delete SMM preset template');
    }
  }

  const CATEGORY_ORDER = { 'Starter': 0, 'Growth': 1, 'Momentum': 2, 'Viral': 3, 'Elite': 4 };

  // Filter and sort templates list sequentially
  const filteredTemplates = templates
    .filter(t => {
      const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
      const matchesSearch = searchQuery === '' || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      const orderA = CATEGORY_ORDER[a.category] ?? 99;
      const orderB = CATEGORY_ORDER[b.category] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

  const singleTemplates = filteredTemplates.filter(t => (t.type || 'single') === 'single');
  const bulkTemplates = filteredTemplates.filter(t => t.type === 'bulk');

  function renderTemplateGrid(list, title, emptyMsg, badgeBg, badgeColor, badgeText) {
    return (
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, color: 'var(--text-primary)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: badgeColor }} />
          {title} ({list.length})
        </h2>
        {list.length === 0 ? (
          <div className="card" style={{ border: '1px dashed var(--border)', background: 'rgba(255,255,255,0.01)' }}><div className="card-body" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px 20px' }}>
            {emptyMsg}
          </div></div>
        ) : (
          <div className="grid grid-3">
            {list.map(t => {
              const catDetails = CATEGORIES.find(c => c.value === t.category) || CATEGORIES[0];
              return (
                <div key={t._id} className="card shadow-hover-card" style={{ border: `1px solid var(--border)` }}>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 18 }}>
                    
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div className={`card-icon-wrapper ${catDetails.iconStyle}`} style={{ flexShrink: 0 }}>
                          <Layers size={15} style={{ color: catDetails.color }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.2 }}>{t.name}</div>
                          {t.description && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {t.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-sm btn-secondary" title="Edit Template Manager" onClick={() => { setEditing(t); setShowModal(true); }} style={{ padding: 6, height: 26, width: 26 }}><Pencil size={12} /></button>
                        <button className="btn btn-sm btn-danger" title="Delete Preset" onClick={() => handleDelete(t._id, t.name)} style={{ padding: 6, height: 26, width: 26 }}><Trash2 size={12} /></button>
                      </div>
                    </div>

                    {/* Badges list */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        background: badgeBg, 
                        color: badgeColor,
                        textTransform: 'uppercase'
                      }}>
                        {badgeText}
                      </span>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        background: catDetails.colorDim, 
                        color: catDetails.color,
                        textTransform: 'uppercase'
                      }}>
                        {t.category}
                      </span>
                      {t.workingHoursEnabled && (
                        <span style={{ 
                          fontSize: 10, 
                          fontWeight: 600, 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          background: 'var(--yellow-dim)', 
                          color: 'var(--yellow)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <Clock size={10} /> Active Hours
                        </span>
                      )}
                    </div>

                    <hr className="divider" style={{ margin: '4px 0' }} />

                    {/* Service Panels breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Service Panel Configurations</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={11} color="var(--purple)" /> Views</span>
                        <span className="font-mono text-secondary" style={{ color: 'var(--text-primary)' }}>
                          {t.viewsServiceId ? `ID: ${t.viewsServiceId} (${t.viewsPanel?.name || 'Default'})` : 'Not configured'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={11} color="var(--green)" /> Likes</span>
                        <span className="font-mono text-secondary">
                          {t.likesServiceId ? `ID: ${t.likesServiceId} (${t.likesPanel?.name || 'Default'})` : 'Not configured'}
                        </span>
                      </div>

                      {t.enableComments && t.commentsServiceId && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={11} color="var(--cyan)" /> Comments</span>
                          <span className="font-mono text-secondary">
                            {`ID: ${t.commentsServiceId} (${t.commentsPanel?.name || 'Default'})`}
                          </span>
                        </div>
                      )}

                      {t.enableShares && t.sharesServiceId && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Share2 size={11} color="var(--yellow)" /> Shares</span>
                          <span className="font-mono text-secondary">
                            {`ID: ${t.sharesServiceId} (${t.sharesPanel?.name || 'Default'})`}
                          </span>
                        </div>
                      )}
                    </div>

                     {/* Quantitative Target Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                        <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>CAMPAIGN VIEWS</span>
                        <span style={{ fontWeight: 700, color: 'var(--purple)', fontSize: 13 }}>
                          {t.type === 'bulk' 
                            ? `${t.minViewsTotal?.toLocaleString()}–${t.maxViewsTotal?.toLocaleString()}` 
                            : `${t.maxViewsTotal?.toLocaleString()}`
                          } views
                        </span>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                        <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>VIEWS / TRIGGER CYCLE</span>
                        <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{t.minViewsPerCycle?.toLocaleString()}–{t.maxViewsPerCycle?.toLocaleString()}</span>
                      </div>

                      {t.engagementMode === 'percentage' ? (
                        <>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                            <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>LIKES RATIO</span>
                            <span style={{ fontWeight: 700, color: 'var(--green)' }}>{t.likesRatioMin}%–{t.likesRatioMax}%</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                            <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>COMMENTS & SHARES RATIO</span>
                            <span style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: 11 }}>
                              C: {t.commentsRatioMin}%–{t.commentsRatioMax}% | S: {t.sharesRatioMin}%–{t.sharesRatioMax}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                            <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>LIKES TARGET</span>
                            <span style={{ fontWeight: 700, color: 'var(--green)' }}>
                              {t.type === 'bulk' 
                                ? `${t.minLikesTotal?.toLocaleString()}–${t.maxLikesTotal?.toLocaleString()}` 
                                : `${t.totalLikes?.toLocaleString()}`
                              }
                            </span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                            <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>COMMENTS & SHARES</span>
                            <span style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: 11 }}>
                              {t.type === 'bulk'
                                ? `C: ${t.minCommentsTotal}–${t.maxCommentsTotal} | S: ${t.minSharesTotal}–${t.maxSharesTotal}`
                                : `C: ${t.maxCommentsTotal} | S: ${t.maxSharesTotal}`
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                      <span>presets Strategy manager</span>
                      <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Organic Growth Templates</h1>
            <p className="page-subtitle">Configure, test, and categorise drip-feed growth profiles for campaigns</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => { setEditing({ type: 'single' }); setShowModal(true); }}>
              <Plus size={14} /> + New Single Preset
            </button>
            <button className="btn btn-primary" onClick={() => { setEditing({ type: 'bulk' }); setShowModal(true); }}>
              <Plus size={14} /> + New Bulk Preset
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 16, 
        marginBottom: 20, 
        flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.01)',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid var(--border)'
      }}>
        {/* Filters Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 280 }}>
          {/* Category Filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${categoryFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setCategoryFilter('All')}
              style={{ fontSize: 11 }}
            >
              All Categories ({templates.length})
            </button>
            {CATEGORIES.map(c => {
              const count = templates.filter(t => t.category === c.value).length;
              const isActive = categoryFilter === c.value;
              return (
                <button 
                  key={c.value} 
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`} 
                  onClick={() => setCategoryFilter(c.value)}
                  style={{ 
                    borderColor: isActive ? 'transparent' : 'var(--border)',
                    color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    fontSize: 11
                  }}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: c.color, marginRight: 6 }} />
                  {c.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Type Selection Group */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Preset Type Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', minWidth: 180, height: 36 }}>
            <Layers size={14} color="var(--text-muted)" />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ 
                background: 'none', 
                border: 'none', 
                outline: 'none', 
                color: 'var(--text-primary)', 
                fontSize: 12,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <option value="all">All Types</option>
              <option value="single">Single Target Only</option>
              <option value="bulk">Bulk Targets Only</option>
            </select>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', minWidth: 260, height: 36 }}>
            <Search size={14} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search templates by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                background: 'none', 
                border: 'none', 
                outline: 'none', 
                color: 'var(--text-primary)', 
                fontSize: 12,
                width: '100%',
                padding: '4px 0'
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(typeFilter === 'all' || typeFilter === 'single') && renderTemplateGrid(
            singleTemplates, 
            'Single Target Preset Templates', 
            'No matching single presets found. Adjust filters or category selection.',
            'var(--blue-dim)', 
            'var(--cyan)',
            'Single Preset'
          )}
          {(typeFilter === 'all' || typeFilter === 'bulk') && renderTemplateGrid(
            bulkTemplates, 
            'Bulk Target Preset Templates', 
            'No matching bulk presets found. Adjust filters or category selection.',
            'var(--yellow-dim)', 
            'var(--yellow)',
            'Bulk Preset'
          )}
        </div>
      )}

      {/* Model Overlay for CRUD template elements */}
      {showModal && (
        <TemplateModal
          template={editing}
          templates={templates}
          panels={panels}
          CATEGORIES={CATEGORIES}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
