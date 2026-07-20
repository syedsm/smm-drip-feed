import { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, Layers, Server, Clock, Settings2, 
  Eye, ThumbsUp, MessageSquare, Share2, HelpCircle, 
  ChevronDown, ChevronUp, Search, Info, Check, ShieldAlert, ArrowRight, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createTemplate, updateTemplate } from '../services/api';

const DEFAULT_FORM = {
  name: '', description: '', type: 'single', platform: 'Instagram', category: 'Starter', growthType: 'Balanced', engagementMode: 'fixed',
  viewsPanel: '', likesPanel: '', commentsPanel: '', sharesPanel: '',
  viewsServiceId: '', likesServiceId: '', commentsServiceId: '', sharesServiceId: '',
  enableComments: false, enableShares: false,
  minViewsPerCycle: 100, maxViewsPerCycle: 100, maxViewsTotal: 5000,
  minLikesPerCycle: 5, maxLikesPerCycle: 5, totalLikes: 200,
  minCommentsPerCycle: 2, maxCommentsPerCycle: 2, maxCommentsTotal: 30,
  minSharesPerCycle: 2, maxSharesPerCycle: 2, maxSharesTotal: 20,
  minViewsTotal: 3000, minLikesTotal: 0, maxLikesTotal: 0, minCommentsTotal: 0, maxCommentsTotal: 0, minSharesTotal: 0, maxSharesTotal: 0,
  likesRatioMin: 3.0, likesRatioMax: 5.0, commentsRatioMin: 0.3, commentsRatioMax: 0.8, sharesRatioMin: 0.2, sharesRatioMax: 0.6,
  maxLikeRatioPct: 10.0, maxCommentRatioPct: 3.0, maxShareRatioPct: 2.0, engagementVariancePct: 10.0,
  likesStartTick: 3, commentsStartTick: 3, sharesStartTick: 2,
  minGapMins: 60, maxGapMins: 90, workingHoursEnabled: false, workingHoursStart: '09:00', workingHoursEnd: '17:00', pauseBetweenCycles: false,
  viewsRandomizationPct: 10, viewsPauseLogic: false, accelerationCurve: 'Balanced',
  retryFailedOrders: true, autoStop: false, smartDistribution: true, notes: ''
};

