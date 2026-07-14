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
  getPanels, getPanelServices 
} from '../services/api';

const CATEGORIES = [
  { value: 'Starter', label: 'Starter', range: '1K–5K Target', color: 'var(--green)', colorDim: 'var(--green-dim)', iconStyle: 'border-green-badge' },
  { value: 'Growth', label: 'Growth', range: '5K–25K Target', color: 'var(--cyan)', colorDim: 'var(--cyan-dim)', iconStyle: 'border-cyan-badge' },
  { value: 'Momentum', label: 'Momentum', range: '25K–100K Target', color: 'var(--yellow)', colorDim: 'var(--yellow-dim)', iconStyle: 'border-yellow-badge' },
  { value: 'Viral', label: 'Viral', range: '100K–500K Target', color: 'var(--purple)', colorDim: 'var(--purple-dim)', iconStyle: 'border-purple-badge' },
  { value: 'Elite', label: 'Elite', range: '500K–1M+ Target', color: 'var(--red)', colorDim: 'var(--red-dim)', iconStyle: 'border-danger-badge' },
];

const PRESETS = {
  Starter: { maxViewsTotal: 5000, minViewsPerCycle: 100, maxViewsPerCycle: 250, minGapMins: 45, maxGapMins: 90 },
  Growth: { maxViewsTotal: 25000, minViewsPerCycle: 300, maxViewsPerCycle: 800, minGapMins: 30, maxGapMins: 90 },
  Momentum: { maxViewsTotal: 100000, minViewsPerCycle: 1000, maxViewsPerCycle: 3000, minGapMins: 20, maxGapMins: 60 },
  Viral: { maxViewsTotal: 500000, minViewsPerCycle: 3000, maxViewsPerCycle: 10000, minGapMins: 10, maxGapMins: 30 },
  Elite: { maxViewsTotal: 1000000, minViewsPerCycle: 10000, maxViewsPerCycle: 35000, minGapMins: 5, maxGapMins: 15 },
};

const GROWTH_TYPES = ['Slow Organic', 'Balanced', 'Aggressive', 'Custom'];
const ACCELERATION_CURVES = ['Slow Start', 'Balanced', 'Fast Push', 'Custom'];

const DEFAULT_FORM = {
  name: '',
  description: '',
  category: 'Starter',
  growthType: 'Balanced',
  
  viewsPanel: '',
  likesPanel: '',
  commentsPanel: '',
  sharesPanel: '',

  viewsServiceId: '',
  likesServiceId: '',
  commentsServiceId: '',
  sharesServiceId: '',

  minViewsPerCycle: 100,
  maxViewsPerCycle: 250,
  maxViewsTotal: 5000,
  viewsRandomizationPct: 10,
  viewsPauseLogic: false,
  accelerationCurve: 'Balanced',

  likesStartTick: 3,
  minLikesPerCycle: 0,
  maxLikesPerCycle: 0,
  likesTotalHits: 0,
  likesDelayMins: 0,

  enableComments: false,
  minCommentsPerCycle: 2,
  maxCommentsPerCycle: 5,
  commentsStartTick: 3,
  commentsDelayMins: 0,

  enableShares: false,
  minSharesPerCycle: 5,
  maxSharesPerCycle: 15,
  sharesStartTick: 2,
  sharesDelayMins: 0,

  minGapMins: 45,
  maxGapMins: 90,
  workingHoursEnabled: false,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  pauseBetweenCycles: false,

  randomizeEverything: false,
  smartDistribution: true,
  skipDeadCycles: true,
  retryFailedOrders: false,
  autoStop: false,
  notes: '',
};



