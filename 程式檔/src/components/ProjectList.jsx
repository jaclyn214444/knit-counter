import React, { useState, useMemo } from 'react';
import {
    FolderOpen, Plus,
    Play, X,
    Search, Shield
} from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';

export default function ProjectList({ projects, setActiveWorkspaceId }) {
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [isProjectSearchExpanded, setIsProjectSearchExpanded] = useState(false);
    const [isTrustBannerExpanded, setIsTrustBannerExpanded] = useState(false);

    const filteredProjects = useMemo(() => {
        const search = projectSearchQuery.toLowerCase();
        if (!search) return projects;
        return projects.filter(p => (p.name || '').toLowerCase().includes(search) || (p.method || '').toLowerCase().includes(search));
    }, [projects, projectSearchQuery]);

    return (
        <div className="p-6 pb-28 min-h-full flex flex-col">
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
        </div>
    );
}
