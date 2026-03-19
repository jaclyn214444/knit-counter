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
export default function InventoryManager({ inventory, setInventory, projects }) {
    const [inventoryType, setInventoryType] = useState('yarn');
    const [baseFilter, setBaseFilter] = useState('owned');
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [yarnFilters, setYarnFilters] = useState({ sortBy: 'date_desc', hues: [], styles: [], weights: [], lengthRange: 'all', status: 'all' });
    const [toolFilters, setToolFilters] = useState({ mainCategory: '全部', types: [], jointSizes: [], materials: [], statuses: [] });
    const [editingInventoryId, setEditingInventoryId] = useState(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [isEnteringImageUrl, setIsEnteringImageUrl] = useState(false);
    const [isDownloadingQR, setIsDownloadingQR] = useState(false);
    const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

    const [newInventoryForm, setNewInventoryForm] = useState({
        type: 'yarn', name: '', amount: '', originalAmount: '', totalLength: '', lowStockThreshold: '', status: 'idle', boundProjectId: '',
        weight: '3 Light', hue: '白色/米色', dyeStyle: '單色 (Solid)', colorCode: '',
        toolCategory: '針具類', toolType: '棒針', toolSubtype: '固定式輪針',
        material: '未指定', jointSize: '未指定', length: '未指定', brand: '未指定',
        needleSizeValue: '', needleSizeUnit: 'mm', image: ''
    });

    const getWipProjectsForItem = useCallback((itemId, type) => {
        return projects.filter(p => p.status !== '已完成' && (type === 'yarn' ? (p.yarns && p.yarns.includes(itemId)) : (p.tools && p.tools.includes(itemId))));
    }, [projects]);

    const filteredInventory = useMemo(() => {
        let result = inventory.filter(item => {
            const isWish = baseFilter === 'wishlist';
            if (item.isWishlist !== isWish || item.type !== inventoryType) return false;
            const search = inventorySearchQuery.toLowerCase();
            const matchText = item.name.toLowerCase().includes(search) || (item.brand && item.brand.toLowerCase().includes(search)) || (item.colorCode && item.colorCode.toLowerCase().includes(search)) || (item.needleSizeValue && item.needleSizeValue.toLowerCase().includes(search));
            if (!matchText) return false;

            if (inventoryType === 'yarn') {
                if (yarnFilters.hues.length > 0 && !yarnFilters.hues.includes(item.hue)) return false;
                if (yarnFilters.styles.length > 0 && !yarnFilters.styles.includes(item.dyeStyle)) return false;
                if (yarnFilters.weights.length > 0 && !yarnFilters.weights.some(w => item.weight?.includes(w))) return false;
                if (yarnFilters.lengthRange !== 'all') {
                    const len = item.totalLength || 0;
                    if (yarnFilters.lengthRange === 'small' && len > 400) return false;
                    if (yarnFilters.lengthRange === 'medium' && (len <= 400 || len > 1200)) return false;
                    if (yarnFilters.lengthRange === 'large' && len <= 1200) return false;
                }
                if (yarnFilters.status !== 'all') {
                    const isWip = getWipProjectsForItem(item.id, 'yarn').length > 0;
                    if (yarnFilters.status === 'idle' && (isWip || item.amount <= 0)) return false;
                    if (yarnFilters.status === 'wip' && !isWip) return false;
                    if (yarnFilters.status === 'finished' && item.amount > 0) return false;
                }
            } else {
                if (toolFilters.mainCategory !== '全部') {
                    if (toolFilters.mainCategory === '配件' && item.toolCategory !== '配件類') return false;
                    if (toolFilters.mainCategory !== '配件' && item.toolType !== toolFilters.mainCategory) return false;
                }
                if (toolFilters.types.length > 0 && !toolFilters.types.includes(item.toolSubtype)) return false;
                if (toolFilters.jointSizes.length > 0 && !toolFilters.jointSizes.includes(item.jointSize)) return false;
                if (toolFilters.materials.length > 0 && !toolFilters.materials.includes(item.material)) return false;
                if (toolFilters.statuses.length > 0) {
                    const isWip = getWipProjectsForItem(item.id, 'tool').length > 0;
                    if (!toolFilters.statuses.includes(isWip ? 'wip' : 'idle')) return false;
                }
            }
            return true;
        });

        if (inventoryType === 'yarn') {
            result.sort((a, b) => {
                if (yarnFilters.sortBy === 'date_desc') return b.id - a.id;
                if (yarnFilters.sortBy === 'date_asc') return a.id - b.id;
                if (yarnFilters.sortBy === 'length_desc') return (b.totalLength || 0) - (a.totalLength || 0);
                if (yarnFilters.sortBy === 'length_asc') return (a.totalLength || 0) - (b.totalLength || 0);
                return 0;
            });
        }
        return result;
    }, [inventory, inventoryType, baseFilter, inventorySearchQuery, yarnFilters, toolFilters, getWipProjectsForItem]);

    const handleSaveInventory = () => {
        if (!newInventoryForm.name.trim()) return;
        const itemId = editingInventoryId || Date.now();
        const newItem = { ...newInventoryForm, id: itemId, amount: Number(newInventoryForm.amount) || 0, originalAmount: Number(newInventoryForm.originalAmount) || 0, totalLength: Number(newInventoryForm.totalLength) || 0, lowStockThreshold: Number(newInventoryForm.lowStockThreshold) || 0, isWishlist: newInventoryForm.status === 'wishlist', timestamp: Date.now() };
        setInventory(prev => { const exists = prev.find(i => i.id === itemId); return exists ? prev.map(i => i.id === itemId ? newItem : i) : [...prev, newItem]; });
        setIsAddInventoryOpen(false);
        setEditingInventoryId(null);
        setIsEnteringImageUrl(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    const MAX = 400;
                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    setNewInventoryForm({ ...newInventoryForm, image: canvas.toDataURL('image/jpeg', 0.7) });
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <div className="p-6 flex flex-col space-y-4 pb-28 min-h-full relative">
                <div className="flex justify-between items-center min-h-[40px] mt-2">
                    {isSearchExpanded ? (
                        <div className="flex-1 flex items-center bg-white border border-stone-200 rounded-full px-4 py-1.5 mr-2 shadow-sm animate-fade-in ring-2 ring-amber-100/50">
                            <Search size={14} className="text-stone-400 mr-2" />
                            <input autoFocus type="text" placeholder="搜尋..." value={inventorySearchQuery} onChange={(e) => setInventorySearchQuery(e.target.value)} onBlur={() => !inventorySearchQuery && setIsSearchExpanded(false)} className="flex-1 bg-transparent border-none outline-none text-xs text-stone-700 py-0" />
                            {inventorySearchQuery && <button onClick={() => { setInventorySearchQuery(''); setIsSearchExpanded(false); }} className="text-stone-300 hover:text-stone-500 transition-colors"><X size={14} strokeWidth={3} /></button>}
                        </div>
                    ) : (
                        <h2 className="text-xl font-black tracking-tight text-stone-800 animate-fade-in flex items-center gap-2">{inventoryType === 'yarn' ? '🧶 毛線庫存' : '🛠️ 工具箱'}</h2>
                    )}
                    <div className="flex gap-1.5 shrink-0">
                        {!isSearchExpanded && <button onClick={() => setIsSearchExpanded(true)} className="p-2.5 bg-white text-[#926c44] rounded-full shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors active:scale-95"><Search size={18} strokeWidth={2.5} /></button>}
                        <button onClick={() => setIsFilterOpen(true)} className={`p-2.5 rounded-full shadow-sm border transition-all active:scale-90 ${Object.values(inventoryType === 'yarn' ? yarnFilters : toolFilters).some(v => Array.isArray(v) ? v.length > 0 : v !== 'all' && v !== 'date_desc' && v !== '全部') ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white border-stone-100 text-[#926c44]'}`}><Filter size={18} strokeWidth={2.5} /></button>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <div className="flex bg-stone-200/50 p-0.5 rounded-xl border border-stone-200">
                        <button onClick={() => setInventoryType('yarn')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${inventoryType === 'yarn' ? 'bg-white shadow-sm text-[#926c44]' : 'text-stone-400'}`}>毛線</button>
                        <button onClick={() => setInventoryType('tool')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${inventoryType === 'tool' ? 'bg-white shadow-sm text-[#926c44]' : 'text-stone-400'}`}>工具</button>
                    </div>
                    <div className="inline-flex bg-stone-200/50 p-0.5 rounded-full border border-stone-200 shadow-inner shrink-0">
                        <button onClick={() => setBaseFilter('owned')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${baseFilter === 'owned' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-500'}`}>我的擁有</button>
                        <button onClick={() => setBaseFilter('wishlist')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${baseFilter === 'wishlist' ? 'bg-[#926c44] shadow-sm text-white' : 'text-stone-400 hover:text-stone-500'}`}>待買</button>
                    </div>
                </div>

                {inventoryType === 'tool' && (
                    <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-6 px-6 no-scrollbar">
                        {['全部', '棒針', '鉤針', '配件'].map(cat => <button key={cat} onClick={() => setToolFilters({ ...toolFilters, mainCategory: cat })} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${toolFilters.mainCategory === cat ? 'bg-[#44403c] text-white border-[#44403c] shadow-sm' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'}`}>{cat}</button>)}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-2">
                    {filteredInventory.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-24 text-stone-400 space-y-6">
                            <div className="p-8 bg-stone-100 rounded-full border border-stone-200"><Archive size={64} strokeWidth={1} /></div>
                            <div className="text-center space-y-2">
                                <p className="font-bold text-stone-500">找不到符合條件的項目</p>
                                <button onClick={() => { setEditingInventoryId(null); setNewInventoryForm({ ...newInventoryForm, type: inventoryType, name: inventorySearchQuery, status: 'wishlist' }); setIsAddInventoryOpen(true); }} className="mt-4 px-6 py-3 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100 flex items-center gap-2 hover:bg-orange-100 transition-all shadow-sm active:scale-95"><Plus size={14} strokeWidth={3} /> 將此搜尋加入待買清單</button>
                            </div>
                        </div>
                    ) : (
                        filteredInventory.map(item => {
                            const isLowStock = item.type === 'yarn' && !item.isWishlist && item.lowStockThreshold > 0 && item.amount <= item.lowStockThreshold;
                            const isWip = getWipProjectsForItem(item.id, item.type).length > 0;
                            return (
                                <div key={item.id} onClick={() => setSelectedInventoryItem(item)} className="bg-white rounded-[2rem] p-3 shadow-sm border border-stone-100 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all active:scale-95 group">
                                    <div className="w-full aspect-square bg-stone-50 rounded-[1.5rem] flex items-center justify-center text-stone-200 relative overflow-hidden">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" /> : <ImageIcon size={32} className="opacity-50" />}
                                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
                                            {item.isWishlist ? <div className="bg-orange-100 text-orange-600 p-2 rounded-full shadow-sm backdrop-blur-sm border border-orange-200/50"><ShoppingCart size={12} strokeWidth={2.5} /></div> : isWip ? <div className="bg-amber-100 text-amber-600 p-2 rounded-full shadow-sm backdrop-blur-sm border border-amber-200/50 animate-pulse"><Play size={12} fill="currentColor" /></div> : <div className="bg-stone-100/80 text-stone-400 p-2 rounded-full shadow-sm backdrop-blur-sm border border-stone-200/50 opacity-0 group-hover:opacity-100 transition-opacity"><Archive size={12} strokeWidth={2.5} /></div>}
                                        </div>
                                    </div>
                                    <div className="px-1.5 space-y-1">
                                        <h4 className="font-black text-stone-800 text-sm truncate leading-tight">{item.name}</h4>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-stone-400 truncate pr-2 uppercase tracking-tighter">{item.type === 'yarn' ? `${item.brand !== '未指定' ? item.brand : ''}` : `${item.toolSubtype || item.toolType}`}</span>
                                            <span className={`font-mono text-xs font-black flex items-center gap-1 ${isLowStock ? 'text-red-500' : 'text-[#926c44]'}`}>{isLowStock && <AlertTriangle size={12} strokeWidth={2.5} />}{item.amount}{item.type === 'yarn' ? 'g' : '件'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="absolute bottom-20 right-6 z-40 flex flex-col items-end gap-4 pointer-events-auto">
                    {isFabMenuOpen && (
                        <div className="flex flex-col items-end gap-3 animate-slide-up origin-bottom">
                            <button onClick={() => { setIsFabMenuOpen(false); setEditingInventoryId(null); setNewInventoryForm({ ...newInventoryForm, status: 'wishlist', type: inventoryType, name: '' }); setIsAddInventoryOpen(true); }} className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-xl border border-orange-100 text-orange-600 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">新增待買清單 <ShoppingCart size={16} /></button>
                            <button onClick={() => { setIsFabMenuOpen(false); setEditingInventoryId(null); setNewInventoryForm({ ...newInventoryForm, status: 'idle', type: inventoryType, name: '' }); setIsAddInventoryOpen(true); }} className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-xl border border-stone-200 text-[#926c44] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">新增現有庫存 <Archive size={16} /></button>
                        </div>
                    )}
                    <button onClick={() => setIsFabMenuOpen(!isFabMenuOpen)} className={`w-16 h-16 bg-[#926c44] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isFabMenuOpen ? 'rotate-45 bg-stone-500' : ''}`}><Plus size={32} strokeWidth={3} /></button>
                </div>
            </div>

            {/* 庫存篩選 Modal */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-stone-900/60 backdrop-blur-md transition-all duration-500 pointer-events-auto">
                    <div className="bg-[#faf8f6] w-full max-w-md mx-auto rounded-t-[2.5rem] shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-8 pb-4 shrink-0">
                            <h3 className="text-xl font-black text-stone-800 tracking-tight flex items-center gap-2 uppercase italic"><Filter size={24} className="text-[#926c44]" /> {inventoryType === 'yarn' ? 'Yarn Filter' : 'Tool Filter'}</h3>
                            <button onClick={() => setIsFilterOpen(false)} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-2.5 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 pt-4 overflow-y-auto space-y-8 pb-24 no-scrollbar">
                            <p className="text-xs font-bold text-stone-400 text-center">進階篩選選項...</p>
                        </div>
                        <div className="absolute bottom-0 w-full px-6 py-3.5 bg-white/80 backdrop-blur-md border-t border-stone-100 flex gap-3">
                            <button onClick={() => { if (inventoryType === 'yarn') { setYarnFilters({ sortBy: 'date_desc', hues: [], styles: [], weights: [], lengthRange: 'all', status: 'all' }); } else { setToolFilters({ mainCategory: '全部', types: [], jointSizes: [], materials: [], statuses: [] }); } }} className="flex-1 py-2.5 bg-stone-100 text-stone-500 rounded-full font-black uppercase tracking-widest text-xs active:scale-95 transition-all">重置篩選</button>
                            <button onClick={() => setIsFilterOpen(false)} className="flex-[2] bg-[#926c44] text-white py-2.5 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-[#926c44]/30 active:scale-95 transition-all flex items-center justify-center gap-2">套用篩選 ({filteredInventory.length})</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 庫存新增/編輯 Modal */}
            {isAddInventoryOpen && (
                <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-stone-900/60 backdrop-blur-md p-0 md:p-6 transition-opacity pointer-events-auto">
                    <div className="bg-white w-full max-w-md mx-auto rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-8 pb-4 border-b border-stone-100 shrink-0">
                            <h3 className="text-lg font-black text-stone-800 tracking-tight uppercase italic">{editingInventoryId ? 'Edit' : 'Add'} {newInventoryForm.type === 'yarn' ? 'Yarn' : 'Tool'} {newInventoryForm.status === 'wishlist' ? 'Wish' : ''}</h3>
                            <button onClick={() => { setIsAddInventoryOpen(false); setEditingInventoryId(null); setIsEnteringImageUrl(false); }} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-2.5 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 pt-4 overflow-y-auto space-y-5 pb-12 no-scrollbar">
                            {isEnteringImageUrl ? (
                                <div className="h-24 mb-2 flex flex-col justify-center bg-stone-50 border-2 border-dashed border-amber-200 rounded-2xl p-3 gap-2 relative transition-all">
                                    <div className="flex items-center gap-2 h-full">
                                        <Link size={18} className="text-amber-500 shrink-0 ml-1" />
                                        <input autoFocus type="url" placeholder="輸入圖片網址 (URL)..." value={newInventoryForm.image || ''} onChange={e => setNewInventoryForm({ ...newInventoryForm, image: e.target.value })} className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-xs text-stone-700 outline-none focus:border-amber-300 shadow-sm" />
                                        <button onClick={() => setIsEnteringImageUrl(false)} className="bg-[#926c44] text-white p-2.5 rounded-lg shadow-sm hover:bg-[#7a5937] transition-colors"><Check size={16} strokeWidth={3} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3 h-24 mb-2">
                                    <label className="flex-1 flex flex-col items-center justify-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 cursor-pointer transition-all">
                                        {newInventoryForm.image ? <img src={newInventoryForm.image} className="w-full h-full object-cover rounded-xl" /> : <><Camera size={24} className="mb-1" /><span className="text-[10px] font-black uppercase">Upload</span></>}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                    <button onClick={() => setIsEnteringImageUrl(true)} className="flex-1 flex flex-col items-center justify-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all">
                                        <Link size={24} className="mb-1" /><span className="text-[10px] font-black uppercase">URL</span>
                                    </button>
                                </div>
                            )}
                            <div><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">名稱</label><input type="text" value={newInventoryForm.name} onChange={e => setNewInventoryForm({ ...newInventoryForm, name: e.target.value })} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-stone-700 outline-none text-sm font-bold" /></div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => { setIsAddInventoryOpen(false); setIsEnteringImageUrl(false); }} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-full font-black uppercase tracking-widest text-xs active:scale-95 transition-all">取消</button>
                                <button onClick={handleSaveInventory} className="flex-[2] bg-[#44403c] text-white py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-stone-800/20 active:scale-95 transition-all">儲存變更</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 庫存詳情 Modal */}
            {selectedInventoryItem && (
                <div className="fixed inset-0 z-[110] flex flex-col justify-end bg-stone-900/40 backdrop-blur-sm transition-opacity pointer-events-auto" onClick={() => setSelectedInventoryItem(null)}>
                    <div className="bg-[#faf8f6] w-full max-w-md mx-auto rounded-t-[2.5rem] p-8 pb-12 shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 bg-stone-200 rounded-3xl flex items-center justify-center text-stone-400 overflow-hidden border border-stone-100 shadow-sm">
                                    {selectedInventoryItem.image ? <img src={selectedInventoryItem.image} className="w-full h-full object-cover" /> : <ImageIcon size={32} />}
                                </div>
                                <div className="pt-1">
                                    <div className="flex gap-2 mb-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-stone-800 text-white rounded-md">{selectedInventoryItem.type === 'yarn' ? 'Yarn' : 'Tool'}</span>
                                        {selectedInventoryItem.isWishlist && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-orange-100 text-orange-600 rounded-md">Wishlist</span>}
                                    </div>
                                    <h2 className="text-xl font-black text-stone-800 tracking-tight leading-tight">{selectedInventoryItem.name}</h2>
                                    <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{selectedInventoryItem.brand}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInventoryItem(null)} className="p-2 bg-stone-100 rounded-full text-stone-400"><X size={20} /></button>
                        </div>

                        {selectedInventoryItem.isWishlist ? (
                            <button onClick={() => { setSelectedInventoryItem(null); setEditingInventoryId(selectedInventoryItem.id); setNewInventoryForm({ ...selectedInventoryItem, status: 'idle', isWishlist: false }); setIsAddInventoryOpen(true); }} className="w-full bg-[#926c44] text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#926c44]/30 active:scale-95 transition-all flex items-center justify-center gap-3"><Archive size={18} /> 加入庫存庫</button>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <button onClick={() => setIsQRModalOpen(true)} className="flex-1 bg-white border border-stone-200 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-stone-600 flex items-center justify-center gap-2 active:scale-95 transition-all"><QrCode size={14} /> 下載標籤</button>
                                    <button onClick={() => { setSelectedInventoryItem(null); setEditingInventoryId(selectedInventoryItem.id); setNewInventoryForm({ ...selectedInventoryItem, status: (getWipProjectsForItem(selectedInventoryItem.id, selectedInventoryItem.type).length > 0) ? 'wip' : 'idle' }); setIsAddInventoryOpen(true); }} className="flex-1 bg-white border border-stone-200 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-stone-600 flex items-center justify-center gap-2 active:scale-95 transition-all"><Pencil size={14} /> 編輯資料</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* QR Code 標籤 Modal */}
            {isQRModalOpen && selectedInventoryItem && (
                <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-stone-900/80 backdrop-blur-sm p-6 animate-fade-in pointer-events-auto" onClick={() => setIsQRModalOpen(false)}>
                    <div className="bg-white w-full max-w-[280px] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="h-4 bg-[#926c44] w-full" />
                        <div className="p-6 flex flex-col items-center">
                            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-[#926c44] mb-4 shadow-inner"><QrCode size={36} strokeWidth={2} /></div>
                            <h2 className="text-xl font-black text-stone-800 text-center leading-tight mb-1">{selectedInventoryItem.name}</h2>
                            <div className="w-full flex gap-3 mt-6">
                                <button onClick={() => setIsQRModalOpen(false)} className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">關閉</button>
                                <button onClick={() => { setIsDownloadingQR(true); setTimeout(() => { setIsDownloadingQR(false); setIsQRModalOpen(false); }, 1500); }} disabled={isDownloadingQR} className={`flex-[2] py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${isDownloadingQR ? 'bg-green-500 text-white' : 'bg-[#44403c] text-white'}`}>
                                    {isDownloadingQR ? <><Check size={14} /> 已儲存</> : <><Download size={14} /> 儲存標籤</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}