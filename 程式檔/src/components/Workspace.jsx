import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    FolderOpen, Archive, BarChart2, Plus, ChevronLeft,
    Play, MoreVertical, CheckCircle, Trash2, X, Filter, Camera,
    QrCode, Sparkles, Tag, Info, Image as ImageIcon, Link,
    Pencil, Download, Search, ShoppingCart, AlertTriangle,
    ArrowUpDown, History, Ruler, Check, Pause, Moon, Sun, Settings,
    RotateCcw, Minus, FileText, Scissors, Shield, ScanFace, UploadCloud,
    ChevronRight, AlignLeft, BookOpen, MapPin, Lock, Edit3
} from 'lucide-react';
import { useLocalStorage, formatTime, playAudioFeedback, playTargetReachedSound, createDefaultCounter, getLapProgress } from '../utils/helpers';
import { KNIT_TERMS, CROCHET_TERMS } from '../utils/constants';
export default function Workspace({ projectId, projects, setProjects, inventory, onClose }) {
    const currentProject = projects.find(p => p.id === projectId);

    // 這裡將原本擠在 App.jsx 中的工作區專屬狀態「下放」到 Workspace 元件中
    const [workspaceTheme, setWorkspaceTheme] = useLocalStorage('knit-workspace-theme', 'dark');
    const [workspaceMidTab, setWorkspaceMidTab] = useState('step');
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isWakeLockActive, setIsWakeLockActive] = useState(true);
    const [wakeLockRef, setWakeLockRef] = useState(null);
    const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [resetConfirmTarget, setResetConfirmTarget] = useState(null);
    const [isAnimatingTarget, setIsAnimatingTarget] = useState(null);

    // 計時器邏輯
    useEffect(() => {
        let interval;
        if (isTimerRunning && currentProject) {
            interval = setInterval(() => {
                setProjects(prev => prev.map(p => p.id === projectId ? { ...p, timeSpent: (p.timeSpent || 0) + 1 } : p));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, projectId, setProjects, currentProject]);

    // 螢幕喚醒邏輯
    useEffect(() => {
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    const lock = await navigator.wakeLock.request('screen');
                    setWakeLockRef(lock);
                }
            } catch (err) { console.warn("Wake Lock 失敗:", err); }
        };
        if (isWakeLockActive) requestWakeLock();
        else if (wakeLockRef) wakeLockRef.release().then(() => setWakeLockRef(null));
        return () => { if (wakeLockRef) wakeLockRef.release(); };
    }, [isWakeLockActive]);

    if (!currentProject) return null;

    const cA = currentProject.counterA || createDefaultCounter('上區塊');
    const cB = currentProject.counterB || createDefaultCounter('下區塊');
    const isDark = workspaceTheme === 'dark';
    const patternData = currentProject.patternData;
    const hasPattern = !!patternData;
    const stages = hasPattern ? patternData.stages : [];
    const stageIdx = currentProject.currentStageIndex || 0;
    const currentStage = hasPattern ? stages[stageIdx] : null;
    const currentNote = currentProject.stageNotes?.[stageIdx] || '';
    const logs = currentProject.history || [];

    const targetA = (hasPattern && currentStage) ? currentStage.rows : cA.target;
    const targetB = (hasPattern && currentStage) ? currentStage.stitches : cB.target;
    const canLinkA = targetA > 0;
    const canLinkB = targetB > 0;

    const handleUpdateCounterSettings = (counterKey, field, value) => {
        setProjects(prev => prev.map(p => p.id === projectId ? {
            ...p, [counterKey]: { ...p[counterKey], [field]: value }, lastEdited: Date.now()
        } : p));
    };

    const changeStage = (direction) => {
        if (!hasPattern) return;
        const newIdx = stageIdx + direction;
        if (newIdx >= 0 && newIdx < stages.length) {
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, currentStageIndex: newIdx, lastEdited: Date.now() } : p));
        }
    };

    const handleCount = (counterKey, increment = 1, e = null) => {
        if (e) e.stopPropagation();
        if (!isTimerRunning) setIsTimerRunning(true);
        if (increment > 0) playAudioFeedback(counterKey === 'counterA' ? 300 : 600, 'sine');
        else playAudioFeedback(200, 'square', 0.05);

        setProjects(prev => prev.map(proj => {
            if (proj.id === projectId) {
                const updatedProj = JSON.parse(JSON.stringify(proj));
                const currentCounter = updatedProj[counterKey];
                const stage = hasPattern ? updatedProj.patternData.stages[updatedProj.currentStageIndex || 0] : null;
                let actualTarget = currentCounter.target;
                if (hasPattern && stage) {
                    actualTarget = counterKey === 'counterA' ? stage.rows : stage.stitches;
                }

                let newValue = Math.max(0, currentCounter.value + increment);
                currentCounter.value = newValue;
                updatedProj.lastEdited = Date.now();

                if (increment > 0 && actualTarget > 0 && newValue >= actualTarget) {
                    setIsAnimatingTarget(counterKey);
                    playTargetReachedSound();

                    const otherKey = counterKey === 'counterA' ? 'counterB' : 'counterA';
                    let shouldAdvanceStage = false;
                    let nextStageIdx = proj.currentStageIndex || 0;

                    if (currentCounter.linkAction !== 0) {
                        updatedProj[otherKey].value = Math.max(0, updatedProj[otherKey].value + currentCounter.linkAction);
                        const linkedCounterName = updatedProj[otherKey].name.split(' / ')[1] || updatedProj[otherKey].name;
                        updatedProj.history = [{
                            id: Date.now() + Math.random(), time: Date.now(), counterName: linkedCounterName, action: '連動', diff: currentCounter.linkAction, value: updatedProj[otherKey].value
                        }, ...(updatedProj.history || [])].slice(0, 100);
                    }

                    if (hasPattern && counterKey === 'counterA' && currentCounter.autoAdvance) {
                        if (nextStageIdx < proj.patternData.stages.length - 1) {
                            shouldAdvanceStage = true;
                            nextStageIdx++;
                        }
                    }

                    if (currentCounter.autoReset || shouldAdvanceStage) {
                        setTimeout(() => {
                            setProjects(curr => curr.map(p => p.id === projectId ? {
                                ...p, [counterKey]: { ...(p[counterKey] || currentCounter), value: 0 }, currentStageIndex: nextStageIdx, lastEdited: Date.now()
                            } : p));
                            setIsAnimatingTarget(null);
                        }, 400);
                    } else {
                        setTimeout(() => setIsAnimatingTarget(null), 400);
                    }
                }

                const counterName = currentCounter.name.split(' / ')[1] || currentCounter.name;
                updatedProj.history = [{
                    id: Date.now() + Math.random(), time: Date.now(), counterName: counterName, action: increment > 0 ? '增加' : '減少', diff: increment, value: newValue
                }, ...(updatedProj.history || [])].slice(0, 100);

                return updatedProj;
            }
            return proj;
        }));
    };

    const resetCount = (counterKey) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                const counterName = p[counterKey].name.split(' / ')[1] || p[counterKey].name;
                return {
                    ...p,
                    [counterKey]: { ...p[counterKey], value: 0 },
                    history: [{ id: Date.now() + Math.random(), time: Date.now(), counterName, action: '歸零', diff: -p[counterKey].value, value: 0 }, ...(p.history || [])].slice(0, 100)
                };
            }
            return p;
        }));
        setResetConfirmTarget(null);
    };

    const renderHighlightedInstruction = (text, method) => {
        if (!text) return null;
        const terms = method === '棒針' ? KNIT_TERMS : CROCHET_TERMS;
        const keys = Object.keys(terms).sort((a, b) => b.length - a.length);
        const regex = new RegExp(`\\b(${keys.join('|')})\\b`, 'gi');
        return text.split(regex).map((part, i) => {
            const termKey = Object.keys(terms).find(k => k.toLowerCase() === part.toLowerCase());
            if (termKey) {
                return <span key={i} title={terms[termKey]} className="inline-block bg-amber-500/20 text-amber-500 px-1 py-0.5 mx-0.5 rounded cursor-help font-mono font-bold border-b border-amber-500/30 transition-colors hover:bg-amber-500/40">{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const CounterBlock = ({ counter, counterKey, isPrimary }) => {
        const isAnimating = isAnimatingTarget === counterKey;
        const shortName = counter.name.split(' / ')[1] || counter.name;
        const displayTarget = counterKey === 'counterA' ? targetA : targetB;
        const digits = String(counter.value).length;
        let textSizeClass = hasPattern ? (digits > 4 ? 'text-3xl' : (digits > 3 ? 'text-4xl' : 'text-5xl')) : (isPrimary ? (digits > 4 ? 'text-5xl' : (digits > 3 ? 'text-[4.5rem]' : (digits > 2 ? 'text-[5.5rem]' : 'text-[7.5rem]'))) : (digits > 4 ? 'text-4xl' : (digits > 3 ? 'text-[3.5rem]' : (digits > 2 ? 'text-[4.5rem]' : 'text-[6.5rem]'))));

        return (
            <div className={`flex-1 flex flex-col relative overflow-hidden cursor-pointer transition-all duration-300 shadow-sm border ${hasPattern ? 'rounded-[2.5rem]' : 'rounded-[3.5rem]'} ${isAnimating ? 'bg-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.4)] border-amber-400 scale-[0.98]' : (isPrimary ? (isDark ? 'bg-[#926c44]/90 border-white/10 active:scale-[0.98]' : 'bg-[#926c44] border-transparent active:scale-[0.98]') : (isDark ? 'bg-stone-900 border-white/5 active:bg-stone-800' : 'bg-white border-stone-200 active:bg-stone-50'))}`} onClick={() => handleCount(counterKey, 1)}>
                <div className={`absolute top-5 left-5 right-5 flex ${hasPattern ? 'flex-col' : 'justify-between'} items-start z-10 pointer-events-none gap-1.5`}>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm ${isAnimating ? 'bg-white/30 text-white' : (isPrimary ? 'bg-black/30 text-stone-100 border border-white/10' : (isDark ? 'text-stone-400 bg-black/40 border border-white/5' : 'text-stone-500 bg-stone-100/80 border border-stone-200/50'))}`}>{shortName}</span>
                    {displayTarget > 0 && <span className={`text-[10px] font-mono font-bold ${hasPattern ? 'ml-1' : 'ml-3'} ${isAnimating ? 'text-white' : (isPrimary ? 'text-amber-200' : (isDark ? 'text-stone-500' : 'text-stone-400'))}`}>({getLapProgress(counter.value, displayTarget)}/{displayTarget})</span>}
                </div>
                <div className="flex-1 flex items-center justify-center p-6"><span className={`${textSizeClass} ${isPrimary ? 'font-black' : 'font-light'} tracking-tighter tabular-nums leading-none z-20 relative transition-all duration-300 ${isAnimating ? 'text-white scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : (isPrimary ? 'text-white' : (isDark ? 'text-stone-300' : 'text-stone-800'))}`}>{counter.value}</span></div>
                <div className={`absolute ${hasPattern ? 'bottom-4 left-0 w-full justify-center' : 'bottom-6 right-6 justify-end'} flex gap-2 z-10 pointer-events-auto`}>
                    <button onClick={(e) => handleCount(counterKey, -1, e)} className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all backdrop-blur-md ${isAnimating ? 'bg-white/20 text-white' : (isPrimary ? 'bg-black/20 text-white hover:bg-black/30 border border-white/5' : (isDark ? 'bg-white/5 text-stone-400 hover:bg-white/10' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'))}`}><Minus size={18} strokeWidth={3} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setResetConfirmTarget(counterKey); }} className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all backdrop-blur-md ${isAnimating ? 'bg-white/20 text-white' : (isPrimary ? 'bg-black/30 text-stone-300 hover:bg-black/40 border border-white/5' : (isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'))}`}><RotateCcw size={18} strokeWidth={2.5} /></button>
                </div>
            </div>
        );
    };

    return (
        <div className={`absolute inset-0 z-[60] flex flex-col transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-0 ${isDark ? 'bg-[#121212]' : 'bg-[#f5f5f4]'}`}>
            <div className={`px-5 py-4 flex justify-between items-center shrink-0 border-b z-10 transition-colors ${isDark ? 'bg-[#121212] border-white/5 text-stone-400' : 'bg-[#faf8f6] border-stone-200 text-stone-500'}`}>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setIsTimerRunning(false); onClose(); }} className={`p-2 rounded-full transition-colors active:scale-95 ${isDark ? 'bg-white/5 hover:text-white' : 'bg-stone-200/50 hover:text-stone-800'}`}><ChevronLeft size={18} /></button>
                    <button onClick={() => setIsAssistantOpen(true)} className="flex items-center justify-center group pointer-events-auto"><h3 className={`font-black tracking-widest text-sm uppercase truncate max-w-[120px] transition-colors ${isDark ? 'text-[#926c44] group-hover:text-amber-500' : 'text-stone-800 group-hover:text-[#926c44]'}`}>{currentProject.name}</h3></button>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                    <button onClick={() => setWorkspaceTheme(isDark ? 'light' : 'dark')} className={`p-2 rounded-full transition-colors active:scale-95 ${isDark ? 'bg-white/5 text-amber-400 hover:text-amber-300' : 'bg-stone-200/50 text-amber-500 hover:text-amber-600'}`}>{isDark ? <Moon size={14} /> : <Sun size={14} />}</button>
                    <button onClick={() => setIsWorkspaceSettingsOpen(true)} className={`p-2 rounded-full transition-colors relative active:scale-95 ${isDark ? 'bg-white/5 hover:text-white' : 'bg-stone-200/50 hover:text-stone-800'}`}><Settings size={14} />{(cA.linkAction !== 0 || cB.linkAction !== 0) && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-500 border border-transparent" />}</button>
                    <button onClick={() => setIsHistoryOpen(true)} className={`p-2 rounded-full transition-colors active:scale-95 ${isDark ? 'bg-white/5 text-amber-400 hover:text-amber-300' : 'bg-stone-200/50 text-amber-500 hover:text-amber-600'}`}><History size={14} /></button>
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-[10px] font-black transition-all ${isTimerRunning ? 'bg-amber-500/20 text-amber-600 border border-amber-500/50 shadow-inner' : (isDark ? 'bg-white/5 text-stone-400 border border-transparent' : 'bg-stone-200/50 text-stone-500 border border-transparent')}`}>{isTimerRunning ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}{formatTime(currentProject.timeSpent)}</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col px-5 pb-6 gap-4 pt-4 overflow-y-auto no-scrollbar scroll-smooth">
                {hasPattern && (
                    <div className={`shrink-0 rounded-2xl border shadow-md flex flex-col transition-all overflow-hidden max-h-[35vh] ${isDark ? 'bg-[#1c1917] border-white/5' : 'bg-white border-stone-200'}`}>
                        <div className="flex border-b border-stone-200/20 h-8">
                            <button onClick={() => setWorkspaceMidTab('step')} className={`flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${workspaceMidTab === 'step' ? (isDark ? 'text-amber-500 bg-white/5' : 'text-[#926c44] bg-stone-50') : (isDark ? 'text-stone-500 hover:text-stone-400' : 'text-stone-400 hover:text-stone-600')}`}><MapPin size={12} /> 步驟指令</button>
                            <div className="w-px bg-stone-200/20 my-1.5"></div>
                            <button onClick={() => setWorkspaceMidTab('note')} className={`flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${workspaceMidTab === 'note' ? (isDark ? 'text-amber-500 bg-white/5' : 'text-[#926c44] bg-stone-50') : (isDark ? 'text-stone-500 hover:text-stone-400' : 'text-stone-400 hover:text-stone-600')}`}><Pencil size={12} /> 專屬筆記</button>
                        </div>
                        <div className="px-4 py-3 relative flex-1 overflow-y-auto no-scrollbar">
                            {workspaceMidTab === 'step' ? (
                                <div className="animate-fade-in flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-1.5 shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md truncate mr-2 ${isDark ? 'bg-white/10 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>{currentStage.name}</span>
                                        <span className={`text-[9px] font-mono font-bold shrink-0 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{`${stageIdx + 1} / ${stages.length} (${Math.round(((stageIdx + 1) / stages.length) * 100)}%)`}</span>
                                    </div>
                                    <div className={`flex-1 text-[13px] leading-relaxed font-medium whitespace-pre-line py-0.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{renderHighlightedInstruction(currentStage.instruction, currentProject.method)}</div>
                                    <div className="flex justify-between mt-1 shrink-0">
                                        <button onClick={() => changeStage(-1)} disabled={stageIdx === 0} className={`p-1 rounded-full transition-colors ${stageIdx === 0 ? 'opacity-30 cursor-not-allowed' : (isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-stone-100 hover:bg-stone-200')}`}><ChevronLeft size={14} className={isDark ? 'text-stone-300' : 'text-stone-600'} /></button>
                                        <button onClick={() => changeStage(1)} disabled={stageIdx === stages.length - 1} className={`p-1 rounded-full transition-colors ${stageIdx === stages.length - 1 ? 'opacity-30 cursor-not-allowed' : (isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-stone-100 hover:bg-stone-200')}`}><ChevronRight size={14} className={isDark ? 'text-stone-300' : 'text-stone-600'} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in flex flex-col h-full min-h-[80px]">
                                    <textarea value={currentNote} onChange={handleNoteChange} placeholder={`為「${currentStage.name}」寫下筆記...`} className={`w-full flex-1 bg-transparent border-none outline-none resize-none text-sm font-medium ${isDark ? 'text-stone-300 placeholder-stone-600' : 'text-stone-700 placeholder-stone-400'}`} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className={`flex-1 flex ${hasPattern ? 'flex-row' : 'flex-col'} gap-4`}>
                    <CounterBlock counter={cA} counterKey="counterA" isPrimary={false} />
                    <CounterBlock counter={cB} counterKey="counterB" isPrimary={true} />
                </div>
            </div>

            {/* Workspace Settings Modal */}
            {isWorkspaceSettingsOpen && (
                <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex flex-col justify-end transition-all pointer-events-auto">
                    <div className={`w-full h-[90vh] max-w-md mx-auto rounded-t-[2.5rem] border-t p-6 pb-8 shadow-2xl flex flex-col animate-slide-up ${isDark ? 'bg-[#1c1917] border-white/10' : 'bg-[#faf8f6] border-stone-200'}`}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-stone-800'}`}><Settings size={22} className="text-[#926c44]" /> 高階計數器設定</h3>
                            <button onClick={() => setIsWorkspaceSettingsOpen(false)} className={`p-2.5 rounded-full transition-colors active:scale-95 ${isDark ? 'bg-white/5 text-stone-400 hover:text-white' : 'bg-stone-200/50 text-stone-500 hover:text-stone-800'}`}><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6">
                            {['counterA', 'counterB'].map((ck) => {
                                const isA = ck === 'counterA';
                                const counter = isA ? cA : cB;
                                const canLink = isA ? canLinkA : canLinkB;
                                const otherAction = isA ? cB.linkAction : cA.linkAction;
                                return (
                                    <div key={ck} className={`p-5 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-100 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className={`w-2 h-2 rounded-full ${isA ? 'bg-[#926c44]' : 'bg-amber-500'}`} />
                                            <h4 className={`text-xs font-black uppercase tracking-widest ${isA ? (isDark ? 'text-[#b48e60]' : 'text-[#926c44]') : (isDark ? 'text-amber-500' : 'text-amber-600')}`}>{isA ? '上方區塊設定' : '下方區塊設定'}</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div><label className={`text-[10px] font-bold block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>區塊名稱</label><input type="text" value={counter.name} onChange={e => handleUpdateCounterSettings(ck, 'name', e.target.value)} className={`w-full rounded-xl px-4 py-3 font-bold outline-none transition-all ${isDark ? 'bg-black/50 border border-transparent focus:border-stone-600 text-white' : 'bg-stone-50 border border-stone-200 focus:border-stone-300 text-stone-700'}`} /></div>
                                            <div className="flex gap-4">
                                                <div className="flex-1"><label className={`text-[10px] font-bold block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>當前數值</label><input type="number" value={counter.value} onChange={e => handleUpdateCounterSettings(ck, 'value', Math.max(0, parseInt(e.target.value) || 0))} className={`w-full rounded-xl px-4 py-3 font-mono font-bold outline-none transition-all ${isDark ? 'bg-black/50 border border-transparent focus:border-stone-600 text-white' : 'bg-stone-50 border border-stone-200 focus:border-stone-300 text-stone-700'}`} /></div>
                                                <div className="flex-1"><label className={`text-[10px] font-bold block mb-1.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>每組目標 (LAP)</label><input type="number" value={counter.target || ''} placeholder="無" onChange={e => { const val = e.target.value ? Math.max(1, parseInt(e.target.value)) : null; setProjects(prev => prev.map(p => p.id === projectId ? { ...p, [ck]: { ...p[ck], target: val, linkAction: val ? p[ck].linkAction : 0 } } : p)); }} className={`w-full rounded-xl px-4 py-3 font-mono font-bold outline-none transition-all ${isDark ? 'bg-black/50 border border-transparent focus:border-stone-600 text-white' : 'bg-stone-50 border border-stone-200 focus:border-stone-300 text-stone-700'}`} /></div>
                                            </div>
                                            <div className={`mt-4 p-4 rounded-2xl flex flex-col gap-3 ${isDark ? 'bg-black/30' : 'bg-stone-50'}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h5 className={`text-xs font-black mb-1 flex items-center gap-1.5 ${isA ? (isDark ? 'text-[#b48e60]' : 'text-[#926c44]') : (isDark ? 'text-amber-500' : 'text-amber-600')}`}><Sparkles size={14} /> 智慧連動 (單向)</h5>
                                                        <p className={`text-[10px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>當此區塊達標時，自動幫<span className={`${!isA ? 'text-[#926c44]' : 'text-amber-500'} font-black px-1`}>{!isA ? '上方區塊' : '下方區塊'}</span>增減數值</p>
                                                        <p className={`text-[9px] font-bold mt-1.5 ${(!canLink || otherAction !== 0) ? 'text-red-500/80' : (isDark ? 'text-stone-600' : 'text-stone-400')}`}>{!canLink ? '(⚠️ 需先設定 LAP 目標才可啟用)' : (otherAction !== 0 ? '(⚠️ 另一區塊已啟用連動，請先關閉)' : '(防呆機制：系統僅允許單向連動)')}</p>
                                                    </div>
                                                    <button disabled={!canLink || otherAction !== 0} onClick={() => { const willEnable = counter.linkAction === 0; setProjects(prev => prev.map(p => p.id === projectId ? { ...p, [ck]: { ...p[ck], linkAction: willEnable ? 1 : 0, autoReset: willEnable }, [isA ? 'counterB' : 'counterA']: { ...p[isA ? 'counterB' : 'counterA'], linkAction: willEnable ? 0 : p[isA ? 'counterB' : 'counterA'].linkAction } } : p)); }} className={`w-12 h-7 rounded-full relative transition-colors shrink-0 shadow-inner mt-1 ${(!canLink || otherAction !== 0) ? 'opacity-30 cursor-not-allowed' : ''} ${counter.linkAction !== 0 ? (isA ? 'bg-[#926c44]' : 'bg-amber-500') : (isDark ? 'bg-white/10' : 'bg-stone-200')}`}><div className={`absolute top-1 w-5 h-5 rounded-full ${counter.linkAction !== 0 ? 'bg-white' : (isDark ? 'bg-stone-400' : 'bg-white')} transition-transform shadow-sm ${counter.linkAction !== 0 ? 'right-1' : 'left-1'}`} /></button>
                                                </div>
                                                {counter.linkAction !== 0 && (
                                                    <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/5' : 'border-stone-200'}`}>
                                                        <label className={`text-[10px] font-bold ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>達標時連動數量 (不可為 0)</label>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleUpdateCounterSettings(ck, 'linkAction', counter.linkAction * -1)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black active:scale-95 transition-all ${isDark ? 'bg-white/10 text-stone-300 hover:bg-white/20' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`} title="切換正負">{counter.linkAction > 0 ? '+' : '−'}</button>
                                                            <input type="number" min="1" value={Math.abs(counter.linkAction)} onChange={(e) => { const val = parseInt(e.target.value); const absVal = isNaN(val) || val < 1 ? 1 : val; const sign = counter.linkAction > 0 ? 1 : -1; handleUpdateCounterSettings(ck, 'linkAction', absVal * sign); }} className={`w-16 h-10 rounded-xl px-2 font-mono font-black text-center outline-none transition-all ${isDark ? 'bg-black/50 border border-transparent focus:border-stone-600 text-white' : 'bg-white border border-stone-200 focus:border-stone-300 text-stone-700'}`} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {hasPattern && (
                                <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div><h4 className={`text-sm font-black mb-1 flex items-center gap-2 ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}><CheckCircle size={16} /> 自動跳段</h4><p className={`text-[10px] font-bold leading-relaxed ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/80'}`}>當段數達標時，自動跳轉至下一階段。</p></div>
                                    <button disabled={!canLinkA} onClick={() => setProjects(prev => prev.map(p => p.id === projectId ? { ...p, counterA: { ...p.counterA, autoAdvance: !p.counterA.autoAdvance } } : p))} className={`w-12 h-7 rounded-full relative transition-colors shrink-0 shadow-inner ${!canLinkA ? 'opacity-30 cursor-not-allowed' : ''} ${cA.autoAdvance ? 'bg-emerald-500' : (isDark ? 'bg-white/10' : 'bg-stone-200')}`}><div className={`absolute top-1 w-5 h-5 rounded-full ${cA.autoAdvance ? 'bg-white' : (isDark ? 'bg-stone-400' : 'bg-white')} transition-transform shadow-sm ${cA.autoAdvance ? 'right-1' : 'left-1'}`} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 歷史紀錄 Modal */}
            {isHistoryOpen && (
                <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-all pointer-events-auto animate-fade-in" onClick={() => setIsHistoryOpen(false)}>
                    <div className={`w-full h-[75vh] max-w-md mx-auto rounded-t-[2.5rem] border-t p-6 pb-12 shadow-2xl flex flex-col animate-slide-up ${isDark ? 'bg-stone-900 border-white/10' : 'bg-[#faf8f6] border-stone-200'}`} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-stone-800'}`}><History size={22} className="text-[#926c44]" /> 操作紀錄</h3>
                            <button onClick={() => setIsHistoryOpen(false)} className={`p-2.5 rounded-full transition-colors active:scale-95 ${isDark ? 'bg-white/5 text-stone-400 hover:text-white' : 'bg-stone-200/50 text-stone-500 hover:text-stone-800'}`}><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                            {logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-stone-400 opacity-50"><History size={48} className="mb-4" /><p className="text-sm font-bold">尚無任何操作紀錄</p></div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>{log.counterName}</span>
                                                <span className={`text-xs font-bold ${log.action === '歸零' ? 'text-red-500' : (log.action === '連動' ? 'text-purple-500' : (log.action === '增加' ? 'text-emerald-500' : 'text-amber-500'))}`}>{log.action} {log.diff > 0 ? `+${log.diff}` : log.diff}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{new Date(log.time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                        <div className={`text-xl font-mono font-black ${isDark ? 'text-white' : 'text-stone-700'}`}>{log.value}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 專案資訊 Specs Modal */}
            {isAssistantOpen && (
                <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-all pointer-events-auto animate-fade-in">
                    <div className={`w-full h-[85vh] max-w-md mx-auto rounded-t-[2.5rem] border-t p-6 pb-12 shadow-2xl flex flex-col animate-slide-up ${isDark ? 'bg-stone-900 border-white/10' : 'bg-[#faf8f6] border-stone-200'}`}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-stone-800'}`}><Info size={22} className="text-[#926c44]" /> 專案資訊與規格</h3>
                            <button onClick={() => setIsAssistantOpen(false)} className={`p-2.5 rounded-full transition-colors active:scale-95 ${isDark ? 'bg-white/5 text-stone-400 hover:text-white' : 'bg-stone-200/50 text-stone-500 hover:text-stone-800'}`}><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-10">
                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-100 shadow-sm'}`}>
                                <h4 className={`font-black text-lg mb-3 ${isDark ? 'text-white' : 'text-stone-800'}`}>{currentProject.name}</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isDark ? 'bg-white/10 text-stone-300' : 'bg-stone-100 text-stone-600'}`}>{currentProject.method}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isDark ? 'bg-[#926c44]/20 text-[#926c44]' : 'bg-[#926c44]/10 text-[#926c44]'}`}>{currentProject.mode}</span>
                                </div>
                            </div>
                            {hasPattern && (
                                <div className="space-y-3">
                                    <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}><FileText size={14} /> 織圖原始建議規格</label>
                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-stone-50 border-stone-200'}`}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100'}`}><span className={`block text-[9px] font-bold mb-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>織片密度 (Gauge)</span><span className={`text-xs font-black ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{patternData.specs.gauge}</span></div>
                                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100'}`}><span className={`block text-[9px] font-bold mb-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>建議線材 (Yarn)</span><span className={`text-xs font-black ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{patternData.specs.yarnWeight}</span></div>
                                            <div className={`col-span-2 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100'}`}><span className={`block text-[9px] font-bold mb-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>建議工具 (Tool)</span><span className={`text-xs font-black text-[#926c44]`}>{patternData.specs.tool}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-3">
                                <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}><Archive size={14} /> 實際使用的材料與工具</label>
                                <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-black/30 border-white/5' : 'bg-stone-50 border-stone-200'}`}>
                                    {currentProject.yarns.length === 0 && currentProject.tools.length === 0 && <span className={`text-xs font-bold italic ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>尚未綁定任何庫存</span>}
                                    {currentProject.yarns.map(yarnId => {
                                        const yarn = inventory.find(i => i.id === yarnId);
                                        if (!yarn) return null;
                                        return (
                                            <div key={yarnId} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                                                <div className="w-12 h-12 bg-stone-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">{yarn.image ? <img src={yarn.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-stone-400" />}</div>
                                                <div className="flex-1 min-w-0"><h5 className={`font-black text-xs truncate ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>{yarn.name}</h5><span className={`text-[10px] font-bold truncate block mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{yarn.brand !== '未指定' && `${yarn.brand} · `}{yarn.weight}</span></div>
                                                <div className={`text-xs font-mono font-black ${isDark ? 'text-amber-500' : 'text-[#926c44]'}`}>{yarn.amount}g</div>
                                            </div>
                                        )
                                    })}
                                    {currentProject.tools.map(toolId => {
                                        const tool = inventory.find(i => i.id === toolId);
                                        if (!tool) return null;
                                        return (
                                            <div key={toolId} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-100 shadow-sm'}`}>
                                                <div className="w-12 h-12 bg-stone-200 rounded-lg flex items-center justify-center shrink-0"><Scissors size={20} className="text-stone-400" /></div>
                                                <div className="flex-1 min-w-0"><h5 className={`font-black text-xs truncate ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>{tool.name}</h5><span className={`text-[10px] font-bold truncate block mt-0.5 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{tool.brand !== '未指定' && `${tool.brand} · `}{tool.toolSubtype || tool.toolType}</span></div>
                                                {tool.needleSizeValue && <div className={`text-xs font-mono font-black ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{tool.needleSizeValue}{tool.needleSizeUnit}</div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 歸零確認 Modal */}
            {resetConfirmTarget && (
                <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in pointer-events-auto">
                    <div className="bg-stone-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                        <h3 className="text-xl font-black text-white mb-2">確定要歸零嗎？</h3>
                        <p className="text-stone-400 text-sm mb-8">將清空目前的「{currentProject[resetConfirmTarget].name}」數值，此動作無法復原。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setResetConfirmTarget(null)} className="flex-1 py-3 bg-white/5 text-stone-300 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white/10 active:scale-95 transition-all">取消</button>
                            <button onClick={() => resetCount(resetConfirmTarget)} className="flex-1 py-3 bg-red-500 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 active:scale-95 transition-all">安全歸零</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}