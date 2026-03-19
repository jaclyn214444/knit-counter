import React, { useState, useMemo } from 'react';
import {
    FolderOpen, Plus,
    Play, X,
    Search, Shield,
    Archive, Scissors, FileText, UploadCloud, CheckCircle, Check, Image as ImageIcon
} from 'lucide-react';
import { formatRelativeTime, createDefaultCounter } from '../utils/helpers';

export default function ProjectList({ projects, setProjects, inventory = [], setActiveWorkspaceId }) {
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [isProjectSearchExpanded, setIsProjectSearchExpanded] = useState(false);
    const [isTrustBannerExpanded, setIsTrustBannerExpanded] = useState(false);

    // --- 新增專案狀態 ---
    const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
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

    const filteredProjects = useMemo(() => {
        const search = projectSearchQuery.toLowerCase();
        if (!search) return projects;
        return projects.filter(p => (p.name || '').toLowerCase().includes(search) || (p.method || '').toLowerCase().includes(search));
    }, [projects, projectSearchQuery]);

    // --- 新增專案邏輯 ---
    const closeAddProjectModal = () => {
        setIsAddProjectOpen(false);
        // reset form
        setNewProjectForm({ name: '', method: '棒針', mode: '自由模式', yarns: [], tools: [] });
        setParsedPatternData(null);
        setIsParsingPdf(false);
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
        closeAddProjectModal();
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
                <h3 className="text-lg font-black text-stone-800 tracking-tight uppercase italic">Add Project ✨</h3>
                <button onClick={closeAddProjectModal} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-2.5 rounded-full transition-colors active:scale-95">
                  <X size={20}/>
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
                    onChange={e => setNewProjectForm({...newProjectForm, name: e.target.value})} 
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
                        onClick={() => setNewProjectForm({...newProjectForm, method})}
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
                      onClick={() => setNewProjectForm({...newProjectForm, mode: '自由模式', patternData: null})} 
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-1 ${newProjectForm.mode === '自由模式' ? 'bg-[#926c44] text-white border-[#926c44] shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'}`}
                    >
                      <span>自由模式</span>
                      <span className={`text-[9px] font-bold ${newProjectForm.mode === '自由模式' ? 'text-amber-100' : 'text-stone-400'}`}>純計數器</span>
                    </button>
                    <button 
                      onClick={() => setNewProjectForm({...newProjectForm, mode: '智慧織圖'})} 
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
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Archive size={12}/> 綁定毛線 (選填)</label>
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
                              {isSelected && <div className="absolute inset-0 bg-stone-800/40 flex items-center justify-center backdrop-blur-[1px]"><Check size={16} className="text-white"/></div>}
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
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Scissors size={12}/> 綁定工具 (選填)</label>
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
                              {isSelected && <div className="absolute inset-0 bg-[#926c44]/40 flex items-center justify-center backdrop-blur-[1px]"><Check size={16} className="text-white"/></div>}
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
                  建立專案
                </button>
              </div>
            </div>
          </div>
        );
      };

    return (
        <div className="p-6 pb-28 min-h-full flex flex-col relative">
            <div className="flex justify-between items-center min-h-[40px] mt-2 mb-4">
                {isProjectSearchExpanded ? (
                    <div className="flex-1 flex items-center bg-white border border-stone-200 rounded-full px-4 py-1.5 shadow-sm animate-fade-in ring-2 ring-amber-100/50">
                        <Search size={14} className="text-stone-400 mr-2" />
                        <input autoFocus type="text" placeholder="搜尋專案名稱、工具或模式..." value={projectSearchQuery} onChange={(e) => setProjectSearchQuery(e.target.value)} onBlur={() => !projectSearchQuery && setIsProjectSearchExpanded(false)} className="flex-1 bg-transparent border-none outline-none text-xs text-stone-700 py-0" />
                        {projectSearchQuery && <button onClick={() => { setProjectSearchQuery(''); setIsProjectSearchExpanded(false); }} className="text-stone-300 hover:text-stone-500 transition-colors"><X size={14} strokeWidth={3} /></button>}
                    </div>
                ) : (
                    <h2 className="text-xl font-black tracking-tight text-stone-800 animate-fade-in flex items-center gap-2">
                        ✨ 我的編織專案
                        <button onClick={() => setIsTrustBannerExpanded(true)} className="p-1.5 rounded-full transition-all active:scale-90 bg-[#926c44]/10 text-[#926c44] hover:bg-[#926c44]/20" title="資料安全防護狀態"><Shield size={14} strokeWidth={2.5} /></button>
                    </h2>
                )}
                {!isProjectSearchExpanded && <button onClick={() => setIsProjectSearchExpanded(true)} className="p-2.5 bg-white text-[#926c44] rounded-full shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors active:scale-95 ml-2 shrink-0"><Search size={18} strokeWidth={2.5} /></button>}
            </div>

            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400 space-y-4">
                    <div className="p-6 bg-stone-100 rounded-full border border-stone-200"><FolderOpen size={48} strokeWidth={1} /></div>
                    <p className="font-bold text-sm text-center">{projectSearchQuery ? '找不到符合條件的專案' : '目前沒有專案，點擊右下角新增吧！'}</p>
                </div>
            ) : (
                filteredProjects.map(p => {
                    const cA = p.counterA || { name: '段數', value: p.rows || 0 };
                    const cB = p.counterB || { name: '針數', value: p.stitches || 0 };
                    return (
                        <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-200 mb-5 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4">
                                    <h3 className="font-black text-lg text-stone-800 leading-tight mb-1">{p.name}</h3>
                                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Edited {formatRelativeTime(p.lastEdited)}</span>
                                </div>
                                {p.status !== '已完成' && (
                                    <button onClick={() => setActiveWorkspaceId(p.id)} className="p-4 bg-stone-800 text-white rounded-full shadow-lg active:scale-90 transition-all group-hover:bg-[#926c44]"><Play size={20} fill="currentColor" /></button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-stone-100 text-stone-600 rounded-md">{p.method || '未分類'}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-[#926c44]/10 text-[#926c44] rounded-md">{p.mode || '自由模式'}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-stone-100 text-stone-500 rounded-md flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" /> {`${cA.value} / ${cB.value}`}
                                </span>
                            </div>
                        </div>
                    )
                })
            )}

            {/* 新增專案 Floating Action Button */}
            <button 
                onClick={() => setIsAddProjectOpen(true)}
                className="fixed bottom-24 right-6 p-4 bg-[#926c44] text-white rounded-full shadow-xl shadow-amber-900/20 hover:bg-amber-800 active:scale-90 transition-transform z-40"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>

            {renderAddProjectModal()}
        </div>
    );
}

