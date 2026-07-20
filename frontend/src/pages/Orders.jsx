// src/pages/Orders.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, ArrowRight, Trash2, Pause, Play, Settings2, FileText, Server, Clock, ShoppingBag, Eye, ThumbsUp, Layers, Link as LinkIcon, MessageSquare, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrders, createOrder, deleteOrder, updateOrderStatus, getTemplates, getPanels } from '../services/api';
import PlatformIcon from '../components/PlatformIcon';

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
    <span style={{ fontSize: 12, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
      <Clock size={12} /> {timeLeft}
    </span>
  );
}

function CreateOrderModal({ onClose, onCreated, initialLink = '', initialTemplateId = '' }) {
  const [templates, setTemplates] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetMode, setTargetMode] = useState('single'); // 'single' or 'batch'
  const [bulkItems, setBulkItems] = useState([]);
  const [distributionMode, setDistributionMode] = useState('random'); // 'random', 'even', 'weighted', 'manual'

  const [form, setForm] = useState({
    linksText: '',
    singleLink: initialLink,
    platform: 'instagram',
    panelId: '',
    templateId: '',
    notes: '',
    startDelay: 10, // Default 10 mins delay
  });

  useEffect(() => {
    Promise.all([getTemplates(), getPanels()]).then(([t, p]) => {
      setTemplates(t.data);
      const activePanels = p.data.filter(x => x.isActive);
      setPanels(activePanels);
      
      const defaultPanel = activePanels.find(x => x.isDefault) || activePanels[0];
      setForm(f => ({ 
        ...f, 
        panelId: f.panelId || (defaultPanel ? defaultPanel._id : ''),
        templateId: f.templateId || initialTemplateId
      }));
    }).catch(() => toast.error('Failed to load form data'));
  }, [initialTemplateId]);

  useEffect(() => {
    if (initialLink || initialTemplateId) {
      setForm(f => ({
        ...f,
        singleLink: initialLink || f.singleLink,
        templateId: initialTemplateId || f.templateId
      }));
    }
  }, [initialLink, initialTemplateId]);

  // Reset template selected when targetMode changes
  useEffect(() => {
    setForm(f => ({ ...f, templateId: '' }));
  }, [targetMode]);

  function applyDistribution(modeName, itemsList, template) {
    if (!template || !itemsList.length) return itemsList;
    const len = itemsList.length;
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const isRatio = template.engagementMode === 'percentage';

    return itemsList.map((item, idx) => {
      let views = item.totalViews;
      let likes = item.totalLikes;
      let comments = item.totalComments;
      let shares = item.totalShares;

      if (modeName === 'random') {
        views = randInt(template.minViewsTotal || 0, template.maxViewsTotal || 0);
      } else if (modeName === 'even') {
        views = Math.floor(((template.minViewsTotal || 0) + (template.maxViewsTotal || 0)) / 2);
      } else if (modeName === 'weighted') {
        if (len <= 1) {
          views = template.maxViewsTotal || 0;
        } else {
          const ratio = (len - 1 - idx) / (len - 1);
          views = Math.floor((template.minViewsTotal || 0) + ratio * ((template.maxViewsTotal || 0) - (template.minViewsTotal || 0)));
        }
      }

      if (isRatio) {
        const randFloat = (min, max) => Math.random() * (max - min) + min;
        const variance = (template.engagementVariancePct || 0) / 100;
        const applyVarAndSafe = (val, maxSafePct) => {
           const varMult = randFloat(1 - variance, 1 + variance);
           let finalVal = Math.floor(val * varMult);
           const safeLimit = Math.floor(views * (maxSafePct / 100));
           return Math.min(finalVal, safeLimit);
        };
        
        if (template.likesServiceId) {
          const baseLikes = views * (randFloat(template.likesRatioMin, template.likesRatioMax) / 100);
          likes = applyVarAndSafe(baseLikes, template.maxLikeRatioPct || 10);
        }
        if (template.enableComments && template.commentsServiceId) {
          const baseComments = views * (randFloat(template.commentsRatioMin, template.commentsRatioMax) / 100);
          comments = applyVarAndSafe(baseComments, template.maxCommentRatioPct || 3);
        }
        if (template.enableShares && template.sharesServiceId) {
          const baseShares = views * (randFloat(template.sharesRatioMin, template.sharesRatioMax) / 100);
          shares = applyVarAndSafe(baseShares, template.maxShareRatioPct || 2);
        }
      } else {
        if (modeName === 'random') {
          likes = template.likesServiceId ? randInt(template.minLikesTotal || 0, template.maxLikesTotal || 0) : 0;
          comments = template.enableComments ? randInt(template.minCommentsTotal || 0, template.maxCommentsTotal || 0) : 0;
          shares = template.enableShares ? randInt(template.minSharesTotal || 0, template.maxSharesTotal || 0) : 0;
        } else if (modeName === 'even') {
          likes = template.likesServiceId ? Math.floor(((template.minLikesTotal || 0) + (template.maxLikesTotal || 0)) / 2) : 0;
          comments = template.enableComments ? Math.floor(((template.minCommentsTotal || 0) + (template.maxCommentsTotal || 0)) / 2) : 0;
          shares = template.enableShares ? Math.floor(((template.minSharesTotal || 0) + (template.maxSharesTotal || 0)) / 2) : 0;
        } else if (modeName === 'weighted') {
          if (len <= 1) {
            likes = template.likesServiceId ? (template.maxLikesTotal || 0) : 0;
            comments = template.enableComments ? (template.maxCommentsTotal || 0) : 0;
            shares = template.enableShares ? (template.maxSharesTotal || 0) : 0;
          } else {
            const ratio = (len - 1 - idx) / (len - 1);
            likes = template.likesServiceId ? Math.floor((template.minLikesTotal || 0) + ratio * ((template.maxLikesTotal || 0) - (template.minLikesTotal || 0))) : 0;
            comments = template.enableComments ? Math.floor((template.minCommentsTotal || 0) + ratio * ((template.maxCommentsTotal || 0) - (template.minCommentsTotal || 0))) : 0;
            shares = template.enableShares ? Math.floor((template.minSharesTotal || 0) + ratio * ((template.maxSharesTotal || 0) - (template.minSharesTotal || 0))) : 0;
          }
        }
      }

      return {
        ...item,
        totalViews: views,
        totalLikes: likes,
        totalComments: comments,
        totalShares: shares
      };
    });
  }

  useEffect(() => {
    if (targetMode !== 'batch') {
      setBulkItems([]);
      return;
    }
    const chosenTemplate = templates.find(t => t._id === form.templateId);
    if (!chosenTemplate || chosenTemplate.type !== 'bulk') {
      setBulkItems([]);
      return;
    }
    const lines = form.linksText.split('\n').map(l => l.trim()).filter(l => l);
    
    let newItems = lines.map(url => {
      const existing = bulkItems.find(item => item.url === url);
      if (existing) return existing;
      const isRatio = chosenTemplate.engagementMode === 'percentage';
      return {
        url,
        totalViews: chosenTemplate.minViewsTotal || 0,
        totalLikes: isRatio ? 0 : (chosenTemplate.likesServiceId ? (chosenTemplate.minLikesTotal || 0) : 0),
        totalComments: isRatio ? 0 : (chosenTemplate.enableComments ? (chosenTemplate.minCommentsTotal || 0) : 0),
        totalShares: isRatio ? 0 : (chosenTemplate.enableShares ? (chosenTemplate.minSharesTotal || 0) : 0),
      };
    });

    if (distributionMode !== 'manual') {
      newItems = applyDistribution(distributionMode, newItems, chosenTemplate);
    }
    
    setBulkItems(newItems);
  }, [form.linksText, form.templateId, targetMode, templates, distributionMode]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRandomizeAgain = () => {
    const chosenTemplate = templates.find(t => t._id === form.templateId);
    if (!chosenTemplate) return;
    setDistributionMode('random');
    setBulkItems(applyDistribution('random', bulkItems, chosenTemplate));
  };

  const handleDistributeEvenly = () => {
    const chosenTemplate = templates.find(t => t._id === form.templateId);
    if (!chosenTemplate) return;
    setDistributionMode('even');
    setBulkItems(applyDistribution('even', bulkItems, chosenTemplate));
  };

  const handleApplySameValues = () => {
    if (bulkItems.length <= 1) return;
    const firstVal = bulkItems[0];
    setDistributionMode('manual');
    setBulkItems(prev => prev.map((item, idx) => idx === 0 ? item : {
      ...item,
      totalViews: firstVal.totalViews,
      totalLikes: firstVal.totalLikes,
      totalComments: firstVal.totalComments,
      totalShares: firstVal.totalShares,
    }));
  };

  const handleResetAllocation = () => {
    const chosenTemplate = templates.find(t => t._id === form.templateId);
    if (!chosenTemplate) return;
    setDistributionMode('manual');
    setBulkItems(prev => prev.map(item => ({
      ...item,
      totalViews: chosenTemplate.minViewsTotal || 0,
      totalLikes: chosenTemplate.likesServiceId ? (chosenTemplate.minLikesTotal || 0) : 0,
      totalComments: chosenTemplate.enableComments ? (chosenTemplate.minCommentsTotal || 0) : 0,
      totalShares: chosenTemplate.enableShares ? (chosenTemplate.minSharesTotal || 0) : 0,
    })));
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length <= 1) {
        toast.error('CSV is empty or lacks data rows');
        return;
      }
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const urlIdx = headers.indexOf('url');
      const viewsIdx = headers.indexOf('views');
      const likesIdx = headers.indexOf('likes');
      const commentsIdx = headers.indexOf('comments');
      const sharesIdx = headers.indexOf('shares');

      if (urlIdx === -1) {
        toast.error('CSV is missing header column: url');
        return;
      }

      const imported = [];
      const pastedUrls = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length <= urlIdx) continue;
        const url = cols[urlIdx];
        if (!url) continue;
        
        pastedUrls.push(url);
        imported.push({
          url,
          totalViews: viewsIdx !== -1 ? (parseInt(cols[viewsIdx]) || 0) : 0,
          totalLikes: likesIdx !== -1 ? (parseInt(cols[likesIdx]) || 0) : 0,
          totalComments: commentsIdx !== -1 ? (parseInt(cols[commentsIdx]) || 0) : 0,
          totalShares: sharesIdx !== -1 ? (parseInt(cols[sharesIdx]) || 0) : 0,
        });
      }

      if (imported.length > 0) {
        setForm(f => ({ ...f, linksText: pastedUrls.join('\n') }));
        setDistributionMode('manual');
        setBulkItems(imported);
        toast.success(`Successfully imported ${imported.length} rows from CSV`);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleExportCSV = () => {
    if (!bulkItems.length) {
      toast.error('No allocations to export');
      return;
    }
    const headers = ['url', 'views', 'likes', 'comments', 'shares'];
    const rows = bulkItems.map(item => [
      `"${item.url}"`,
      item.totalViews,
      item.totalLikes,
      item.totalComments,
      item.totalShares
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_order_allocation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    let links = [];
    if (targetMode === 'single') {
      if (!form.singleLink.trim()) return toast.error('Link is required');
      links = [form.singleLink.trim()];
    } else {
      const chosenTemplate = templates.find(t => t._id === form.templateId);
      if (chosenTemplate && chosenTemplate.type === 'bulk') {
        if (!bulkItems.length) return toast.error('At least one link is required');
        
        const isRatio = chosenTemplate.engagementMode === 'percentage';
        for (let i = 0; i < bulkItems.length; i++) {
          const item = bulkItems[i];
          if (item.totalViews < (chosenTemplate.minViewsTotal || 0) || item.totalViews > (chosenTemplate.maxViewsTotal || 99999999)) {
            return toast.error(`Reel #${i+1} views must be between ${chosenTemplate.minViewsTotal} and ${chosenTemplate.maxViewsTotal}`);
          }
          if (!isRatio) {
            if (chosenTemplate.likesServiceId) {
              if (item.totalLikes < (chosenTemplate.minLikesTotal || 0) || item.totalLikes > (chosenTemplate.maxLikesTotal || 99999999)) {
                return toast.error(`Reel #${i+1} likes must be between ${chosenTemplate.minLikesTotal} and ${chosenTemplate.maxLikesTotal}`);
              }
            }
            if (chosenTemplate.enableComments && chosenTemplate.commentsServiceId) {
              if (item.totalComments < (chosenTemplate.minCommentsTotal || 0) || item.totalComments > (chosenTemplate.maxCommentsTotal || 99999999)) {
                return toast.error(`Reel #${i+1} comments must be between ${chosenTemplate.minCommentsTotal} and ${chosenTemplate.maxCommentsTotal}`);
              }
            }
            if (chosenTemplate.enableShares && chosenTemplate.sharesServiceId) {
              if (item.totalShares < (chosenTemplate.minSharesTotal || 0) || item.totalShares > (chosenTemplate.maxSharesTotal || 99999999)) {
                return toast.error(`Reel #${i+1} shares must be between ${chosenTemplate.minSharesTotal} and ${chosenTemplate.maxSharesTotal}`);
              }
            }
          }
        }
        links = bulkItems;
      } else {
        links = form.linksText.split('\n').map(l => l.trim()).filter(l => l);
        if (!links.length) return toast.error('At least one link is required');
      }
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
        notes: form.notes,
        startDelay: form.startDelay
      };

      await createOrder(payload);
      const msg = links.length > 1 ? `Created ${links.length} orders in bulk! 🚀` : 'Order created! Drip-feed started 🚀';
      toast.success(msg);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally { setLoading(false); }
  }

  const chosenTemplate = templates.find(t => t._id === form.templateId) || {};

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: targetMode === 'batch' && form.templateId ? 920 : 640, width: '96%', transition: 'max-width 0.25s ease' }}>
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
                {(() => {
                  const filteredDropdownTemplates = templates.filter(t => {
                    const tType = t.type || 'single';
                    return targetMode === 'single' ? tType === 'single' : tType === 'bulk';
                  });

                  if (filteredDropdownTemplates.length === 0) {
                    return <p style={{ fontSize: 13, color: '#f87171', margin: '8px 0' }}>⚠️ No matching {targetMode} templates found. Create one first!</p>;
                  }

                  return (
                    <select className="form-select" value={form.templateId} onChange={set('templateId')} required>
                      <option value="">— Select a template —</option>
                      {filteredDropdownTemplates.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.name} (
                            {t.type === 'bulk' 
                              ? `Views: ${t.minViewsTotal || 0}-${t.maxViewsTotal || 0} | Likes: ${t.minLikesTotal || 0}-${t.maxLikesTotal || 0}`
                              : `Max views: ${t.maxViewsTotal?.toLocaleString() || 0} | Likes: ${t.totalLikes || 0}`
                            }
                          )
                        </option>
                      ))}
                    </select>
                  );
                })()}

                {targetMode === 'batch' && bulkItems.length > 0 && form.templateId && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', margin: 0 }}>
                        Reels Allocations & Smart Distribution ({bulkItems.length})
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mode:</span>
                        <select 
                          className="form-select" 
                          style={{ height: 28, padding: '2px 8px', fontSize: 11, width: 110 }} 
                          value={distributionMode} 
                          onChange={(e) => setDistributionMode(e.target.value)}
                        >
                          <option value="random">🎲 Random</option>
                          <option value="even">⚖️ Even</option>
                          <option value="weighted">📈 Weighted</option>
                          <option value="manual">✍️ Manual</option>
                        </select>
                      </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        flexWrap: 'wrap', 
                        marginBottom: 12, 
                        padding: 8, 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 8 
                      }}
                    >
                      <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleRandomizeAgain} disabled={distributionMode === 'manual'}>
                        🎲 Randomize
                      </button>
                      <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleDistributeEvenly} disabled={distributionMode === 'manual'}>
                        ⚖️ Mid-Even
                      </button>
                      <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleApplySameValues}>
                        📋 Copy Row #1
                      </button>
                      <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleResetAllocation}>
                        🔄 Reset
                      </button>
                      
                      <div style={{ borderLeft: '1px solid var(--border)', height: 16, margin: '0 4px' }} />

                      {/* CSV Actions */}
                      <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleExportCSV}>
                        📥 Export CSV
                      </button>
                      
                      <label 
                        className="btn btn-sm btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}
                      >
                        📤 Import CSV
                        <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {/* Premium Table Content */}
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 310 }} className="custom-scroll">
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '8px 12px', width: 30, color: 'var(--text-muted)', fontWeight: 600 }}>#</th>
                            <th style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>Instagram Target Link</th>
                            <th style={{ padding: '8px 12px', width: 110, color: 'var(--purple)', fontWeight: 600 }}>Views</th>
                            {chosenTemplate.likesServiceId && <th style={{ padding: '8px 12px', width: 110, color: 'var(--green)', fontWeight: 600 }}>Likes</th>}
                            {chosenTemplate.enableComments && chosenTemplate.commentsServiceId && <th style={{ padding: '8px 12px', width: 110, color: 'var(--cyan)', fontWeight: 600 }}>Comments</th>}
                            {chosenTemplate.enableShares && chosenTemplate.sharesServiceId && <th style={{ padding: '8px 12px', width: 110, color: 'var(--yellow)', fontWeight: 600 }}>Shares</th>}
                            <th style={{ padding: '8px 12px', width: 45, textAlign: 'center', color: 'var(--text-muted)' }}>Del</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkItems.map((item, idx) => {
                            const handleFieldChange = (field, value) => {
                              setDistributionMode('manual');
                              setBulkItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
                            };

                            const handleUrlChange = (newUrl) => {
                              setBulkItems(prev => prev.map((it, i) => i === idx ? { ...it, url: newUrl } : it));
                              setBulkItems(prev => {
                                const currentUrls = prev.map(it => it.url);
                                setForm(f => ({ ...f, linksText: currentUrls.join('\n') }));
                                return prev;
                              });
                            };

                            const handleDeleteIndex = () => {
                              const remaining = bulkItems.filter((_, i) => i !== idx);
                              setBulkItems(remaining);
                              setForm(f => ({ ...f, linksText: remaining.map(it => it.url).join('\n') }));
                            };

                            return (
                              <tr key={idx} style={{ borderBottom: idx < bulkItems.length - 1 ? '1px solid var(--border)' : 'none', background: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.005)' : 'none' }}>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                <td style={{ padding: '6px 12px' }}>
                                  <input 
                                    className="form-input font-mono" 
                                    style={{ height: 26, padding: '2px 6px', fontSize: 11, background: 'transparent', border: '1px solid transparent', borderBottom: '1px dashed var(--border)', borderRadius: 0, width: '100%', minWidth: 160 }} 
                                    value={item.url} 
                                    onChange={(e) => handleUrlChange(e.target.value)} 
                                  />
                                </td>
                                
                                <td style={{ padding: '6px 12px' }}>
                                  <input 
                                    type="number" 
                                    className="form-input" 
                                    style={{ height: 26, padding: '2px 6px', fontSize: 11 }} 
                                    value={item.totalViews} 
                                    required
                                    min={chosenTemplate.minViewsTotal || 0}
                                    max={chosenTemplate.maxViewsTotal || 99999999}
                                    onChange={(e) => handleFieldChange('totalViews', parseInt(e.target.value) || 0)} 
                                  />
                                </td>

                                {chosenTemplate.likesServiceId && (
                                  <td style={{ padding: '6px 12px' }}>
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      style={{ height: 26, padding: '2px 6px', fontSize: 11 }} 
                                      value={item.totalLikes} 
                                      required
                                      min={chosenTemplate.minLikesTotal || 0}
                                      max={chosenTemplate.maxLikesTotal || 99999999}
                                      onChange={(e) => handleFieldChange('totalLikes', parseInt(e.target.value) || 0)} 
                                    />
                                  </td>
                                )}

                                {chosenTemplate.enableComments && chosenTemplate.commentsServiceId && (
                                  <td style={{ padding: '6px 12px' }}>
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      style={{ height: 26, padding: '2px 6px', fontSize: 11 }} 
                                      value={item.totalComments} 
                                      required
                                      min={chosenTemplate.minCommentsTotal || 0}
                                      max={chosenTemplate.maxCommentsTotal || 99999999}
                                      onChange={(e) => handleFieldChange('totalComments', parseInt(e.target.value) || 0)} 
                                    />
                                  </td>
                                )}

                                {chosenTemplate.enableShares && chosenTemplate.sharesServiceId && (
                                  <td style={{ padding: '6px 12px' }}>
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      style={{ height: 26, padding: '2px 6px', fontSize: 11 }} 
                                      value={item.totalShares} 
                                      required
                                      min={chosenTemplate.minSharesTotal || 0}
                                      max={chosenTemplate.maxSharesTotal || 99999999}
                                      onChange={(e) => handleFieldChange('totalShares', parseInt(e.target.value) || 0)} 
                                    />
                                  </td>
                                )}

                                <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                                  <button 
                                    type="button" 
                                    onClick={handleDeleteIndex}
                                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }}
                                    title="Delete URL row"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        
                        {/* Table Footer Totals */}
                        <tfoot>
                          <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                            <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>Totals:</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--purple)' }}>
                              {bulkItems.reduce((acc, curr) => acc + (curr.totalViews || 0), 0).toLocaleString()}
                            </td>
                            {chosenTemplate.likesServiceId && (
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--green)' }}>
                                {bulkItems.reduce((acc, curr) => acc + (curr.totalLikes || 0), 0).toLocaleString()}
                              </td>
                            )}
                            {chosenTemplate.enableComments && chosenTemplate.commentsServiceId && (
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--cyan)' }}>
                                {bulkItems.reduce((acc, curr) => acc + (curr.totalComments || 0), 0).toLocaleString()}
                              </td>
                            )}
                            {chosenTemplate.enableShares && chosenTemplate.sharesServiceId && (
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--yellow)' }}>
                                {bulkItems.reduce((acc, curr) => acc + (curr.totalShares || 0), 0).toLocaleString()}
                              </td>
                            )}
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            <div className="form-row mt-4">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes} onChange={set('notes')} placeholder="Optional notes..." />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Start Delay (Mins)</label>
                <input className="form-input" type="number" min="0" value={form.startDelay} onChange={set('startDelay')} placeholder="0" />
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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');
const socket = io(SOCKET_URL);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState([]);
  const [promoTemplateIds, setPromoTemplateIds] = useState({});

  const searchLink = searchParams.get('link') || '';
  const searchTemplate = searchParams.get('template') || '';

  useEffect(() => {
    if (searchLink || searchTemplate) {
      setShowCreate(true);
    }
  }, [searchLink, searchTemplate]);

  async function load() {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const [ordRes, tempRes] = await Promise.all([getOrders(params), getTemplates()]);
      setOrders(ordRes.data);
      setTemplates(tempRes.data);
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
            <div className="empty-state-icon"><ShoppingBag size={48} /></div>
            <div className="empty-state-title">No orders {filter ? `with status "${filter}"` : 'yet'}</div>
            <div className="empty-state-desc">Create your first drip-feed order to begin a campaign.</div>
          </div>
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => {
            const pct = progressPct(order);
            
            const CATEGORY_PROGRESSION = {
              'Starter': 'Growth',
              'Growth': 'Momentum',
              'Momentum': 'Viral',
              'Viral': 'Elite'
            };
            const currentCategory = order.template?.category || (order.template && typeof order.template === 'object' ? order.template.category : null);
            const nextCategory = currentCategory ? CATEGORY_PROGRESSION[currentCategory] : null;
            const nextTemplate = nextCategory ? templates.find(t => t.category === nextCategory) : null;

            return (
              <div key={order._id} className="card">
                <div className="card-body">
                  <div className="order-card-header" style={{ marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                        <span className={`badge badge-${order.status}`}>
                          {order.status === 'running' && <span className="pulse-dot" style={{ marginRight: 6 }} />}
                          {order.status}
                        </span>
                        <PlatformIcon platform={order.platform} size={14} />
                        {order.template && (
                          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>
                            <Layers size={12} /> {order.template.name}
                          </span>
                        )}
                      </div>
                      <div className="font-mono truncate" style={{ maxWidth: '80%', fontSize: 13, color: 'var(--text-secondary)' }} title={order.socialLink}>
                        <LinkIcon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {order.socialLink}
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
                      {order.status === 'completed' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <select 
                            className="form-select form-input-sm" 
                            style={{ width: 140, height: 28, padding: '2px 4px', fontSize: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4 }}
                            value={promoTemplateIds[order._id] || nextTemplate?._id || ''}
                            onChange={(e) => setPromoTemplateIds(prev => ({ ...prev, [order._id]: e.target.value }))}
                          >
                            <option value="">-- Choose Preset --</option>
                            {templates.map(t => (
                              <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                          </select>
                          <Link 
                            to={`/orders?link=${encodeURIComponent(order.socialLink)}&template=${promoTemplateIds[order._id] || nextTemplate?._id || ''}`} 
                            className="btn btn-sm btn-primary flex items-center gap-1"
                            style={{ textDecoration: 'none', background: 'var(--cyan)', borderColor: 'var(--cyan)', color: 'var(--bg-primary)', height: 28, padding: '2px 8px', fontSize: 10, display: 'inline-flex', alignItems: 'center' }}
                            onClick={(e) => {
                              const activePromoId = promoTemplateIds[order._id] || nextTemplate?._id || '';
                              if (!activePromoId) {
                                e.preventDefault();
                                toast.error('Choose a preset template first');
                              }
                            }}
                          >
                            <Plus size={10} /> Start Drip
                          </Link>
                        </div>
                      )}
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
                        {order.completedTicks || 0} / {order.totalTicks || 0} rounds
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="progress-label" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span className="text-cyan" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {order.deliveredViews?.toLocaleString()} / {order.totalViews?.toLocaleString()}</span>
                      <span className="text-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={12} /> {order.deliveredLikes?.toLocaleString()} / {order.totalLikes?.toLocaleString()}</span>
                      {order.commentsServiceId && (
                        <span className="text-cyan" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--cyan)' }}><MessageSquare size={12} /> {order.deliveredComments?.toLocaleString()} / {order.totalComments?.toLocaleString()}</span>
                      )}
                      {order.sharesServiceId && (
                        <span className="text-yellow" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--yellow)' }}><Share2 size={12} /> {order.deliveredShares?.toLocaleString()} / {order.totalShares?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateOrderModal 
          initialLink={searchLink}
          initialTemplateId={searchTemplate}
          onClose={() => {
            setShowCreate(false);
            setSearchParams({});
          }} 
          onCreated={() => { 
            setShowCreate(false); 
            setSearchParams({});
            load(); 
          }} 
        />
      )}
    </div>
  );
}
