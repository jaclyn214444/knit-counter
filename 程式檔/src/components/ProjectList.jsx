import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderOpen, Plus,
  Play, X, ChevronLeft,
  Search, Shield,
  Archive, Scissors, FileText, UploadCloud, CheckCircle, Check, Image as ImageIcon,
  MoreVertical, Edit3, Trash2, History, RotateCcw, Tag, Minus, ScanFace, Camera
} from 'lucide-react';
import { formatRelativeTime, createDefaultCounter } from '../utils/helpers';

export default function ProjectList({ projects, setProjects, inventory = [], setActiveWorkspaceId, setIsAnyModalOpen, pendingEditProjectId, setPendingEditProjectId, onEditModalClose }) {
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [isProjectSearchExpanded, setIsProjectSearchExpanded] = useState(false);
  const [isTrustBannerExpanded, setIsTrustBannerExpanded] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [activeHistoryProject, setActiveHistoryProject] = useState(null);
  const [historyDrawerTab, setHistoryDrawerTab] = useState('overview');

  // --- 新增專案狀態 ---
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [activeProjectMenuId, setActiveProjectMenuId] = useState(null);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    method: '棒針', // 預設
    mode: '自由模式', // 自由模式 或 智慧織圖
    yarns: [],
    tools: []
  });

  // PDF 解析相關狀態
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parsedPatternData, setParsedPatternData] = useState(null);

  useEffect(() => {
    if (setIsAnyModalOpen) {
      setIsAnyModalOpen(isAddProjectOpen);
    }
  }, [isAddProjectOpen, setIsAnyModalOpen]);

  // 接住從 Workspace 傳來的編輯請求
  useEffect(() => {
    if (pendingEditProjectId) {
      const projToEdit = projects.find(p => p.id === pendingEditProjectId);
      if (projToEdit) {
        handleEditProject(projToEdit);
      }
      if (setPendingEditProjectId) setPendingEditProjectId(null);
    }
  }, [pendingEditProjectId, projects, setPendingEditProjectId]);

  const filteredProjects = useMemo(() => {
    const search = projectSearchQuery.toLowerCase();
    let result = projects.filter(p => isHistoryView ? p.status === '已完成' : p.status !== '已完成');
    if (search) {
      result = result.filter(p => (p.name || '').toLowerCase().includes(search) || (p.method || '').toLowerCase().includes(search));
    }
    return result;
  }, [projects, projectSearchQuery, isHistoryView]);

  // --- 新增專案邏輯 ---
  const closeAddProjectModal = () => {
    setIsAddProjectOpen(false);
    // reset form
    setEditingProjectId(null);
    setNewProjectForm({ name: '', method: '棒針', mode: '自由模式', yarns: [], tools: [] });
    setParsedPatternData(null);
    setIsParsingPdf(false);
    if (typeof onEditModalClose === 'function') onEditModalClose();
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsingPdf(true);
    // 模擬解析
    setTimeout(() => {
      setParsedPatternData({
        stages: [1, 2, 3],
        specs: { gauge: '20針28段=10cm', yarnWeight: 'Sport/DK', tool: '4.0mm / US 6' }
      });
      setIsParsingPdf(false);
    }, 1500);
  };

  const handleSaveProject = () => {
    if (!newProjectForm.name.trim()) return;

    if (editingProjectId) {
      setProjects(prev => prev.map(p => p.id === editingProjectId ? {
        ...p,
        name: newProjectForm.name.trim(),
        method: newProjectForm.method,
        mode: newProjectForm.mode,
        yarns: newProjectForm.yarns,
        tools: newProjectForm.tools,
        patternData: parsedPatternData || p.patternData,
        lastEdited: Date.now()
      } : p));
    } else {
      const newProject = {
        id: Date.now(),
        name: newProjectForm.name.trim(),
        method: newProjectForm.method,
        mode: newProjectForm.mode,
        status: '進行中',
        progress: 0,
        timeSpent: 0,
        lastEdited: Date.now(),
        yarns: newProjectForm.yarns,
        tools: newProjectForm.tools,
        counterA: createDefaultCounter('宏觀 / 段數', 1),
        counterB: createDefaultCounter('微觀 / 針數', 1),
        patternData: parsedPatternData // 如果有解析的織圖資料
      };
      setProjects(prev => [newProject, ...prev]);
    }

    closeAddProjectModal();
  };

  const handleDeleteProject = (id) => {
    if (!window.confirm('確定要刪除此專案嗎？此操作無法復原。')) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    setActiveProjectMenuId(null);
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project.id);
    setNewProjectForm({
      name: project.name,
      method: project.method || '棒針',
      mode: project.mode || '自由模式',
      yarns: project.yarns || [],
      tools: project.tools || []
    });
    setActiveProjectMenuId(null);
    setIsAddProjectOpen(true);
  };

  const handleToggleComplete = (project) => {
    const isCompleting = project.status !== '已完成';
    if (isCompleting && !window.confirm('確定要將此專案標記為已完成嗎？')) return;
    setProjects(prev => prev.map(p => p.id === project.id ? {
      ...p,
      status: isCompleting ? '已完成' : '進行中',
      lastEdited: Date.now()
    } : p));
    setActiveProjectMenuId(null);
  };

  const renderTrustBannerModal = () => {
    if (!isTrustBannerExpanded) return null;
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsTrustBannerExpanded(false)}>
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-[#926c44]/10 text-[#926c44] rounded-full flex items-center justify-center mx-auto mb-2"><Shield size={32} /></div>
            <h3 className="text-xl font-black text-stone-800">資料安全防護狀態</h3>
            <p className="text-sm font-medium text-stone-600 leading-relaxed">您的資料目前受到安全防護。系統會在背景自動為您的專案與庫存進行儲存與備份，請安心使用。</p>
            <button onClick={() => setIsTrustBannerExpanded(false)} className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black tracking-widest active:scale-95 transition-all mt-4">我知道了</button>
          </div>
        </div>
      </div>
    );
  };

  // --- 渲染新增專案 Modal ---
  const renderAddProjectModal = () => {
    if (!isAddProjectOpen) return null;

    // 篩選出可用的毛線與工具 (排除待買清單)
    const availableYarns = inventory.filter(i => i.type === 'yarn' && !i.isWishlist);
    const availableTools = inventory.filter(i => i.type === 'tool' && !i.isWishlist);

    // 處理庫存綁定的多選邏輯
    const toggleSelection = (type, id) => {
      setNewProjectForm(prev => {
        const list = prev[type];
        return {
          ...prev,
          [type]: list.includes(id) ? list.filter(itemId => itemId !== id) : [...list, id]
        };
      });
    };

    return (
      <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-stone-900/60 backdrop-blur-md p-0 md:p-6 transition-opacity pointer-events-auto">
        <div className="bg-[#faf8f6] w-full max-w-md mx-auto rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">

          {/* --- 頂部標題列 --- */}
          <div className="flex justify-between items-center p-8 pb-4 border-b border-stone-100 shrink-0">
            <h3 className="text-lg font-black text-stone-800 tracking-tight uppercase italic">{editingProjectId ? 'Edit Project ✨' : 'Add Project ✨'}</h3>
            <button onClick={closeAddProjectModal} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-2.5 rounded-full transition-colors active:scale-95">
              <X size={20} />
            </button>
          </div>

          {/* --- 表單內容區 --- */}
          <div className="p-8 pt-4 overflow-y-auto space-y-6 pb-6 no-scrollbar">

            {/* 專案名稱 */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">專案名稱</label>
              <input
                autoFocus
                type="text"
                placeholder="例如：給媽媽的初學者圍巾..."
                value={newProjectForm.name}
                onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-stone-700 outline-none text-sm font-bold focus:border-[#926c44] transition-colors shadow-sm"
              />
            </div>

            {/* 編織方法 */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">編織方法</label>
              <div className="flex gap-3">
                {['棒針', '鉤針'].map(method => (
                  <button
                    key={method}
                    onClick={() => setNewProjectForm({ ...newProjectForm, method })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${newProjectForm.method === method ? 'bg-stone-800 text-white border-stone-800 shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* 專案模式 */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">專案模式</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setNewProjectForm({ ...newProjectForm, mode: '自由模式', patternData: null })}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-1 ${newProjectForm.mode === '自由模式' ? 'bg-[#926c44] text-white border-[#926c44] shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'}`}
                >
                  <span>自由模式</span>
                  <span className={`text-[9px] font-bold ${newProjectForm.mode === '自由模式' ? 'text-amber-100' : 'text-stone-400'}`}>純計數器</span>
                </button>
                <button
                  onClick={() => setNewProjectForm({ ...newProjectForm, mode: '智慧織圖' })}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-1 ${newProjectForm.mode === '智慧織圖' ? 'bg-[#926c44] text-white border-[#926c44] shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'}`}
                >
                  <span>智慧織圖</span>
                  <span className={`text-[9px] font-bold ${newProjectForm.mode === '智慧織圖' ? 'text-amber-100' : 'text-stone-400'}`}>上傳 PDF 轉譯</span>
                </button>
              </div>
            </div>

            {/* 智慧織圖上傳區塊 (僅在選擇智慧織圖時顯示) */}
            {newProjectForm.mode === '智慧織圖' && (
              <div className="animate-fade-in space-y-3 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <label className="text-[10px] font-black text-[#926c44] uppercase tracking-widest flex items-center gap-1.5"><FileText size={14} /> 織圖檔案 (PDF)</label>

                {!parsedPatternData && !isParsingPdf ? (
                  <label className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-stone-200 rounded-xl p-6 text-stone-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 cursor-pointer transition-all">
                    <UploadCloud size={28} className="mb-2" />
                    <span className="text-xs font-bold mb-1">點擊上傳 PDF 織圖</span>
                    <span className="text-[10px] text-stone-400 font-medium">支援英文棒/鉤針織圖自動翻譯解析</span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                  </label>
                ) : isParsingPdf ? (
                  <div className="flex flex-col items-center justify-center bg-white border border-stone-100 rounded-xl p-6 text-amber-500 shadow-sm">
                    <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-3"></div>
                    <span className="text-xs font-black animate-pulse">AI 魔法解析中...</span>
                  </div>
                ) : (
                  <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2 text-emerald-600 mb-3">
                      <CheckCircle size={16} />
                      <span className="text-xs font-black">解析成功！共 {parsedPatternData.stages.length} 個階段</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <p className="truncate"><span className="font-bold text-stone-400">密度:</span> {parsedPatternData.specs.gauge}</p>
                      <p className="truncate"><span className="font-bold text-stone-400">線材:</span> {parsedPatternData.specs.yarnWeight}</p>
                      <p className="col-span-2 truncate"><span className="font-bold text-stone-400">工具:</span> {parsedPatternData.specs.tool}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 綁定庫存 - 毛線 */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Archive size={12} /> 綁定毛線 (選填)</label>
              {availableYarns.length === 0 ? (
                <p className="text-[10px] text-stone-400 italic bg-white p-3 rounded-xl border border-stone-100">目前沒有可用的毛線庫存</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                  {availableYarns.map(yarn => {
                    const isSelected = newProjectForm.yarns.includes(yarn.id);
                    return (
                      <button key={yarn.id} onClick={() => toggleSelection('yarns', yarn.id)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl min-w-[76px] border transition-all ${isSelected ? 'bg-stone-800 border-stone-800 text-white shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                        <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center relative">
                          {yarn.image ? <img src={yarn.image} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-stone-300" />}
                          {isSelected && <div className="absolute inset-0 bg-stone-800/40 flex items-center justify-center backdrop-blur-[1px]"><Check size={16} className="text-white" /></div>}
                        </div>
                        <span className="text-[9px] font-bold truncate w-full text-center px-1">{yarn.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 綁定庫存 - 工具 */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Scissors size={12} /> 綁定工具 (選填)</label>
              {availableTools.length === 0 ? (
                <p className="text-[10px] text-stone-400 italic bg-white p-3 rounded-xl border border-stone-100">目前沒有可用的工具庫存</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                  {availableTools.map(tool => {
                    const isSelected = newProjectForm.tools.includes(tool.id);
                    return (
                      <button key={tool.id} onClick={() => toggleSelection('tools', tool.id)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl min-w-[76px] border transition-all ${isSelected ? 'bg-[#926c44] border-[#926c44] text-white shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                        <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center relative ${isSelected ? 'bg-white/10' : 'bg-stone-100'}`}>
                          <Scissors size={18} className={isSelected ? 'text-white' : 'text-stone-400'} />
                          {isSelected && <div className="absolute inset-0 bg-[#926c44]/40 flex items-center justify-center backdrop-blur-[1px]"><Check size={16} className="text-white" /></div>}
                        </div>
                        <span className="text-[9px] font-bold truncate w-full text-center px-1">{tool.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* --- 底部按鈕區 --- */}
          <div className="p-6 pt-0 flex gap-4 shrink-0">
            <button onClick={closeAddProjectModal} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-full font-black uppercase tracking-widest text-xs active:scale-95 transition-all">取消</button>
            <button
              onClick={handleSaveProject}
              disabled={!newProjectForm.name.trim()}
              className={`flex-[2] py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all ${!newProjectForm.name.trim() ? 'bg-stone-300 text-stone-100 shadow-none cursor-not-allowed' : 'bg-[#44403c] text-white shadow-stone-800/20 hover:bg-stone-900'}`}
            >
              {editingProjectId ? '儲存變更' : '建立專案'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 pb-28 min-h-full flex flex-col relative" onClick={() => setActiveProjectMenuId(null)}>
      <div className="flex justify-between items-center min-h-[40px] mt-2 mb-4">
        {isProjectSearchExpanded ? (
          <div className="flex-1 flex items-center bg-white border border-stone-200 rounded-full px-4 py-1.5 shadow-sm animate-fade-in ring-2 ring-amber-100/50">
            <Search size={14} className="text-stone-400 mr-2" />
            <input autoFocus type="text" placeholder="搜尋專案名稱、工具或模式..." value={projectSearchQuery} onChange={(e) => setProjectSearchQuery(e.target.value)} onBlur={() => !projectSearchQuery && setIsProjectSearchExpanded(false)} className="flex-1 bg-transparent border-none outline-none text-xs text-stone-700 py-0" />
            {projectSearchQuery && <button onClick={() => { setProjectSearchQuery(''); setIsProjectSearchExpanded(false); }} className="text-stone-300 hover:text-stone-500 transition-colors"><X size={14} strokeWidth={3} /></button>}
          </div>
        ) : isHistoryView ? (
          <div className="flex items-center gap-3 w-full animate-fade-in">
            <button onClick={() => setIsHistoryView(false)} className="p-2 bg-white rounded-full shadow-sm border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 active:scale-95 transition-all">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-black tracking-tight text-stone-800 flex-1">
              📦 歷史資料夾
            </h2>
          </div>
        ) : (
          <h2 className="text-xl font-black tracking-tight text-stone-800 animate-fade-in flex items-center gap-2">
            ✨ 我的編織專案
            <button onClick={() => setIsTrustBannerExpanded(true)} className="p-1.5 rounded-full transition-all active:scale-90 bg-[#926c44]/10 text-[#926c44] hover:bg-[#926c44]/20" title="資料安全防護狀態"><Shield size={14} strokeWidth={2.5} /></button>
          </h2>
        )}
        {!isProjectSearchExpanded && (
            <div className="flex gap-2 items-center ml-2 shrink-0">
                {!isHistoryView && (
                    <button onClick={() => setIsHistoryView(true)} className="p-2.5 rounded-full shadow-sm border transition-colors active:scale-95 flex items-center gap-1.5 bg-white text-stone-400 border-stone-100 hover:bg-stone-50 hover:text-stone-600" title="歷史資料夾">
                        <Archive size={16} strokeWidth={2.5} />
                    </button>
                )}
                <button onClick={() => setIsProjectSearchExpanded(true)} className="p-2.5 bg-white text-[#926c44] rounded-full shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors active:scale-95"><Search size={18} strokeWidth={2.5} /></button>
            </div>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 space-y-4">
          <div className="p-6 bg-stone-100 rounded-full border border-stone-200"><FolderOpen size={48} strokeWidth={1} /></div>
          <p className="font-bold text-sm text-center">{projectSearchQuery ? '找不到符合條件的專案' : (isHistoryView ? '歷史資料夾目前空空的唷！' : '目前沒有專案，點擊右下角新增吧！')}</p>
        </div>
      ) : (
        <div className={isHistoryView ? "grid grid-cols-2 gap-4 animate-fade-in" : "flex flex-col animate-fade-in w-full"}>
          {filteredProjects.map(p => {
            const cA = p.counterA || { name: '段數', value: p.rows || 0 };
            const cB = p.counterB || { name: '針數', value: p.stitches || 0 };

            if (isHistoryView) {
                const hours = Math.floor((p.timeSpent || 0) / 3600);
                const mins = Math.floor(((p.timeSpent || 0) % 3600) / 60);
                const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                let thumbSrc = null;
                if (p.photos && p.photos.length > 0) thumbSrc = p.photos[0];
                else if (p.yarns && p.yarns.length > 0) {
                    const mainYarn = inventory.find(i => i.id === p.yarns[0]);
                    if (mainYarn?.image) thumbSrc = mainYarn.image;
                }

                return (
                    <div key={p.id} onClick={() => setActiveHistoryProject(p)} className="bg-stone-100 rounded-[2rem] shadow-sm border border-stone-200/60 relative group flex flex-col cursor-pointer hover:shadow-md transition-all active:scale-[0.98] overflow-hidden aspect-square">
                        <div className="flex-1 w-full bg-stone-100 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                            {thumbSrc ? <img src={thumbSrc} className="w-full h-full object-cover absolute inset-0" /> : <ImageIcon size={32} className="text-stone-300 absolute" />}
                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
                            
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <h3 className="font-black text-sm leading-tight mb-1 truncate drop-shadow-md pr-6">{p.name}</h3>
                                <div className="flex items-center gap-1 opacity-90">
                                    <History size={10} />
                                    <span className="text-[10px] font-bold font-mono drop-shadow-md">{timeString}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="absolute top-2 right-2 shrink-0 z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveProjectMenuId(activeProjectMenuId === p.id ? null : p.id); }}
                                className="p-1.5 text-white/90 hover:text-white hover:bg-black/30 rounded-full transition-colors backdrop-blur-sm bg-black/10"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {activeProjectMenuId === p.id && (
                                <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 w-32 z-50 animate-fade-in flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); handleToggleComplete(p); }} className="px-4 py-3 text-xs font-bold text-stone-600 hover:bg-stone-50 text-left flex items-center gap-2"><RotateCcw size={14} className="text-stone-400" /> 還原專案</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 text-left flex items-center gap-2 border-t border-stone-100"><Trash2 size={14} className="text-red-400" /> 刪除專案</button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

          return (
            <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-200 mb-5 relative group flex items-center justify-between gap-4" onClick={e => e.stopPropagation()}>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-lg text-stone-800 leading-tight pr-2 truncate">{p.name}</h3>
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveProjectMenuId(activeProjectMenuId === p.id ? null : p.id); }}
                      className="p-1 -mt-1 -mr-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeProjectMenuId === p.id && (
                      <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 w-36 z-50 animate-fade-in flex flex-col overflow-hidden">
                        <button onClick={() => handleEditProject(p)} className="px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 text-left flex items-center gap-2"><Edit3 size={16} className="text-stone-400" /> 編輯專案</button>
                        {p.status !== '已完成' ? (
                          <button onClick={() => handleToggleComplete(p)} className="px-4 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 text-left flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400" /> 完成專案</button>
                        ) : (
                          <button onClick={() => handleToggleComplete(p)} className="px-4 py-3 text-sm font-bold text-stone-600 hover:bg-stone-50 text-left flex items-center gap-2"><RotateCcw size={16} className="text-stone-400" /> 還原專案</button>
                        )}
                        <button onClick={() => handleDeleteProject(p.id)} className="px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 text-left flex items-center gap-2 border-t border-stone-100"><Trash2 size={16} className="text-red-400" /> 刪除專案</button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Edited {formatRelativeTime(p.lastEdited)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-stone-100 text-stone-600 rounded-md">{p.method || '未分類'}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-[#926c44]/10 text-[#926c44] rounded-md">{p.mode || '自由模式'}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-stone-100 text-stone-500 rounded-md flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" /> {`${cA.value} / ${cB.value}`}
                  </span>
                </div>
              </div>
              
              {p.status !== '已完成' && (
                <button onClick={() => setActiveWorkspaceId(p.id)} className="w-16 h-16 flex items-center justify-center bg-stone-800 text-white rounded-full shadow-xl active:scale-90 transition-all group-hover:bg-[#926c44] shrink-0 border-4 border-white"><Play size={24} fill="currentColor" className="ml-1" /></button>
              )}
            </div>
          )
        })}
        </div>
      )}

      {/* 新增專案 Floating Action Button (進行中專案才出現) */}
      {!isHistoryView && (
          <div className="absolute bottom-20 right-6 z-40 flex flex-col items-end gap-4 pointer-events-auto">
              <button 
                  onClick={() => setIsAddProjectOpen(true)}
                  className="w-16 h-16 bg-[#926c44] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 hover:bg-amber-800 shadow-amber-900/20"
              >
                  <Plus size={32} strokeWidth={3} />
              </button>
          </div>
      )}

      {/* --- Historical Details Drawer --- */}
      {(() => {
          if (!activeHistoryProject) return null;
          
          const p = activeHistoryProject;
          const hours = Math.floor((p.timeSpent || 0) / 3600);
          const mins = Math.floor(((p.timeSpent || 0) % 3600) / 60);
          
          const handleHistoryPhotoUpload = (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                  setProjects(prev => prev.map(proj => proj.id === activeHistoryProject.id ? {
                      ...proj,
                      photos: [...(proj.photos || []), event.target.result]
                  } : proj));
                  setActiveHistoryProject(prev => ({...prev, photos: [...(prev.photos || []), event.target.result]}));
              };
              reader.readAsDataURL(file);
          };

          const handleUpdateUsedSkeins = (val) => {
              setProjects(prev => prev.map(proj => proj.id === activeHistoryProject.id ? {
                  ...proj,
                  skeinsUsed: Math.max(0, val)
              } : proj));
              setActiveHistoryProject(prev => ({...prev, skeinsUsed: Math.max(0, val)}));
          };
          
          return (
              <div className="fixed inset-0 z-[120] flex justify-end bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveHistoryProject(null)}>
                  <div className="w-full max-w-md h-full bg-[#faf8f6] shadow-2xl flex flex-col animate-slide-left relative" onClick={e => e.stopPropagation()}>
                      <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white shrink-0 shadow-sm z-20">
                          <h3 className="text-xl font-black text-stone-800 truncate pr-4 leading-tight">{p.name}</h3>
                          <button onClick={() => setActiveHistoryProject(null)} className="p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors shrink-0"><X size={16} /></button>
                      </div>
                      
                      <div className="flex border-b border-stone-200 bg-white sticky top-0 z-10 shrink-0">
                          {['overview', 'materials', 'gallery'].map(tab => (
                              <button key={tab} onClick={() => setHistoryDrawerTab(tab)} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${historyDrawerTab === tab ? 'text-[#926c44] border-b-[3px] border-[#926c44]' : 'text-stone-400 hover:text-stone-600 border-b-[3px] border-transparent'}`}>
                                  {tab === 'overview' ? '總覽筆記' : (tab === 'materials' ? '使用的材料' : '照片集')}
                              </button>
                          ))}
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-20 space-y-6">
                          {historyDrawerTab === 'overview' && (
                              <div className="animate-fade-in space-y-6">
                                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><History size={80} /></div>
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-1.5"><History size={12}/> 專案總時長 (Time Spent)</h4>
                                      <div className="flex items-end gap-2">
                                          <span className="text-5xl font-black text-[#926c44] leading-none">{hours}</span>
                                          <span className="text-sm font-bold text-stone-400 pb-1 mr-2">小時</span>
                                          <span className="text-4xl font-black text-stone-700 leading-none">{mins}</span>
                                          <span className="text-sm font-bold text-stone-400 pb-1">分鐘</span>
                                      </div>
                                  </div>
                                  
                                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-1.5"><FileText size={12}/> 織圖筆記 (Pattern Notes)</h4>
                                      <div className="text-sm font-medium text-stone-600 bg-stone-50 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed min-h-[100px] border border-stone-100/50">
                                          {p.stageNotes && Object.values(p.stageNotes).some(n => n.trim() !== '') ? Object.values(p.stageNotes).filter(n => n.trim() !== '').map((text, i) => <p key={i} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b border-stone-200/50 last:border-0">{text}</p>) : <span className="text-stone-400 italic">尚未留下任何筆記</span>}
                                      </div>
                                  </div>

                                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-1.5"><Tag size={12}/> 毛線計算機 (Yarn Tracker)</h4>
                                      <div className="flex items-center justify-between gap-4">
                                          <div className="flex-1">
                                              <p className="text-xs font-bold text-stone-500 mb-3">總共使用了幾球線</p>
                                              <div className="flex items-center gap-3">
                                                  <button onClick={() => handleUpdateUsedSkeins((p.skeinsUsed || 0) - 1)} className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold active:scale-95 transition-transform"><Minus size={18} /></button>
                                                  <span className="text-3xl font-black text-stone-800 w-12 text-center tabular-nums leading-none">{p.skeinsUsed || 0}</span>
                                                  <button onClick={() => handleUpdateUsedSkeins((p.skeinsUsed || 0) + 1)} className="w-11 h-11 rounded-full bg-[#926c44] text-white flex items-center justify-center font-bold active:scale-95 shadow-lg shadow-[#926c44]/20 transition-transform"><Plus size={18} /></button>
                                              </div>
                                          </div>
                                          <button onClick={() => alert('條碼掃描功能建置中...')} className="w-16 h-16 shrink-0 rounded-2xl bg-amber-50 text-amber-600 flex flex-col items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors active:scale-95 border border-amber-100">
                                              <ScanFace size={22} />
                                              <span className="text-[8px] font-black tracking-widest leading-none">掃描條碼</span>
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {historyDrawerTab === 'materials' && (
                              <div className="animate-fade-in space-y-6">
                                  <div>
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#926c44] mb-3 flex items-center gap-1"><Archive size={12}/> 曾經使用的毛線 <span className="text-stone-400 italic font-medium tracking-normal normal-case ml-1">(方便回購買線)</span></h4>
                                      <div className="space-y-3">
                                          {p.yarns && p.yarns.length > 0 ? p.yarns.map(yarnId => {
                                              const yarn = inventory.find(i => i.id === yarnId);
                                              if (!yarn) return null;
                                              return (
                                                  <div key={yarnId} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex gap-4 items-center relative overflow-hidden">
                                                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 shadow-inner">
                                                          {yarn.image ? <img src={yarn.image} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-stone-300 m-4" />}
                                                      </div>
                                                      <div className="flex-1 min-w-0 pr-2">
                                                          <h5 className="font-black text-sm text-stone-800 truncate mb-1">{yarn.name}</h5>
                                                          <p className="text-[10px] font-bold text-stone-400 truncate">{yarn.brand !== '未指定' ? yarn.brand + ' · ' : ''}{yarn.weight} · {yarn.hue}</p>
                                                          {yarn.colorCode && <p className="text-[10px] font-bold text-[#926c44] truncate mt-0.5"><span className="opacity-70">色號</span> {yarn.colorCode}</p>}
                                                      </div>
                                                  </div>
                                              )
                                          }) : <p className="text-xs font-bold text-stone-400 bg-white p-6 rounded-2xl text-center border border-stone-100 border-dashed">未綁定任何毛線</p>}
                                      </div>
                                  </div>

                                  <div>
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#926c44] mb-3 flex items-center gap-1"><Scissors size={12}/> 使用的工具記錄</h4>
                                      <div className="space-y-3">
                                          {p.tools && p.tools.length > 0 ? p.tools.map(toolId => {
                                              const tool = inventory.find(i => i.id === toolId);
                                              if (!tool) return null;
                                              return (
                                                  <div key={toolId} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex gap-4 items-center">
                                                      <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center shrink-0 border border-stone-100">
                                                          <Scissors size={20} className="text-stone-400" />
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                          <h5 className="font-black text-sm text-stone-800 truncate">{tool.name}</h5>
                                                          <p className="text-[10px] font-bold text-stone-400 truncate mt-1">{tool.material} · {tool.needleSizeValue}{tool.needleSizeUnit}</p>
                                                      </div>
                                                  </div>
                                              )
                                          }) : <p className="text-xs font-bold text-stone-400 bg-white p-6 rounded-2xl text-center border border-stone-100 border-dashed">未綁定任何工具</p>}
                                      </div>
                                  </div>
                              </div>
                          )}

                          {historyDrawerTab === 'gallery' && (
                              <div className="animate-fade-in space-y-4">
                                  <p className="text-xs font-bold text-stone-500 px-1">編織是視覺藝術，上傳進度照來記錄你的完美作品！</p>
                                  <div className="grid grid-cols-2 gap-3">
                                      <label className="aspect-square bg-white border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:text-[#926c44] hover:border-[#926c44]/50 hover:bg-stone-50 cursor-pointer transition-all">
                                          <Camera size={28} className="mb-2" />
                                          <span className="text-[10px] font-black uppercase tracking-widest">上傳成品照</span>
                                          <input type="file" accept="image/*" className="hidden" onChange={handleHistoryPhotoUpload} />
                                      </label>
                                      {p.photos && p.photos.map((src, idx) => (
                                          <div key={idx} className="aspect-square bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 shadow-sm relative group animate-fade-in">
                                              <img src={src} className="w-full h-full object-cover" />
                                          </div>
                                      )).reverse()}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          );
      })()}

      {renderTrustBannerModal()}
      {renderAddProjectModal()}
    </div>
  );
}
