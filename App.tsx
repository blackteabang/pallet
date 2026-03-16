
import React, { useState, useEffect, useMemo } from 'react';
import { Pallet, MonitorGrade, PowerType, FilterOptions, MonitorItem } from './types';
import { STORAGE_KEY } from './constants';
import Dashboard from './components/Dashboard';
import PalletList from './components/PalletList';
import PalletForm from './components/PalletForm';
import ManifestView from './components/ManifestView';
import Header from './components/Header';
import { getInventoryInsights } from './geminiService';

const App: React.FC = () => {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [view, setView] = useState<'dashboard' | 'list' | 'add' | 'manifest'>('dashboard');
  const [selectedPalletId, setSelectedPalletId] = useState<string | null>(null);
  const [insights, setInsights] = useState<string>('재고 현황을 분석하고 있습니다...');

  // 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPallets(JSON.parse(saved));
    }
  }, []);

  // 데이터 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pallets));
  }, [pallets]);

  // AI 인사이트 생성
  useEffect(() => {
    if (pallets.length > 0) {
      const fetchInsights = async () => {
        const text = await getInventoryInsights(pallets);
        setInsights(text || '현재 분석 가능한 특이사항이 없습니다.');
      };
      fetchInsights();
    } else {
      setInsights('등록된 팔레트 데이터가 없어 분석이 불가능합니다.');
    }
  }, [pallets]);

  const addOrUpdatePallet = (pallet: Pallet) => {
    setPallets(prev => {
      const index = prev.findIndex(p => p.id === pallet.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = pallet;
        return updated;
      }
      return [pallet, ...prev];
    });
    setView('list');
  };

  const updatePallet = (id: string, updates: Partial<Pallet>) => {
    setPallets(prev => prev.map(p => p.id === id ? { ...p, ...updates, lastUpdated: new Date().toLocaleString() } : p));
  };

  const deletePallet = (id: string) => {
    if (window.confirm('선택한 팔레트 정보를 영구적으로 삭제하시겠습니까?')) {
      setPallets(prev => prev.filter(p => p.id !== id));
    }
  };

  const selectedPallet = useMemo(() => 
    pallets.find(p => p.id === selectedPalletId), 
  [pallets, selectedPalletId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header 
        className="no-print sticky top-0 z-50" 
        currentView={view} 
        setView={setView} 
      />
      
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
        {view === 'dashboard' && (
          <Dashboard 
            pallets={pallets} 
            insights={insights} 
            onViewList={() => setView('list')} 
          />
        )}

        {view === 'list' && (
          <PalletList 
            pallets={pallets} 
            onEdit={(id) => { setSelectedPalletId(id); setView('add'); }}
            onUpdatePallet={updatePallet}
            onDelete={deletePallet}
            onPrint={(id) => { setSelectedPalletId(id); setView('manifest'); }}
            onAddNew={() => { setSelectedPalletId(null); setView('add'); }}
          />
        )}

        {view === 'add' && (
          <PalletForm 
            initialPallet={selectedPallet} 
            onSave={addOrUpdatePallet}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'manifest' && selectedPallet && (
          <ManifestView 
            pallet={selectedPallet} 
            onBack={() => setView('list')} 
          />
        )}
      </main>

      <footer className="no-print py-6 text-center text-slate-400 text-xs border-t border-slate-200 bg-white mt-auto">
        &copy; 2024 Monitor Management System - Pallet Based Inventory Control
      </footer>
    </div>
  );
};

export default App;
