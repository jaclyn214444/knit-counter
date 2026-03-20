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
import {
    YARN_HUES, YARN_DYE_STYLES, YARN_WEIGHTS,
    TOOL_SCHEMA, TOOL_JOINT_SIZES, TOOL_MATERIALS
} from '../utils/constants';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

export default function InventoryManager({ inventory, setInventory, projects, setIsAnyModalOpen }) {
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
    const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
    const qrRef = useRef(null);

    const [newInventoryForm, setNewInventoryForm] = useState({
        type: 'yarn', name: '', amount: '', originalAmount: '', totalLength: '', lowStockThreshold: '', status: 'idle', boundProjectId: '',
        weight: '3 Light', hue: '白色/米色', dyeStyle: '單色 (Solid)', colorCode: '',
        toolCategory: '針具類', toolType: '棒針', toolSubtype: '固定式輪針',
        material: '未指定', jointSize: '未指定', length: '未指定', brand: '',
        needleSizeValue: '', needleSizeUnit: 'mm', image: '',
        fiberContent: '', suggestedNeedles: '', gauge: '', purchaseSource: '店家', price: '', currency: 'TWD', tags: [], colorName: ''
    });

    const getWipProjectsForItem = useCallback((itemId, type) => {
        return projects.filter(p => p.status !== '已完成' && (type === 'yarn' ? (p.yarns && p.yarns.includes(itemId)) : (p.tools && p.tools.includes(itemId))));
    }, [projects]);

    useEffect(() => {
        if (setIsAnyModalOpen) {
            setIsAnyModalOpen(isFilterOpen || isAddInventoryOpen || !!selectedInventoryItem || isQRModalOpen);
        }
    }, [isFilterOpen, isAddInventoryOpen, selectedInventoryItem, isQRModalOpen, setIsAnyModalOpen]);

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

    const handleMoveToInventory = (item) => {
        setSelectedInventoryItem(null);
        setEditingInventoryId(item.id);
        setNewInventoryForm({ ...item, status: 'idle', isWishlist: false });
        setIsAddInventoryOpen(true);
    };

    const handleDownloadQR = async () => {
        if (!qrRef.current || !selectedInventoryItem) return;
        setIsDownloadingQR(true);
        try {
            const dataUrl = await toPng(qrRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `${selectedInventoryItem.name}_標籤.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('QR下載失敗:', err);
        } finally {
            setTimeout(() => {
                setIsDownloadingQR(false);
                setIsQRModalOpen(false);
            }, 800);
        }
    };

    const handleDeleteInventory = (id) => {
        if (!window.confirm('確定要刪除此庫存嗎？')) return;
        setInventory(prev => prev.filter(item => item.id !== id));
        setSelectedInventoryItem(null);
        setIsDetailMenuOpen(false);
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

// --- 介面渲染組件 (庫存) ---
  const renderInventoryContent = () => {
    return (
      <div className="p-6 flex flex-col space-y-4 pb-28 min-h-full">
        {/* 第一層：標題與功能按鈕 (極簡版) */}
        <div className="flex justify-between items-center min-h-[40px] mt-2">
          {isSearchExpanded ? (
            <div className="flex-1 flex items-center bg-white border border-stone-200 rounded-full px-4 py-1.5 mr-2 shadow-sm animate-fade-in ring-2 ring-amber-100/50">
              <Search size={14} className="text-stone-400 mr-2" />
              <input 
                autoFocus
                type="text" 
                placeholder="搜尋..." 
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                onBlur={() => !inventorySearchQuery && setIsSearchExpanded(false)}
                className="flex-1 bg-transparent border-none outline-none text-xs text-stone-700 py-0"
              />
              {inventorySearchQuery && (
                <button onClick={() => {setInventorySearchQuery(''); setIsSearchExpanded(false);}} className="text-stone-300 hover:text-stone-500 transition-colors">
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>
          ) : (
            <h2 className="text-xl font-black tracking-tight text-stone-800 animate-fade-in flex items-center gap-2">
              {inventoryType === 'yarn' ? '🧶 毛線庫存' : '🛠️ 工具箱'}
            </h2>
          )}
          
          <div className="flex gap-1.5 shrink-0">
            {!isSearchExpanded && (
              <button 
                onClick={() => setIsSearchExpanded(true)} 
                className="p-2.5 bg-white text-[#926c44] rounded-full shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors active:scale-95"
              >
                <Search size={18} strokeWidth={2.5} />
              </button>
            )}
            <button 
              onClick={() => setIsFilterOpen(true)} 
              className={`p-2.5 rounded-full shadow-sm border transition-all active:scale-90 ${Object.values(inventoryType === 'yarn' ? yarnFilters : toolFilters).some(v => Array.isArray(v) ? v.length > 0 : v !== 'all' && v !== 'date_desc' && v !== '全部') ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white border-stone-100 text-[#926c44]'}`}
            >
              <Filter size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 第二層：合併類別切換與視角切換 (膠囊化合併列) */}
        <div className="flex justify-between items-center gap-4">
          {/* 主分類 (毛線/工具) */}
          <div className="flex bg-stone-200/50 p-0.5 rounded-xl border border-stone-200">
            <button onClick={() => setInventoryType('yarn')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${inventoryType === 'yarn' ? 'bg-white shadow-sm text-[#926c44]' : 'text-stone-400'}`}>毛線</button>
            <button onClick={() => setInventoryType('tool')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${inventoryType === 'tool' ? 'bg-white shadow-sm text-[#926c44]' : 'text-stone-400'}`}>工具</button>
          </div>

          {/* 視角 (擁有/待買) - 縮小膠囊 */}
          <div className="inline-flex bg-stone-200/50 p-0.5 rounded-full border border-stone-200 shadow-inner shrink-0">
            <button 
              onClick={() => setBaseFilter('owned')} 
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${baseFilter === 'owned' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-500'}`}
            >
              我的擁有
            </button>
            <button 
              onClick={() => setBaseFilter('wishlist')} 
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${baseFilter === 'wishlist' ? 'bg-[#926c44] shadow-sm text-white' : 'text-stone-400 hover:text-stone-500'}`}
            >
              待買
            </button>
          </div>
        </div>

        {/* 工具子分類 (進一步微縮高度) */}
        {inventoryType === 'tool' && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-6 px-6 no-scrollbar">
            {['全部', '棒針', '鉤針', '配件'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setToolFilters({...toolFilters, mainCategory: cat})} 
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${toolFilters.mainCategory === cat ? 'bg-[#44403c] text-white border-[#44403c] shadow-sm' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 庫存列表 (空間釋放後更寬廣) */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {filteredInventory.length === 0 ? (() => {
            const hasYarnFilters = yarnFilters.hues.length > 0 || yarnFilters.styles.length > 0 || yarnFilters.weights.length > 0 || yarnFilters.lengthRange !== 'all' || yarnFilters.status !== 'all';
            const hasToolFilters = toolFilters.mainCategory !== '全部' || toolFilters.types.length > 0 || toolFilters.jointSizes.length > 0 || toolFilters.materials.length > 0 || toolFilters.statuses.length > 0;
            const hasActiveFilters = inventorySearchQuery.trim() !== '' || (inventoryType === 'yarn' ? hasYarnFilters : hasToolFilters);

            return (
              <div className="col-span-2 flex flex-col items-center justify-center py-24 text-stone-400 space-y-6">
                <div className="p-8 bg-stone-100 rounded-full border border-stone-200"><Archive size={64} strokeWidth={1} /></div>
                <div className="text-center space-y-2 flex flex-col items-center">
                  {hasActiveFilters ? (
                    <>
                      <p className="font-bold text-stone-500">找不到符合條件的項目</p>
                      <button onClick={() => { 
                        setEditingInventoryId(null); 
                        let form = {...newInventoryForm, type: inventoryType, name: inventorySearchQuery, status: 'wishlist'};
                        if (inventoryType === 'yarn') {
                          if (yarnFilters.hues.length > 0) form.hue = yarnFilters.hues[0];
                          if (yarnFilters.styles.length > 0) form.dyeStyle = yarnFilters.styles[0];
                          if (yarnFilters.weights.length > 0) form.weight = yarnFilters.weights[0];
                        } else {
                          if (toolFilters.mainCategory !== '全部') {
                            if (toolFilters.mainCategory === '配件') form.toolCategory = '配件類';
                            else { form.toolCategory = '針具類'; form.toolType = toolFilters.mainCategory; }
                          }
                          if (toolFilters.types.length > 0) form.toolSubtype = toolFilters.types[0];
                          if (toolFilters.jointSizes.length > 0) form.jointSize = toolFilters.jointSizes[0];
                          if (toolFilters.materials.length > 0) form.material = toolFilters.materials[0];
                        }
                        setNewInventoryForm(form);
                        setIsAddInventoryOpen(true); 
                      }} className="mt-4 px-6 py-3 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100 flex items-center justify-center gap-2 hover:bg-orange-100 transition-all shadow-sm active:scale-95"><Plus size={14} strokeWidth={3} /> 是該花點錢錢買道具囉!</button>
                    </>
                  ) : (
                    <p className="font-bold text-stone-500">是該花點錢錢買道具囉!</p>
                  )}
                </div>
              </div>
            );
          })() : (
            filteredInventory.map(item => {
              const isLowStock = item.type === 'yarn' && !item.isWishlist && item.lowStockThreshold > 0 && item.amount <= item.lowStockThreshold;
              const isWip = getWipProjectsForItem(item.id, item.type).length > 0;
              return (
                <div key={item.id} onClick={() => setSelectedInventoryItem(item)} className="bg-white rounded-[2rem] p-3 shadow-sm border border-stone-100 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all active:scale-95 group">
                  <div className="w-full aspect-square bg-stone-50 rounded-[1.5rem] flex items-center justify-center text-stone-200 relative overflow-hidden">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" /> : <ImageIcon size={32} className="opacity-50" />}
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
                      {item.isWishlist ? (
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-full shadow-sm backdrop-blur-sm border border-orange-200/50"><ShoppingCart size={12} strokeWidth={2.5} /></div>
                      ) : isWip ? (
                        <div className="bg-amber-100 text-amber-600 p-2 rounded-full shadow-sm backdrop-blur-sm border border-amber-200/50 animate-pulse"><Play size={12} fill="currentColor" /></div>
                      ) : (
                        <div className="bg-stone-100/80 text-stone-400 p-2 rounded-full shadow-sm backdrop-blur-sm border border-stone-200/50 opacity-0 group-hover:opacity-100 transition-opacity"><Archive size={12} strokeWidth={2.5} /></div>
                      )}
                    </div>
                    {item.type === 'yarn' && <div className="absolute top-2.5 left-2.5"><span className="w-4 h-4 rounded-full border-2 border-white shadow-md block" style={{ backgroundColor: item.hue?.includes('白') ? '#f3f4f6' : item.hue?.includes('黑') ? '#1f2937' : item.hue?.includes('紅') ? '#fca5a5' : item.hue?.includes('藍') ? '#93c5fd' : '#d1d5db' }}></span></div>}
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
    );
  };

  const renderFilterModal = () => {
    if (!isFilterOpen) return null;
    const matchCount = filteredInventory.length;
    const toggleMulti = (category, value) => {
      if (inventoryType === 'yarn') {
        setYarnFilters(prev => ({...prev, [category]: prev[category].includes(value) ? prev[category].filter(v => v !== value) : [...prev[category], value]}));
      } else {
        setToolFilters(prev => ({...prev, [category]: prev[category].includes(value) ? prev[category].filter(v => v !== value) : [...prev[category], value]}));
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-stone-900/60 backdrop-blur-md transition-all duration-500 pointer-events-auto">
        <div className="bg-[#faf8f6] w-full max-w-md mx-auto rounded-t-[2.5rem] shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
          <div className="flex justify-between items-center p-8 pb-4 shrink-0">
            <h3 className="text-xl font-black text-stone-800 tracking-tight flex items-center gap-2 uppercase italic"><Filter size={24} className="text-[#926c44]" /> {inventoryType === 'yarn' ? 'Yarn Filter' : 'Tool Filter'}</h3>
            <button onClick={() => setIsFilterOpen(false)} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-2.5 rounded-full transition-colors"><X size={20}/></button>
          </div>
          <div className="p-8 pt-4 overflow-y-auto space-y-8 pb-24 no-scrollbar">
            {inventoryType === 'yarn' && (
              <>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block flex items-center gap-2"><ArrowUpDown size={14} /> 排序方式 (Sort By)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ id: 'date_desc', label: '購入日期 (新➜舊)', icon: History }, { id: 'date_asc', label: '購入日期 (舊➜新)', icon: History }, { id: 'length_desc', label: '總長度 (多➜少)', icon: Ruler }, { id: 'length_asc', label: '總長度 (少➜多)', icon: Ruler }].map(sort => (
                      <button key={sort.id} onClick={() => setYarnFilters({...yarnFilters, sortBy: sort.id})} className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${yarnFilters.sortBy === sort.id ? 'bg-[#44403c] text-white border-[#44403c] shadow-md' : 'bg-white text-stone-500 border-stone-200'}`}>{sort.label}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">總長度區間 (Length Range)</label>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: 'all', label: '全部' }, { id: 'small', label: '配件 (<400m)' }, { id: 'medium', label: '單品 (400-1200m)' }, { id: 'large', label: '大型 (>1200m)' }].map(range => (
                      <button key={range.id} onClick={() => setYarnFilters({...yarnFilters, lengthRange: range.id})} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${yarnFilters.lengthRange === range.id ? 'bg-[#926c44] text-white border-[#926c44]' : 'bg-white text-stone-500 border-stone-200'}`}>{range.label}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">庫存狀態 (Status)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ id: 'all', label: '全部' }, { id: 'idle', label: '閒置中' }, { id: 'wip', label: '使用中' }, { id: 'finished', label: '已用完' }].map(s => (
                      <button key={s.id} onClick={() => setYarnFilters({...yarnFilters, status: s.id})} className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${yarnFilters.status === s.id ? 'bg-[#44403c] text-white border-[#44403c]' : 'bg-white text-stone-500 border-stone-200'}`}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <FilterSection title="色相分類 (Hues)" values={YARN_HUES} selected={yarnFilters.hues} onToggle={v => toggleMulti('hues', v)} />
                <FilterSection title="染色風格 (Styles)" values={YARN_DYE_STYLES} selected={yarnFilters.styles} onToggle={v => toggleMulti('styles', v)} />
                <FilterSection title="粗細 (Weights)" values={YARN_WEIGHTS} selected={yarnFilters.weights} onToggle={v => toggleMulti('weights', v)} />
              </>
            )}
            {inventoryType === 'tool' && (
              <>
                <FilterSection title="工具類型 (Types)" values={Object.values(TOOL_SCHEMA['針具類']).flat()} selected={toolFilters.types} onToggle={v => toggleMulti('types', v)} />
                <FilterSection title="相容接頭規格 (Joint Sizes)" values={TOOL_JOINT_SIZES} selected={toolFilters.jointSizes} onToggle={v => toggleMulti('jointSizes', v)} />
                <FilterSection title="材質 (Materials)" values={TOOL_MATERIALS} selected={toolFilters.materials} onToggle={v => toggleMulti('materials', v)} />
                <FilterSection title="使用狀態 (Statuses)" values={[{id: 'idle', label: '閒置中'}, {id: 'wip', label: '使用中'}]} selected={toolFilters.statuses} onToggle={v => toggleMulti('statuses', v)} isStatus />
              </>
            )}
          </div>
          <div className="absolute bottom-0 w-full p-5 bg-white/80 backdrop-blur-md border-t border-stone-100 flex gap-4">
            <button onClick={() => { if (inventoryType === 'yarn') { setYarnFilters({ sortBy: 'date_desc', hues: [], styles: [], weights: [], lengthRange: 'all', status: 'all' }); } else { setToolFilters({ mainCategory: '全部', types: [], jointSizes: [], materials: [], statuses: [] }); }}} className="flex-1 py-3 bg-stone-100 text-stone-500 rounded-full font-black uppercase tracking-widest text-xs active:scale-95 transition-all">重置篩選</button>
            <button onClick={() => setIsFilterOpen(false)} className="flex-[2] bg-[#926c44] text-white py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-[#926c44]/30 active:scale-95 transition-all flex items-center justify-center gap-2">套用篩選 ({matchCount})</button>
          </div>
        </div>
      </div>
    );
  };

  const FilterSection = ({ title, values, selected, onToggle, isStatus = false }) => (
    <div className="space-y-4">
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">{title}</label>
      <div className="flex flex-wrap gap-2">
        {values.map(val => {
          const id = typeof val === 'object' ? val.id : val;
          const label = typeof val === 'object' ? val.label : val;
          const isSelected = selected.includes(id);
          return (
            <button key={id} onClick={() => onToggle(id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-stone-800 text-white border-stone-800 shadow-sm' : 'bg-white text-stone-500 border-stone-200'}`}>{isSelected && <Check size={12} />}{label}</button>
          );
        })}
      </div>
    </div>
  );

  const renderAddInventoryModal = () => {
    if (!isAddInventoryOpen) return null;
    const isYarn = newInventoryForm.type === 'yarn';
    const activeProjects = projects.filter(p => p.status !== '已完成');

    const handleCategoryChange = (cat) => {
        const types = Object.keys(TOOL_SCHEMA[cat] || {});
        const firstType = types[0] || '';
        const firstSubtype = (TOOL_SCHEMA[cat][firstType] || [])[0] || '';
        setNewInventoryForm({ ...newInventoryForm, toolCategory: cat, toolType: firstType, toolSubtype: firstSubtype });
    };

    const handleTypeSubtypeChange = (val) => {
        const [t, s] = val.split('_');
        setNewInventoryForm({ ...newInventoryForm, toolType: t, toolSubtype: s });
    };

    const isCable = newInventoryForm.toolType === '輪針連接線' || newInventoryForm.toolSubtype?.includes('連接線');

    return (
      <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-stone-900/60 backdrop-blur-md p-0 md:p-6 transition-opacity pointer-events-auto">
        <div className="bg-white w-full max-w-md mx-auto rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up flex flex-col max-h-[90vh] relative">
          
          {/* 1. Header (Sticky) */}
          <div className="sticky top-0 z-10 bg-white flex justify-between items-center p-6 px-8 border-b border-stone-100 shrink-0 rounded-t-[2.5rem] md:rounded-t-[2.5rem]">
            <h3 className="text-xl font-black text-stone-800 tracking-tight">
              {editingInventoryId ? '編輯' : '新增'}{isYarn ? '毛線' : '工具'}
              {newInventoryForm.status === 'wishlist' && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md uppercase tracking-widest align-middle">Wishlist</span>}
            </h3>
            <button onClick={() => { setIsAddInventoryOpen(false); setEditingInventoryId(null); setIsEnteringImageUrl(false); }} className="w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-400 hover:text-stone-600 rounded-full transition-colors active:scale-95"><X size={16} strokeWidth={2.5} /></button>
          </div>
          
          <div className="p-6 px-8 pt-4 overflow-y-auto space-y-8 pb-32 no-scrollbar bg-[#faf8f6]">
            
            {/* 📸 2. 影像視覺區 (Media Section) */}
            <div className="space-y-3">
              <label className="w-full aspect-video bg-transparent border-2 border-dashed border-stone-300 rounded-[2rem] flex flex-col items-center justify-center text-stone-400 hover:bg-white hover:border-amber-300 hover:text-amber-500 cursor-pointer transition-all relative overflow-hidden group shadow-sm bg-white/50">
                {newInventoryForm.image ? (
                  <>
                    <img src={newInventoryForm.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera size={32} /></div>
                  </>
                ) : (
                  <>
                    <Camera size={36} className="mb-2 text-stone-300 group-hover:text-amber-400 transition-colors" strokeWidth={1.5} />
                    <span className="text-[10px] font-black tracking-widest uppercase text-stone-400 group-hover:text-amber-500 transition-colors">輕觸拍照或上傳</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              
              <div className="flex items-center bg-white border border-stone-200 rounded-2xl px-4 py-3.5 shadow-sm focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-50 transition-all">
                <Link size={16} className="text-stone-400 mr-2 shrink-0" />
                <input 
                  type="url" 
                  placeholder="或直接貼上網購圖片連結..." 
                  value={newInventoryForm.image || ''} 
                  onChange={e => setNewInventoryForm({...newInventoryForm, image: e.target.value})}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-stone-700 font-bold placeholder-stone-300"
                />
              </div>
            </div>

            {/* 共通欄位 - 管理設定 */}
            {newInventoryForm.status !== 'wishlist' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className={newInventoryForm.status === 'wip' ? 'col-span-1' : 'col-span-2'}>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">庫存狀態</label>
                    <div className="relative">
                      <select value={newInventoryForm.status} onChange={e => setNewInventoryForm({...newInventoryForm, status: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 text-stone-700 outline-none text-sm font-bold shadow-sm focus:border-amber-300 transition-colors appearance-none pr-8">
                        <option value="idle">閒置中</option>
                        <option value="wip">使用中 (WIP)</option>
                      </select>
                      <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                    </div>
                  </div>
                  {newInventoryForm.status === 'wip' && (
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">綁定專案</label>
                      <div className="relative">
                        <select value={newInventoryForm.boundProjectId} onChange={e => setNewInventoryForm({...newInventoryForm, boundProjectId: e.target.value})} className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-800 outline-none text-[11px] font-bold shadow-sm appearance-none pr-8">
                          <option value="">請選擇專案...</option>
                          {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-amber-500 pointer-events-none rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <hr className="border-stone-200 border-dashed" />

            {/* 🧶 3. 毛線表單排版細節 (Yarn Form Flow) */}
            {isYarn ? (
              <div className="space-y-8">
                {/* 第一區塊：基本辨識 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">品牌 (Brand)</label>
                      <input type="text" value={newInventoryForm.brand || ''} onChange={e => setNewInventoryForm({...newInventoryForm, brand: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-sm font-bold shadow-sm focus:border-amber-300" placeholder="例如: Daruma" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">系列 (Series)</label>
                      <input type="text" value={newInventoryForm.name} onChange={e => setNewInventoryForm({...newInventoryForm, name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-sm font-bold shadow-sm focus:border-amber-300" placeholder="例如: GENMOU" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">色號 (Color Code)</label>
                    <input type="text" value={newInventoryForm.colorCode || ''} onChange={e => setNewInventoryForm({...newInventoryForm, colorCode: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-sm font-bold shadow-sm focus:border-amber-300" placeholder="例如: #2 (Light Gray)" />
                  </div>
                </div>

                {/* 第二區塊：視覺與數量 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">色相 (Hue)</label>
                      <select value={newInventoryForm.hue} onChange={e => setNewInventoryForm({...newInventoryForm, hue: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-[11px] font-bold shadow-sm focus:border-amber-300 appearance-none pr-8">
                        {YARN_HUES.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">風格 (Dye Style)</label>
                      <select value={newInventoryForm.dyeStyle} onChange={e => setNewInventoryForm({...newInventoryForm, dyeStyle: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-[11px] font-bold shadow-sm focus:border-amber-300 appearance-none pr-8">
                        {YARN_DYE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">當前重量 (g)</label>
                      <input type="number" inputMode="decimal" value={newInventoryForm.amount} onChange={e => setNewInventoryForm({...newInventoryForm, amount: e.target.value, originalAmount: editingInventoryId ? newInventoryForm.originalAmount : e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-3 py-3.5 text-stone-700 outline-none text-xs font-bold shadow-sm focus:border-amber-300" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><AlertTriangle size={10} className="mb-0.5" /> 最低警示 (g)</label>
                      <input type="number" inputMode="decimal" value={newInventoryForm.lowStockThreshold} onChange={e => setNewInventoryForm({...newInventoryForm, lowStockThreshold: e.target.value})} className="w-full bg-red-50/50 border border-red-100 rounded-2xl px-3 py-3.5 text-red-600 outline-none text-xs font-bold shadow-sm focus:border-red-300 placeholder-red-200" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">預估長度 (m)</label>
                      <input type="number" inputMode="decimal" value={newInventoryForm.totalLength} onChange={e => setNewInventoryForm({...newInventoryForm, totalLength: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-3 py-3.5 text-stone-700 outline-none text-xs font-bold shadow-sm focus:border-amber-300" placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* 第三區塊：詳細規格 */}
                <div className="space-y-3 bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Settings size={80} /></div>
                  <div className="relative">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">線材粗細級別 (Weight)</label>
                    <select value={newInventoryForm.weight} onChange={e => setNewInventoryForm({...newInventoryForm, weight: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-xs font-bold focus:border-amber-300 appearance-none pr-8">
                      {YARN_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">纖維成份 (Fiber)</label>
                    <input type="text" value={newInventoryForm.fiberContent || ''} onChange={e => setNewInventoryForm({...newInventoryForm, fiberContent: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-xs font-bold focus:border-amber-300 placeholder-stone-300" placeholder="70% Wool, 30% Silk" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">建議針號</label>
                      <input type="text" value={newInventoryForm.suggestedNeedles || ''} onChange={e => setNewInventoryForm({...newInventoryForm, suggestedNeedles: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-xs font-bold focus:border-amber-300 placeholder-stone-300" placeholder="US 4-6" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">密度 (Gauge)</label>
                      <input type="text" value={newInventoryForm.gauge || ''} onChange={e => setNewInventoryForm({...newInventoryForm, gauge: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-xs font-bold focus:border-amber-300 placeholder-stone-300" placeholder="22 sts = 4&quot;" />
                    </div>
                  </div>
                </div>

                {/* 第四區塊：收納與警示 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1 relative">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">購入來源</label>
                      <select value={newInventoryForm.purchaseSource} onChange={e => setNewInventoryForm({...newInventoryForm, purchaseSource: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-[11px] font-bold shadow-sm focus:border-amber-300 appearance-none pr-6">
                        <option value="店家">店家</option>
                        <option value="網購">網購</option>
                        <option value="轉讓">轉讓</option>
                        <option value="其他">其他</option>
                      </select>
                      <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">價格</label>
                      <div className="flex bg-white border border-stone-200 rounded-2xl shadow-sm focus-within:border-amber-300 overflow-hidden">
                        <select value={newInventoryForm.currency} onChange={e => setNewInventoryForm({...newInventoryForm, currency: e.target.value})} className="bg-stone-50 border-r border-stone-100 text-stone-500 outline-none text-[11px] font-bold px-3 py-3.5 appearance-none cursor-pointer hover:bg-stone-100 transition-colors shrink-0">
                          <option value="TWD">NT$</option>
                          <option value="JPY">¥</option>
                          <option value="USD">$</option>
                        </select>
                        <input type="number" inputMode="decimal" value={newInventoryForm.price || ''} onChange={e => setNewInventoryForm({...newInventoryForm, price: e.target.value})} className="w-full px-3 py-3.5 text-stone-700 outline-none text-sm font-bold bg-transparent" placeholder="0" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags (標籤雲) */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm focus-within:border-amber-300 transition-colors">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Tag size={12}/> 標籤 (Tags)</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {(newInventoryForm.tags || []).map((tag, idx) => (
                        <span key={idx} className="bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                          {tag}
                          <button onClick={() => setNewInventoryForm({...newInventoryForm, tags: newInventoryForm.tags.filter((_, i) => i !== idx)})} className="text-stone-400 hover:text-stone-600 rounded-full bg-white ml-0.5"><X size={10} strokeWidth={3}/></button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        placeholder="多個標籤請按 Enter..." 
                        className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold min-w-[120px] placeholder-stone-300"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            if (!(newInventoryForm.tags || []).includes(e.target.value.trim())) {
                              setNewInventoryForm({...newInventoryForm, tags: [...(newInventoryForm.tags || []), e.target.value.trim()]});
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

            ) : (

              /* 🛠️ 4. 工具表單排版細節 (Tool Form Flow) */
              <div className="space-y-8">
                {/* 共通工具名稱 */}
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Tag size={12}/> 工具名稱 (Name)</label>
                  <input type="text" value={newInventoryForm.name} onChange={e => setNewInventoryForm({...newInventoryForm, name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-sm font-bold shadow-sm focus:border-amber-300 placeholder-stone-300" placeholder="例如: 紅色工具包" />
                </div>

                {/* 第一區塊：類別選擇 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">大類別</label>
                    <select value={newInventoryForm.toolCategory || '針具類'} onChange={e => handleCategoryChange(e.target.value)} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 text-stone-700 outline-none text-xs font-bold shadow-sm focus:border-amber-300 appearance-none pr-8">
                      {Object.keys(TOOL_SCHEMA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                  </div>
                  {newInventoryForm.toolCategory && TOOL_SCHEMA[newInventoryForm.toolCategory] && (
                    <div className="relative">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">具體類型</label>
                      <select value={`${newInventoryForm.toolType}_${newInventoryForm.toolSubtype}`} onChange={e => handleTypeSubtypeChange(e.target.value)} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 text-stone-700 outline-none text-xs font-bold shadow-sm focus:border-amber-300 appearance-none pr-8">
                        {Object.keys(TOOL_SCHEMA[newInventoryForm.toolCategory]).map(type => (
                          <optgroup key={type} label={type}>
                            {TOOL_SCHEMA[newInventoryForm.toolCategory][type].map(sub => (
                              <option key={`${type}_${sub}`} value={`${type}_${sub}`}>{sub}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                    </div>
                  )}
                </div>

                {/* 第二區塊：動態規格 */}
                <div className="p-5 bg-white border border-stone-100 rounded-[2rem] shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Settings size={14}/> 規格明細</h4>
                  
                  {isCable ? (
                    // 連接線表單
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1 relative">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">接頭 (Joint)</label>
                        <select value={newInventoryForm.jointSize} onChange={e => setNewInventoryForm({...newInventoryForm, jointSize: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 text-stone-700 outline-none text-[11px] font-bold focus:border-amber-300 appearance-none pr-6">
                          <option>未指定</option>
                          {TOOL_JOINT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronRight size={12} className="absolute right-2 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">線長 (Length)</label>
                        <input type="text" value={newInventoryForm.length || ''} onChange={e => setNewInventoryForm({...newInventoryForm, length: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 text-stone-700 outline-none text-[11px] font-bold focus:border-amber-300 placeholder-stone-300" placeholder="60cm" />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">顏色 (Color)</label>
                        <input type="text" value={newInventoryForm.colorName || ''} onChange={e => setNewInventoryForm({...newInventoryForm, colorName: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 text-stone-700 outline-none text-[11px] font-bold focus:border-amber-300 placeholder-stone-300" placeholder="透明紅" />
                      </div>
                    </div>
                  ) : (
                    // 其他針具/配件表單
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">品牌 (Brand)</label>
                        <input type="text" value={newInventoryForm.brand || ''} onChange={e => setNewInventoryForm({...newInventoryForm, brand: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-[11px] font-bold focus:border-amber-300 placeholder-stone-300" placeholder="LYKKE, ChiaoGoo..." />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">針號 Size (mm)</label>
                        <input type="text" value={newInventoryForm.needleSizeValue || ''} onChange={e => setNewInventoryForm({...newInventoryForm, needleSizeValue: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-[11px] font-bold focus:border-amber-300 placeholder-stone-300" placeholder="4.0, 5.0..." />
                      </div>
                      <div className="col-span-1 relative">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">材質 (Material)</label>
                        <select value={newInventoryForm.material} onChange={e => setNewInventoryForm({...newInventoryForm, material: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-[11px] font-bold focus:border-amber-300 appearance-none pr-8">
                          <option>未指定</option>
                          {TOOL_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronRight size={14} className="absolute right-3.5 bottom-3.5 text-stone-400 pointer-events-none rotate-90" />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">長度 (Length)</label>
                        <input type="text" value={newInventoryForm.length || ''} onChange={e => setNewInventoryForm({...newInventoryForm, length: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none text-[11px] font-bold focus:border-amber-300 placeholder-stone-300" placeholder="單頭/固定長度" />
                      </div>
                    </div>
                  )}
                </div>

                {/* 第三區塊：管理設定 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">當前數量 (件)</label>
                    <input type="number" inputMode="numeric" value={newInventoryForm.amount} onChange={e => setNewInventoryForm({...newInventoryForm, amount: e.target.value, originalAmount: editingInventoryId ? newInventoryForm.originalAmount : e.target.value})} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-700 outline-none text-sm font-bold shadow-sm focus:border-amber-300" placeholder="1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 flex items-center gap-1"><AlertTriangle size={10} className="mb-0.5" /> 最低警示數量</label>
                    <input type="number" inputMode="numeric" value={newInventoryForm.lowStockThreshold} onChange={e => setNewInventoryForm({...newInventoryForm, lowStockThreshold: e.target.value})} className="w-full bg-red-50/50 border border-red-100 rounded-2xl px-4 py-3.5 text-red-600 outline-none text-sm font-bold shadow-sm focus:border-red-300 placeholder-red-200" placeholder="0" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5.6. 底部動作列 (Sticky Footer) */}
          <div className="absolute bottom-0 w-full flex gap-3 p-5 px-6 bg-white/95 backdrop-blur-xl border-t border-stone-100 rounded-b-[2.5rem] md:rounded-b-[2.5rem] z-20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            <button onClick={() => {setIsAddInventoryOpen(false); setIsEnteringImageUrl(false);}} className="flex-[3] py-4 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all outline-none">
              取消
            </button>
            <button onClick={handleSaveInventory} className="flex-[7] bg-[#926c44] hover:bg-[#7a5937] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#926c44]/20 active:scale-95 transition-all outline-none">
              儲存變更
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryDetailModal = () => {
    if (!selectedInventoryItem) return null;
    const isYarn = selectedInventoryItem.type === 'yarn';
    const wipProjects = getWipProjectsForItem(selectedInventoryItem.id, selectedInventoryItem.type);
    const isWip = wipProjects.length > 0;
    const isLowStock = isYarn && !selectedInventoryItem.isWishlist && selectedInventoryItem.lowStockThreshold > 0 && selectedInventoryItem.amount <= selectedInventoryItem.lowStockThreshold;

    return (
      <div className="fixed inset-0 z-[110] flex flex-col justify-end bg-stone-900/40 backdrop-blur-sm transition-opacity pointer-events-auto" onClick={() => {setSelectedInventoryItem(null); setIsDetailMenuOpen(false);}}>
        <div className="bg-[#faf8f6] w-full max-w-md mx-auto rounded-t-[2.5rem] p-8 pb-12 shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up relative" onClick={e => { e.stopPropagation(); if (isDetailMenuOpen && !e.target.closest('.modal-menu-btn')) setIsDetailMenuOpen(false); }}>
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-stone-200 rounded-3xl flex items-center justify-center text-stone-400 overflow-hidden border border-stone-100 shadow-sm">{selectedInventoryItem.image ? <img src={selectedInventoryItem.image} className="w-full h-full object-cover" /> : <ImageIcon size={32} />}</div>
              <div className="pt-1"><div className="flex gap-2 mb-2"><span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-stone-800 text-white rounded-md">{isYarn ? 'Yarn' : 'Tool'}</span>{selectedInventoryItem.isWishlist && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-orange-100 text-orange-600 rounded-md">Wishlist</span>}</div><h2 className="text-xl font-black text-stone-800 tracking-tight leading-tight">{selectedInventoryItem.name}</h2><p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{selectedInventoryItem.brand}</p></div>
            </div>
            <div className="flex gap-2 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsDetailMenuOpen(!isDetailMenuOpen); }} 
                className="modal-menu-btn p-2 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition-colors"
               >
                <MoreVertical size={20}/>
              </button>
              <button onClick={() => {setSelectedInventoryItem(null); setIsDetailMenuOpen(false);}} className="p-2 bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors"><X size={20}/></button>
              {isDetailMenuOpen && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 w-36 z-50 animate-fade-in flex flex-col overflow-hidden">
                  <button onClick={() => { setIsDetailMenuOpen(false); setSelectedInventoryItem(null); setEditingInventoryId(selectedInventoryItem.id); setNewInventoryForm({...selectedInventoryItem, status: isWip ? 'wip' : 'idle'}); setIsAddInventoryOpen(true); }} className="px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 text-left flex items-center gap-3 transition-colors"><Edit3 size={16} className="text-stone-400"/> 編輯資料</button>
                  <button onClick={() => handleDeleteInventory(selectedInventoryItem.id)} className="px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 text-left flex items-center gap-3 border-t border-stone-100 transition-colors"><Trash2 size={16} className="text-red-400"/> 刪除庫存</button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className={`p-4 rounded-[1.5rem] border flex flex-col justify-center ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-white border-stone-100'}`}><span className="text-[9px] font-black uppercase text-stone-400 mb-1">{selectedInventoryItem.isWishlist ? '預計購買' : '目前庫存'}</span><span className={`font-mono text-xl font-black ${isLowStock ? 'text-red-600' : 'text-stone-700'}`}>{selectedInventoryItem.amount} <span className="text-xs opacity-50">{isYarn ? 'g' : 'pcs'}</span></span></div>
            <div className="bg-white p-4 rounded-[1.5rem] border border-stone-100 flex flex-col justify-center"><span className="text-[9px] font-black uppercase text-stone-400 mb-1">原始規格</span><span className="font-mono text-xl font-black text-stone-700">{selectedInventoryItem.originalAmount || selectedInventoryItem.amount} <span className="text-xs opacity-50">{isYarn ? 'g' : 'pcs'}</span></span></div>
            {isYarn && <div className="bg-white p-4 rounded-[1.5rem] border border-stone-100 flex flex-col justify-center"><span className="text-[9px] font-black uppercase text-stone-400 mb-1">預估總長度</span><span className="font-mono text-xl font-black text-stone-700">{selectedInventoryItem.totalLength || 0} <span className="text-xs opacity-50">m</span></span></div>}
            <div className="bg-white p-4 rounded-[1.5rem] border border-stone-100 flex flex-col justify-center"><span className="text-[9px] font-black uppercase text-stone-400 mb-1">主要分類</span><span className="font-black text-sm text-stone-700 truncate">{isYarn ? selectedInventoryItem.weight : selectedInventoryItem.toolSubtype}</span></div>
          </div>
          {selectedInventoryItem.isWishlist ? (
            <button onClick={() => handleMoveToInventory(selectedInventoryItem)} className="w-full bg-[#926c44] text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#926c44]/30 active:scale-95 transition-all flex items-center justify-center gap-3"><Archive size={18} /> 加入庫存庫 (Add to Inventory)</button>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2"><button onClick={() => setIsQRModalOpen(true)} className="w-full bg-white border border-stone-200 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-stone-600 flex items-center justify-center gap-2 active:scale-95 transition-all"><QrCode size={14}/> 下載標籤</button></div>
              <div className="p-5 bg-stone-50 rounded-[1.5rem] border border-stone-100"><h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2"><Tag size={12}/> 目前服役於</h4>{isWip ? (<div className="space-y-2">{wipProjects.map(p => (<div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-200 shadow-sm"><span className="font-bold text-stone-700 text-sm">{p.name}</span><span className="text-xs font-mono font-black text-amber-600">{p.progress}%</span></div>))}</div>) : <p className="text-xs text-stone-400 italic">目前閒置中，未綁定任何專案。</p>}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderInventoryContent()}
      {renderFilterModal()}
      {renderAddInventoryModal()}
      {renderInventoryDetailModal()}

      {/* QR Code 標籤 Modal */}
      {isQRModalOpen && selectedInventoryItem && (
        <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-stone-900/80 backdrop-blur-sm p-6 animate-fade-in pointer-events-auto" onClick={() => setIsQRModalOpen(false)}>
            <div className="bg-white w-full max-w-[280px] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div ref={qrRef} className="bg-white flex flex-col items-center pt-8 pb-6 px-6 relative">
                    <div className="absolute top-0 left-0 w-full h-4 bg-[#926c44]" />
                    <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center text-[#926c44] mb-5 shadow-sm border border-stone-100 p-2">
                        <QRCodeSVG 
                            value={JSON.stringify({ id: selectedInventoryItem.id, type: selectedInventoryItem.type })} 
                            size={100} 
                            level={"H"} 
                            fgColor="#44403c" 
                            bgColor="#ffffff" 
                            includeMargin={false}
                        />
                    </div>
                    <h2 className="text-xl font-black text-stone-800 text-center leading-tight mb-1">{selectedInventoryItem.name}</h2>
                    {selectedInventoryItem.brand && selectedInventoryItem.brand !== '未指定' && (
                        <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{selectedInventoryItem.brand}</p>
                    )}
                </div>
                <div className="px-6 pb-6 pt-2 flex flex-col items-center bg-stone-50 border-t border-stone-100">
                    <div className="w-full flex gap-3">
                        <button onClick={() => setIsQRModalOpen(false)} className="flex-1 py-3.5 bg-white border border-stone-200 text-stone-500 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">關閉</button>
                        <button onClick={handleDownloadQR} disabled={isDownloadingQR} className={`flex-[2] py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${isDownloadingQR ? 'bg-green-500 text-white' : 'bg-[#44403c] text-white'}`}>
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