function TemplateModal({ template, panels, onClose, onSaved }) {
  const [form, setForm] = useState(template ? { ...template } : DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  
  // Panel Services Lists
  const [viewsServices, setViewsServices] = useState([]);
  const [likesServices, setLikesServices] = useState([]);
  const [commentsServices, setCommentsServices] = useState([]);
  const [sharesServices, setSharesServices] = useState([]);

  // Panel Services Loading States
  const [loadingServices, setLoadingServices] = useState({
    views: false, likes: false, comments: false, shares: false
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Field change assistant
  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };
  const setNum = (k) => (e) => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }));

  // Load Services when panel changes
  const loadServicesForPanel = async (panelId, type) => {
    if (!panelId) {
      if (type === 'views') setViewsServices([]);
      if (type === 'likes') setLikesServices([]);
      if (type === 'comments') setCommentsServices([]);
      if (type === 'shares') setSharesServices([]);
      return;
    }
    setLoadingServices(prev => ({ ...prev, [type]: true }));
    try {
      const res = await getPanelServices(panelId);
      const formatted = (res.services || []).map(s => ({
        value: s.service,
        label: `ID: ${s.service} — ${s.name} (${s.category})`
      }));
      if (type === 'views') setViewsServices(formatted);
      if (type === 'likes') setLikesServices(formatted);
      if (type === 'comments') setCommentsServices(formatted);
      if (type === 'shares') setSharesServices(formatted);
    } catch {
      toast.error(`Failed to load services for selected ${type} panel`);
    } finally {
      setLoadingServices(prev => ({ ...prev, [type]: false }));
    }
  };

  // Preset Auto-fill on Category change
  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    const preset = PRESETS[cat] || PRESETS.Starter;
    setForm(f => ({
      ...f,
      category: cat,
      maxViewsTotal: preset.maxViewsTotal,
      minViewsPerCycle: preset.minViewsPerCycle,
      maxViewsPerCycle: preset.maxViewsPerCycle,
      minGapMins: preset.minGapMins,
      maxGapMins: preset.maxGapMins,
    }));
  };

  // Initialize Panel Services dropdowns on edit
  useEffect(() => {
    if (template) {
      if (template.viewsPanel) loadServicesForPanel(template.viewsPanel, 'views');
      if (template.likesPanel) loadServicesForPanel(template.likesPanel, 'likes');
      if (template.commentsPanel) loadServicesForPanel(template.commentsPanel, 'comments');
      if (template.sharesPanel) loadServicesForPanel(template.sharesPanel, 'shares');
    } else {
      // Pre-select default SMM Panel if available
      const defaultPanel = panels.find(p => p.isDefault) || panels[0];
      if (defaultPanel) {
        setForm(f => ({
          ...f,
          viewsPanel: defaultPanel._id,
          likesPanel: defaultPanel._id,
          commentsPanel: defaultPanel._id,
          sharesPanel: defaultPanel._id
        }));
        loadServicesForPanel(defaultPanel._id, 'views');
        loadServicesForPanel(defaultPanel._id, 'likes');
        loadServicesForPanel(defaultPanel._id, 'comments');
        loadServicesForPanel(defaultPanel._id, 'shares');
      }
    }
  }, [template, panels]);

  // Form submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Template Name is required');
    if (!form.viewsServiceId) return toast.error('Views Service ID is required');

    setLoading(true);
    try {
      if (template) {
        await updateTemplate(template._id, form);
        toast.success('Organic Presets Updated!');
      } else {
        await createTemplate(form);
        toast.success('New Organic Template Created!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save template manager settings');
    } finally {
      setLoading(false);
    }
  }

  const activeCategoryDetail = CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720, height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <span className="modal-title" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
              {template ? 'Edit Organic Template' : 'New Organic Growth Template'}
            </span>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Build scalable engagement presets with customized views, likes, comments, and shares distribution.
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* Section Navigation Tabs */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255,255,255,0.02)', 
            borderBottom: '1px solid var(--border)', 
            overflowX: 'auto', 
            whiteSpace: 'nowrap',
            flexShrink: 0
          }} className="custom-scroll">
            {[
              { id: 'basic', label: '1. Basic Info' },
              { id: 'panels', label: '2. Panel Setup' },
              { id: 'views', label: '3. Views' },
              { id: 'likes', label: '4. Likes' },
              { id: 'feedback', label: '5. Comments/Shares' },
              { id: 'timings', label: '6. Timings' },
            ].map(tab => (
              <button 
                key={tab.id}
                type="button" 
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  padding: '12px 18px', 
                  fontSize: 12, 
                  fontWeight: 600,
                  outline: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--cyan)' : '2px solid transparent',
                  background: 'none',
                  color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scroll">
            
            {/* TAB: Basic Info */}
            {activeTab === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <Layers size={16} /> <span style={{ fontWeight: 700, fontSize: 14 }}>Basic Information Configuration</span>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Template Name *</label>
                    <input className="form-input" required value={form.name} onChange={set('name')} placeholder="e.g. Starter Booster Pack, Viral Wave" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Category Profile</label>
                    <select className="form-select" value={form.category} onChange={handleCategoryChange}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label} ({c.range})</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Growth Acceleration Type</label>
                    <select className="form-select" value={form.growthType} onChange={set('growthType')}>
                      {GROWTH_TYPES.map(gt => <option key={gt} value={gt}>{gt}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total views Limit (Stops Campaign)</label>
                    <input className="form-input" type="number" min="100" value={form.maxViewsTotal} onChange={setNum('maxViewsTotal')} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Campaign Objective</label>
                  <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Write details about organic presets..." rows={2} />
                </div>
              </div>
            )}

            {/* TAB: Panels Setup (Sections 2 & 3) */}
            {activeTab === 'panels' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <Server size={16} /> <span style={{ fontWeight: 700, fontSize: 14 }}>Dynamic Panel & Service Mapping</span>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
                  Assign different SMM API providers for Views, Likes, Comments, and Shares, and search service list IDs.
                </p>

                {/* Engagement Setup Matrices */}
                {[
                  { id: 'views', title: 'VIEWS SERVICE SETUP', icon: Eye, stroke: 'var(--purple)' },
                  { id: 'likes', title: 'LIKES SERVICE SETUP', icon: ThumbsUp, stroke: 'var(--green)' },
                  { id: 'comments', title: 'COMMENTS SERVICE SETUP', icon: MessageSquare, stroke: 'var(--cyan)' },
                  { id: 'shares', title: 'SHARES SERVICE SETUP', icon: Share2, stroke: 'var(--yellow)' },
                ].map(item => {
                  const serviceVal = form[`${item.id}ServiceId`];
                  const panelVal = form[`${item.id}Panel`];
                  const serviceList = item.id === 'views' ? viewsServices 
                                    : item.id === 'likes' ? likesServices 
                                    : item.id === 'comments' ? commentsServices 
                                    : sharesServices;
                  const isLoading = loadingServices[item.id];

                  return (
                    <div 
                      key={item.id} 
                      style={{ 
                        padding: 14, 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 12, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 12 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 11, color: item.stroke }}>
                        <item.icon size={13} /> {item.title}
                      </div>

                      <div className="form-row" style={{ gap: 14 }}>
                        <div className="form-group">
                          <label className="form-label">Provider Panel</label>
                          <select 
                            className="form-select" 
                            value={panelVal} 
                            onChange={(e) => {
                              const pid = e.target.value;
                              setForm(f => ({ ...f, [`${item.id}Panel`]: pid, [`${item.id}ServiceId`]: '' }));
                              loadServicesForPanel(pid, item.id);
                            }}
                          >
                            <option value="">— Select Panel —</option>
                            {panels.map(p => <option key={p._id} value={p._id}>{p.name} {p.isDefault ? '(Default)' : ''}</option>)}
                          </select>
                        </div>

                        <div className="form-group" style={{ minWidth: 200, flex: 2 }}>
                          <label className="form-label">Target Service Package ID</label>
                          <input 
                            type="text" 
                            className="form-input"
                            placeholder="Enter Service ID (e.g. 11271)"
                            value={serviceVal}
                            disabled={!panelVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm(f => ({ ...f, [`${item.id}ServiceId`]: val }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB: Views Config */}
            {activeTab === 'views' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <Eye size={16} /> <span style={{ fontWeight: 700, fontSize: 14 }}>Views Delivery Configuration</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Views per Cycle</label>
                    <input className="form-input" type="number" min="100" value={form.minViewsPerCycle} onChange={setNum('minViewsPerCycle')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Views per Cycle</label>
                    <input className="form-input" type="number" min="100" value={form.maxViewsPerCycle} onChange={setNum('maxViewsPerCycle')} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Likes Config */}
            {activeTab === 'likes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <ThumbsUp size={16} /> <span style={{ fontWeight: 700, fontSize: 14 }}>Likes Delivery Settings</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Start Likes at Cycle Tick #</label>
                  <input className="form-input" type="number" min="1" value={form.likesStartTick} onChange={setNum('likesStartTick')} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Likes per Hit</label>
                    <input className="form-input" type="number" min="0" value={form.minLikesPerCycle} onChange={setNum('minLikesPerCycle')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Likes per Hit</label>
                    <input className="form-input" type="number" min="0" value={form.maxLikesPerCycle} onChange={setNum('maxLikesPerCycle')} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Likes Target Hits (Cycles count distribution)
                  </label>
                  <input className="form-input" type="number" min="0" value={form.likesTotalHits} onChange={setNum('likesTotalHits')} placeholder="e.g. 10 (0 means full random hits)" />
                  <span className="form-hint" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    * Distribute likes on exactly <b>{form.likesTotalHits || 'N'}</b> random ticks during scheduling (leaves remaining ticks with 0 likes for organic variance).
                  </span>
                </div>
              </div>
            )}

            {/* TAB: Comments/Shares Feedback Config */}
            {activeTab === 'feedback' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Comments Section */}
                <div style={{ 
                  border: '1px solid var(--border)', 
                  borderRadius: 12, 
                  padding: 14, 
                  background: form.enableComments ? 'transparent' : 'rgba(255,255,255,0.01)',
                  opacity: form.enableComments ? 1 : 0.7 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', fontWeight: 700, fontSize: 14 }}>
                      <MessageSquare size={16} /> Comments Rules Engine
                    </div>
                    <div className="flex gap-2" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" id="enableComments" checked={form.enableComments} onChange={set('enableComments')} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                      <label htmlFor="enableComments" style={{ fontSize: 11, color: 'var(--cyan)', cursor: 'pointer', fontWeight: 650 }}>ENABLE COMMENTS</label>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Min Comments/Hit</label>
                      <input className="form-input" type="number" min="0" disabled={!form.enableComments} value={form.minCommentsPerCycle} onChange={setNum('minCommentsPerCycle')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Comments/Hit</label>
                      <input className="form-input" type="number" min="0" disabled={!form.enableComments} value={form.maxCommentsPerCycle} onChange={setNum('maxCommentsPerCycle')} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Comments at Cycle Tick #</label>
                    <input className="form-input" type="number" min="1" disabled={!form.enableComments} value={form.commentsStartTick} onChange={setNum('commentsStartTick')} />
                  </div>
                </div>

                {/* Shares Section */}
                <div style={{ 
                  border: '1px solid var(--border)', 
                  borderRadius: 12, 
                  padding: 14, 
                  background: form.enableShares ? 'transparent' : 'rgba(255,255,255,0.01)',
                  opacity: form.enableShares ? 1 : 0.7 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', fontWeight: 700, fontSize: 14 }}>
                      <Share2 size={16} /> Shares Distribution Engine
                    </div>
                    <div className="flex gap-2" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" id="enableShares" checked={form.enableShares} onChange={set('enableShares')} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                      <label htmlFor="enableShares" style={{ fontSize: 11, color: 'var(--cyan)', cursor: 'pointer', fontWeight: 650 }}>ENABLE SHARES</label>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Min Shares/Hit</label>
                      <input className="form-input" type="number" min="0" disabled={!form.enableShares} value={form.minSharesPerCycle} onChange={setNum('minSharesPerCycle')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Shares/Hit</label>
                      <input className="form-input" type="number" min="0" disabled={!form.enableShares} value={form.maxSharesPerCycle} onChange={setNum('maxSharesPerCycle')} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Shares at Cycle Tick #</label>
                    <input className="form-input" type="number" min="1" disabled={!form.enableShares} value={form.sharesStartTick} onChange={setNum('sharesStartTick')} />
                  </div>
                </div>

              </div>
            )}

            {/* TAB: Timing/Gap Config */}
            {activeTab === 'timings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <Clock size={16} /> <span style={{ fontWeight: 700, fontSize: 14 }}>Timing Configuration</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Minimum Gap between Cycles (Minutes)</label>
                    <input className="form-input" type="number" min="1" value={form.minGapMins} onChange={setNum('minGapMins')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maximum Gap between Cycles (Minutes)</label>
                    <input className="form-input" type="number" min="1" value={form.maxGapMins} onChange={setNum('maxGapMins')} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid var(--border)', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12,
            background: 'var(--bg-secondary)',
            flexShrink: 0
          }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {template ? 'Save Preset Template' : 'Create Preset Template'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // Filtering states
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter templates list
  const filteredTemplates = templates.filter(t => {
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Organic Growth Templates</h1>
            <p className="page-subtitle">Configure, test, and categorise drip-feed growth profiles for campaigns</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={14} /> New Preset Template
          </button>
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
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${categoryFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setCategoryFilter('All')}
          >
            All Presets ({templates.length})
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
                  color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.color, marginRight: 6 }} />
                {c.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', minWidth: 260 }}>
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

      {/* Grid Display */}
      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : filteredTemplates.length === 0 ? (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No matching templates found</div>
            <div className="empty-state-desc">
              {searchQuery || categoryFilter !== 'All' 
                ? 'Try resetting the filters or search query to find your presets.' 
                : 'Create your first organic growth strategy to define campaign metrics.'}
            </div>
          </div>
        </div></div>
      ) : (
        <div className="grid grid-3">
          {filteredTemplates.map(t => {
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
                      background: catDetails.colorDim, 
                      color: catDetails.color,
                      textTransform: 'uppercase'
                    }}>
                      {t.category}
                    </span>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 600, 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      background: 'rgba(255,255,255,0.04)', 
                      color: 'var(--text-secondary)'
                    }}>
                      {t.growthType || 'Balanced'}
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
                      <span style={{ fontWeight: 700, color: 'var(--purple)', fontSize: 13 }}>{t.maxViewsTotal?.toLocaleString()} views</span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>VIEWS / TRIGGER CYCLE</span>
                      <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{t.minViewsPerCycle?.toLocaleString()}–{t.maxViewsPerCycle?.toLocaleString()}</span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                      <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>SCHEDULING GAP INTERVALS</span>
                      <div style={{ fontWeight: 700, color: 'var(--yellow)' }}>
                        {t.minGapMins}–{t.maxGapMins} <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8 }}>minutes between drips</span>
                      </div>
                    </div>
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

      {/* Model Overlay for CRUD template elements */}
      {showModal && (
        <TemplateModal
          template={editing}
          panels={panels}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