function CleanNumberInput({ value, onChange, disabled, step = "1", placeholder = "", className = "form-input form-input-sm" }) {
  const displayVal = value === 0 ? '0' : String(value);

  const handleChange = (e) => {
    let valStr = e.target.value.replace(/^0+(?=\d)/, ''); // Remove leading zeros
    if (valStr === '') {
      onChange(0);
    } else {
      const parsed = parseFloat(valStr);
      onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  const handleFocus = (e) => {
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  return (
    <input 
      type="number" 
      step={step}
      className={className} 
      disabled={disabled}
      placeholder={placeholder}
      value={displayVal}
      onChange={handleChange}
      onFocus={handleFocus}
    />
  );
}

export default function TemplateModal({ template, templates = [], panels, CATEGORIES, onClose, onSaved }) {
  const [form, setForm] = useState(template ? { ...DEFAULT_FORM, ...template } : DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleCategoryChange = (val) => {
    setForm(f => {
      let updated = { ...f, category: val };
      if (f.type === 'bulk') {
        if (val === 'Starter') { updated.minViewsTotal = 3000; updated.maxViewsTotal = 5000; }
        else if (val === 'Growth') { updated.minViewsTotal = 10000; updated.maxViewsTotal = 25000; }
        else if (val === 'Momentum') { updated.minViewsTotal = 25000; updated.maxViewsTotal = 100000; }
        else if (val === 'Viral') { updated.minViewsTotal = 100000; updated.maxViewsTotal = 500000; }
        else if (val === 'Elite') { updated.minViewsTotal = 500000; updated.maxViewsTotal = 1000000; }
      } else {
        if (val === 'Starter') { updated.minViewsTotal = 3000; updated.maxViewsTotal = 3000; }
        else if (val === 'Growth') { updated.minViewsTotal = 10000; updated.maxViewsTotal = 10000; }
        else if (val === 'Momentum') { updated.minViewsTotal = 25000; updated.maxViewsTotal = 25000; }
        else if (val === 'Viral') { updated.minViewsTotal = 100000; updated.maxViewsTotal = 100000; }
        else if (val === 'Elite') { updated.minViewsTotal = 500000; updated.maxViewsTotal = 500000; }
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!template) {
      const defaultPanel = panels.find(p => p.isDefault) || panels[0];
      if (defaultPanel) {
        setForm(f => ({ ...f, viewsPanel: defaultPanel._id, likesPanel: defaultPanel._id, commentsPanel: defaultPanel._id, sharesPanel: defaultPanel._id }));
      }
      handleCategoryChange(form.category);
    }
  }, [template, panels]);

  const onCategorySelect = (e) => {
    handleCategoryChange(e.target.value);
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!form.name.trim()) { toast.error("Template name is required."); return false; }
    } else if (step === 2) {
      if (!form.viewsServiceId.trim()) { toast.error("Views Service ID is required."); return false; }
      if (!form.likesServiceId.trim()) { toast.error("Likes Service ID is required."); return false; }
      if (form.enableComments && !form.commentsServiceId.trim()) { toast.error("Comments Service ID is required."); return false; }
      if (form.enableShares && !form.sharesServiceId.trim()) { toast.error("Shares Service ID is required."); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      const submitPayload = { ...form, retryFailedOrders: true, engagementMode: 'fixed' };
      if (template && template._id) await updateTemplate(template._id, submitPayload);
      else await createTemplate(submitPayload);
      toast.success(template && template._id ? 'Preset Updated!' : 'Preset Created!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  const renderStepContent = () => {
    const isBulk = form.type === 'bulk';

    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Step 1: Core Parameters</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Configure name, targeted platform, and category settings ({isBulk ? 'Bulk Mode' : 'Single Mode'}).</p>
            </div>
            
            <div className="grid grid-2" style={{ gap: 16 }}>
              <div>
                <label className="form-label">Template Name</label>
                <input className="form-input" required value={form.name} onChange={setF('name')} placeholder="e.g. Instagram Balanced Preset" />
              </div>
              <div>
                <label className="form-label">Platform</label>
                <select className="form-select" value={form.platform} onChange={setF('platform')}>
                  {['Instagram', 'TikTok', 'YouTube', 'Facebook'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={onCategorySelect}>
                  {(CATEGORIES || []).map(c => <option key={c.value} value={c.value}>{c.label} ({c.range})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Description (Optional)</label>
                <input className="form-input" value={form.description} onChange={setF('description')} placeholder="Objective notes or comments..." />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="wizard-step" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Step 2: Growth Engine Targets & Panel Mappings</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Configure total metrics range parameters and select provider SMM service panels.</p>
            </div>

            {/* Views Setup Box */}
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={16} /> Views Total Setup</div>
              
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 10 }}>{isBulk ? 'Target Views Range' : 'Target Views'}</label>
                  {isBulk ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <CleanNumberInput value={form.minViewsTotal} onChange={(val) => setForm(f => ({ ...f, minViewsTotal: val }))} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                      <CleanNumberInput value={form.maxViewsTotal} onChange={(val) => setForm(f => ({ ...f, maxViewsTotal: val }))} />
                    </div>
                  ) : (
                    <CleanNumberInput value={form.maxViewsTotal} onChange={(val) => setForm(f => ({ ...f, minViewsTotal: val, maxViewsTotal: val }))} />
                  )}
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 10 }}>Provider Panel</label>
                  <select className="form-select form-input-sm" style={{ padding: '6px 12px' }} value={form.viewsPanel} onChange={setF('viewsPanel')}>
                    {panels.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Views Service ID</label>
                  <input 
                    type="text" 
                    className="form-input form-input-sm" 
                    value={form.viewsServiceId} 
                    onChange={(e) => setForm(f => ({ ...f, viewsServiceId: e.target.value.replace(/\D/g, '') }))} 
                    placeholder="Enter Views Service ID (e.g. 1001)" 
                  />
                </div>
              </div>
            </div>

            {/* Likes Setup Box */}
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}><ThumbsUp size={16} /> Likes Total Setup</div>
              
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 10 }}>{isBulk ? 'Target Likes Range' : 'Target Likes'}</label>
                  {isBulk ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <CleanNumberInput value={form.minLikesTotal} onChange={(val) => setForm(f => ({ ...f, minLikesTotal: val }))} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                      <CleanNumberInput value={form.maxLikesTotal} onChange={(val) => setForm(f => ({ ...f, maxLikesTotal: val }))} />
                    </div>
                  ) : (
                    <CleanNumberInput value={form.maxLikesTotal} onChange={(val) => setForm(f => ({ ...f, minLikesTotal: val, maxLikesTotal: val }))} />
                  )}
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 10 }}>Provider Panel</label>
                  <select className="form-select form-input-sm" style={{ padding: '6px 12px' }} value={form.likesPanel} onChange={setF('likesPanel')}>
                    {panels.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Likes Service ID</label>
                  <input 
                    type="text" 
                    className="form-input form-input-sm" 
                    value={form.likesServiceId} 
                    onChange={(e) => setForm(f => ({ ...f, likesServiceId: e.target.value.replace(/\D/g, '') }))} 
                    placeholder="Enter Likes Service ID (e.g. 1002)" 
                  />
                </div>
              </div>
            </div>

            {/* Comments Setup Box */}
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={16} /> Comments Total Setup</div>
                <input type="checkbox" checked={form.enableComments} onChange={setF('enableComments')} style={{ margin: 0, width: 14, height: 14 }} />
              </div>
              
              {form.enableComments && (
                <div className="grid grid-2" style={{ gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>{isBulk ? 'Target Comments Range' : 'Target Comments'}</label>
                    {isBulk ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <CleanNumberInput value={form.minCommentsTotal} onChange={(val) => setForm(f => ({ ...f, minCommentsTotal: val }))} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                        <CleanNumberInput value={form.maxCommentsTotal} onChange={(val) => setForm(f => ({ ...f, maxCommentsTotal: val }))} />
                      </div>
                    ) : (
                      <CleanNumberInput value={form.maxCommentsTotal} onChange={(val) => setForm(f => ({ ...f, minCommentsTotal: val, maxCommentsTotal: val }))} />
                    )}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>Provider Panel</label>
                    <select className="form-select form-input-sm" style={{ padding: '6px 12px' }} value={form.commentsPanel} onChange={setF('commentsPanel')}>
                      {panels.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Comments Service ID</label>
                    <input 
                      type="text" 
                      className="form-input form-input-sm" 
                      value={form.commentsServiceId} 
                      onChange={(e) => setForm(f => ({ ...f, commentsServiceId: e.target.value.replace(/\D/g, '') }))} 
                      placeholder="Enter Comments Service ID (e.g. 772)" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Shares Setup Box */}
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 6 }}><Share2 size={16} /> Shares Total Setup</div>
                <input type="checkbox" checked={form.enableShares} onChange={setF('enableShares')} style={{ margin: 0, width: 14, height: 14 }} />
              </div>
              
              {form.enableShares && (
                <div className="grid grid-2" style={{ gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>{isBulk ? 'Target Shares Range' : 'Target Shares'}</label>
                    {isBulk ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <CleanNumberInput value={form.minSharesTotal} onChange={(val) => setForm(f => ({ ...f, minSharesTotal: val }))} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                        <CleanNumberInput value={form.maxSharesTotal} onChange={(val) => setForm(f => ({ ...f, maxSharesTotal: val }))} />
                      </div>
                    ) : (
                      <CleanNumberInput value={form.maxSharesTotal} onChange={(val) => setForm(f => ({ ...f, minSharesTotal: val, maxSharesTotal: val }))} />
                    )}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>Provider Panel</label>
                    <select className="form-select form-input-sm" style={{ padding: '6px 12px' }} value={form.sharesPanel} onChange={setF('sharesPanel')}>
                      {panels.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Shares Service ID</label>
                    <input 
                      type="text" 
                      className="form-input form-input-sm" 
                      value={form.sharesServiceId} 
                      onChange={(e) => setForm(f => ({ ...f, sharesServiceId: e.target.value.replace(/\D/g, '') }))} 
                      placeholder="Enter Shares Service ID (e.g. 912)" 
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        );
      case 3:
        return (
          <div className="wizard-step" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Step 3: Pacing & Per-Hit Range Selection</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Configure the precise quantity parameter boundaries and start trigger cycles.</p>
            </div>
            
            <div className="grid grid-2" style={{ gap: 16 }}>
              {/* Views Per-Hit Target Bounds */}
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--purple)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={14} /> Views Per-Hit Target</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <CleanNumberInput value={form.minViewsPerCycle} onChange={(val) => setForm(f => ({ ...f, minViewsPerCycle: val }))} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                  <CleanNumberInput value={form.maxViewsPerCycle} onChange={(val) => setForm(f => ({ ...f, maxViewsPerCycle: val }))} />
                </div>
              </div>

              {/* Likes Per-Hit Target Bounds & Start Tick */}
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}><ThumbsUp size={14} /> Likes Drip Settings</div>
                <div>
                  <label className="form-label" style={{ fontSize: 10 }}>Per-Hit Quantity Range</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CleanNumberInput value={form.minLikesPerCycle} onChange={(val) => setForm(f => ({ ...f, minLikesPerCycle: val }))} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                    <CleanNumberInput value={form.maxLikesPerCycle} onChange={(val) => setForm(f => ({ ...f, maxLikesPerCycle: val }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 10 }}>First Trigger Tick (Start Cycle)</label>
                  <CleanNumberInput value={form.likesStartTick} onChange={(val) => setForm(f => ({ ...f, likesStartTick: val }))} />
                </div>
              </div>

              {/* Comments Per-Hit Bounds & Start Tick (Conditional) */}
              {form.enableComments && (
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={14} /> Comments Drip Settings</div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>Per-Hit Quantity Range</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <CleanNumberInput value={form.minCommentsPerCycle} onChange={(val) => setForm(f => ({ ...f, minCommentsPerCycle: val }))} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                      <CleanNumberInput value={form.maxCommentsPerCycle} onChange={(val) => setForm(f => ({ ...f, maxCommentsPerCycle: val }))} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>First Trigger Tick (Start Cycle)</label>
                    <CleanNumberInput value={form.commentsStartTick} onChange={(val) => setForm(f => ({ ...f, commentsStartTick: val }))} />
                  </div>
                </div>
              )}

              {/* Shares Per-Hit Bounds & Start Tick (Conditional) */}
              {form.enableShares && (
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 6 }}><Share2 size={14} /> Shares Drip Settings</div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>Per-Hit Quantity Range</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <CleanNumberInput value={form.minSharesPerCycle} onChange={(val) => setForm(f => ({ ...f, minSharesPerCycle: val }))} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>to</span>
                      <CleanNumberInput value={form.maxSharesPerCycle} onChange={(val) => setForm(f => ({ ...f, maxSharesPerCycle: val }))} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10 }}>First Trigger Tick (Start Cycle)</label>
                    <CleanNumberInput value={form.sharesStartTick} onChange={(val) => setForm(f => ({ ...f, sharesStartTick: val }))} />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="wizard-step" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Step 4: Timing & Flow Settings</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Configure timing delay patterns and boundaries for hits delivery.</p>
            </div>
            
            <div className="grid grid-2" style={{ gap: 16 }}>
              {/* Gap between hits (Minutes range) */}
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.01)', gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, display: 'block' }}>Gap Between Hits (Minutes)</label>
                <div style={{ display: 'flex', gap: 12, width: '100%', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>MIN TIMING MINUTES</label>
                    <CleanNumberInput className="form-input form-input-sm" value={form.minGapMins} onChange={(val) => setForm(f => ({ ...f, minGapMins: val }))} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>to</span>
                  <div style={{ flex: 1 }}>
                    <label className="form-label font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>MAX TIMING MINUTES</label>
                    <CleanNumberInput className="form-input form-input-sm" value={form.maxGapMins} onChange={(val) => setForm(f => ({ ...f, maxGapMins: val }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const stepsLabels = ['Basic Setup', 'Growth Engine', 'Pacing Limits', 'Delivery Config'];

  // Panel details lookups for summary display
  const viewsPanelObj = panels.find(p => p._id === form.viewsPanel);
  const likesPanelObj = panels.find(p => p._id === form.likesPanel);
  const commentsPanelObj = panels.find(p => p._id === form.commentsPanel);
  const sharesPanelObj = panels.find(p => p._id === form.sharesPanel);

  const isBulk = form.type === 'bulk';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal" style={{ maxWidth: 1150, width: '95%', height: '85vh', maxHeight: 850, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden' }}>
        
        {/* Header Ribbon */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              {template && template._id ? `Modify Profile Preset: ${template.name}` : 'Rapid Growth Preset Wizard'}
              {form.category && <span className="badge" style={{ fontSize: 9, background: 'var(--blue-dim)', color: 'var(--cyan)', padding: '2px 6px', borderRadius: 4 }}>{form.category}</span>}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} style={{ fontSize: 18, color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {/* 2-Column Split Content Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* LEFT COLUMN: Main Wizard Controls */}
          <div style={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            
            {/* Native Progress Stepper Area */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {stepsLabels.map((lbl, i) => {
                const stepNum = i + 1;
                const active = currentStep === stepNum;
                const past = currentStep > stepNum;
                return (
                  <div key={i} onClick={() => { if (past) setCurrentStep(stepNum); }} style={{ 
                    flex: 1, 
                    padding: '12px 10px',
                    textAlign: 'center',
                    borderBottom: `3px solid ${active ? 'var(--cyan)' : past ? 'var(--green)' : 'transparent'}`, 
                    color: active ? 'var(--cyan)' : (past ? 'var(--green)' : 'var(--text-muted)'), 
                    fontSize: 11, 
                    fontWeight: 700,
                    cursor: past ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    background: active ? 'rgba(0, 212, 255, 0.03)' : 'transparent'
                  }}>
                    {lbl.toUpperCase()}
                  </div>
                )
              })}
            </div>
            
            {/* Render Context (Inject Form) */}
            <div className="custom-scroll" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
              {renderStepContent()}
            </div>

            {/* Navigation Footer */}
            <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {currentStep > 1 ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={prevStep} style={{ width: 100 }}>
                  <ArrowLeft size={14} style={{ marginRight: 6 }}/> Back
                </button>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} style={{ width: 100 }}>Discard</button>
              )}

              {currentStep < totalSteps ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={nextStep} style={{ width: 120 }}>
                  Next Step <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading} style={{ width: 160, background: 'var(--cyan)', color: 'var(--bg-primary)' }}>
                  {loading ? <div className="spinner" /> : <><Check size={14} /> Save Template</>}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Static Template Summary Cards */}
          <div className="custom-scroll" style={{ flex: '0 0 35%', padding: '24px 20px', background: 'var(--bg-secondary)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 14, fontWeight: 700 }}>
                 <Settings2 size={16} color="var(--cyan)" /> Configuration Summary
               </h3>
               <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Read-only parameter settings defined for this organic growth template profile.</p>
            </div>

            {/* Step 1 Identity block */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>1. Target Identity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <div><span className="text-muted">Template Name: </span><span style={{ fontWeight: 600 }}>{form.name || 'Not set'}</span></div>
                <div><span className="text-muted">Platform: </span><span style={{ fontWeight: 600 }}>{form.platform}</span></div>
                <div><span className="text-muted">Type: </span><span style={{ fontWeight: 600, color: 'var(--cyan)' }}>{isBulk ? 'Bulk Preset' : 'Single Target Preset'}</span></div>
              </div>
            </div>

            {/* Step 2 Strategy block */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>2. Growth Behavior & Targets</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <div>
                  <span className="text-muted">Views Target: </span>
                  <span style={{ fontWeight: 700, color: 'var(--purple)' }}>
                    {isBulk ? `${form.minViewsTotal?.toLocaleString()} - ${form.maxViewsTotal?.toLocaleString()}` : form.maxViewsTotal?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Likes Target: </span>
                  <span style={{ fontWeight: 700, color: 'var(--green)' }}>
                    {isBulk ? `${form.minLikesTotal?.toLocaleString()} - ${form.maxLikesTotal?.toLocaleString()}` : form.maxLikesTotal?.toLocaleString()}
                  </span>
                </div>
                {form.enableComments && (
                  <div>
                    <span className="text-muted">Comments Target: </span>
                    <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>
                      {isBulk ? `${form.minCommentsTotal?.toLocaleString()} - ${form.maxCommentsTotal?.toLocaleString()}` : form.maxCommentsTotal?.toLocaleString()}
                    </span>
                  </div>
                )}
                {form.enableShares && (
                  <div>
                    <span className="text-muted">Shares Target: </span>
                    <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>
                      {isBulk ? `${form.minSharesTotal?.toLocaleString()} - ${form.maxSharesTotal?.toLocaleString()}` : form.maxSharesTotal?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3 Provider Service block */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>3. Network Providers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                <div>
                  <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>VIEWS SERVICE ({viewsPanelObj?.name || 'Default'})</span>
                  <span className="font-mono text-secondary">{form.viewsServiceId ? `Service ID: ${form.viewsServiceId}` : 'Not mapped'}</span>
                  <span className="text-muted" style={{ fontSize: 10, display: 'block' }}>Per-hit views: {`${form.minViewsPerCycle} - ${form.maxViewsPerCycle}`}</span>
                </div>
                <div>
                  <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>LIKES SERVICE ({likesPanelObj?.name || 'Default'})</span>
                  <span className="font-mono text-secondary">{form.likesServiceId ? `Service ID: ${form.likesServiceId}` : 'Not mapped'}</span>
                  <span className="text-muted" style={{ fontSize: 10, display: 'block' }}>Per-hit likes: {`${form.minLikesPerCycle} - ${form.maxLikesPerCycle}`} (Starts @ Tick {form.likesStartTick})</span>
                </div>
                {form.enableComments && (
                  <div>
                    <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>COMMENTS SERVICE ({commentsPanelObj?.name || 'Default'})</span>
                    <span className="font-mono text-secondary">{form.commentsServiceId ? `Service ID: ${form.commentsServiceId}` : 'Not mapped'}</span>
                    <span className="text-muted" style={{ fontSize: 10, display: 'block' }}>Per-hit comments: {`${form.minCommentsPerCycle} - ${form.maxCommentsPerCycle}`} (Starts @ Tick {form.commentsStartTick})</span>
                  </div>
                )}
                {form.enableShares && (
                  <div>
                    <span className="text-muted" style={{ display: 'block', fontSize: 9 }}>SHARES SERVICE ({sharesPanelObj?.name || 'Default'})</span>
                    <span className="font-mono text-secondary">{form.sharesServiceId ? `Service ID: ${form.sharesServiceId}` : 'Not mapped'}</span>
                    <span className="text-muted" style={{ fontSize: 10, display: 'block' }}>Per-hit shares: {`${form.minSharesPerCycle} - ${form.maxSharesPerCycle}`} (Starts @ Tick {form.sharesStartTick})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4 Delivery controls block */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>4. Timing & Drip Scheduling</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <div><span className="text-muted">Gap Bounds: </span><span style={{ fontWeight: 600 }}>{`${form.minGapMins} to ${form.maxGapMins} mins`}</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
