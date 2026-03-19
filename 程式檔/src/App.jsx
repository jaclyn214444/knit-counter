import React, { useState } from 'react';
import {
    FolderOpen, Archive, BarChart2,
} from 'lucide-react';
import { useLocalStorage, createDefaultCounter } from './utils/helpers';
import ProjectList from './components/ProjectList';
import InventoryManager from './components/InventoryManager';
import Workspace from './components/Workspace';

export default function App() {
    const [activeTab, setActiveTab] = useLocalStorage('knit-app-tab', 'projects');

    // 建立全域狀態
    const [inventory, setInventory] = useLocalStorage('knit-app-inventory', [
        { id: 101, type: 'yarn', name: '美麗諾羊毛線 (米白)', amount: 40, originalAmount: 200, weight: '3 Light', isWishlist: false, image: null, timestamp: Date.now() }
    ]);

    const [projects, setProjects] = useLocalStorage('knit-app-projects', [
        { id: 1, name: '初學者圍巾', method: '棒針', mode: '自由模式', status: '進行中', progress: 15, timeSpent: 0, lastEdited: Date.now(), yarns: [101], tools: [], counterA: createDefaultCounter('宏觀 / 段數', 5), counterB: createDefaultCounter('微觀 / 針數', 24) }
    ]);

    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
    const isWorkspaceMode = activeWorkspaceId !== null;
    const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-stone-100 flex justify-center font-sans selection:bg-amber-200 selection:text-amber-900">
            <div className="w-full max-w-md bg-[#faf8f6] text-[#44403c] relative flex flex-col shadow-2xl h-[100dvh] overflow-hidden">
                <style dangerouslySetInnerHTML={{
                    __html: `
          .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; } 
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } 
          .no-scrollbar::-webkit-scrollbar { display: none; } 
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } 
          .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; } 
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        `}} />

                <main className="flex-1 overflow-y-auto relative z-10 no-scrollbar">
                    {activeTab === 'projects' && !isWorkspaceMode && <ProjectList projects={projects} setProjects={setProjects} inventory={inventory} setActiveWorkspaceId={setActiveWorkspaceId} setIsAnyModalOpen={setIsAnyModalOpen} />}
                    {activeTab === 'inventory' && !isWorkspaceMode && <InventoryManager inventory={inventory} setInventory={setInventory} projects={projects} setIsAnyModalOpen={setIsAnyModalOpen} />}
                    {activeTab === 'stats' && !isWorkspaceMode && <div className="p-6 text-center text-stone-400 mt-20"><BarChart2 size={48} className="mx-auto mb-4" />統計開發中</div>}
                </main>

                <nav className={`absolute bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-stone-200 shadow-2xl z-50 transition-transform duration-500 ${(isWorkspaceMode || isAnyModalOpen) ? 'translate-y-full' : 'translate-y-0'}`}>
                    <ul className="flex justify-around items-center h-16">
                        {['projects', 'inventory', 'stats'].map((tab) => {
                            const icons = { projects: FolderOpen, inventory: Archive, stats: BarChart2 };
                            const Icon = icons[tab];
                            return (
                                <li key={tab} className="flex-1">
                                    <button onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center w-full space-y-1 transition-all ${activeTab === tab ? 'text-[#926c44]' : 'text-stone-400'}`}>
                                        <Icon size={22} strokeWidth={activeTab === tab ? 3 : 2} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{{ projects: '專案', inventory: '庫存', stats: '統計' }[tab]}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {isWorkspaceMode && <Workspace projectId={activeWorkspaceId} projects={projects} setProjects={setProjects} inventory={inventory} onClose={() => setActiveWorkspaceId(null)} />}
            </div>
        </div>
    );
}
