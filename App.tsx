
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Pallet, MonitorGrade, PowerType, FilterOptions, MonitorItem } from './types';
import { STORAGE_KEY } from './constants';
import Dashboard from './components/Dashboard';
import PalletList from './components/PalletList';
import PalletForm from './components/PalletForm';
import ManifestView from './components/ManifestView';
import Header from './components/Header';
import { getInventoryInsights } from './geminiService';

const DB_NAME = 'pallet_manager_db';
const DB_VERSION = 1;
const KV_STORE = 'kv';
const PALLETS_KEY = 'pallets_v1';

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV_STORE)) {
        db.createObjectStore(KV_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const readKvFromDb = async (key: string): Promise<any | null> => {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(KV_STORE, 'readonly');
      const store = tx.objectStore(KV_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as any)?.value ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

const writeKvToDb = async (key: string, value: any) => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(KV_STORE, 'readwrite');
    const store = tx.objectStore(KV_STORE);
    store.put({ key, value, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const readPalletsFromDb = async (): Promise<Pallet[] | null> => {
  try {
    const value = await readKvFromDb(PALLETS_KEY);
    if (!Array.isArray(value)) return null;
    return value.map((p: any) => ({
      ...p,
      location: typeof p?.location === 'string' ? p.location : '',
    }));
  } catch {
    return null;
  }
};

const writePalletsToDb = async (pallets: Pallet[]) => {
  const trimmed = pallets.slice(0, 300);
  await writeKvToDb(PALLETS_KEY, trimmed);
};

const readPalletsFromFile = async (): Promise<Pallet[] | null> => {
  try {
    const res = await fetch('/api/pallets');
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const pallets = Array.isArray(data?.pallets) ? data.pallets : null;
    if (!pallets) return null;
    return pallets.map((p: any) => ({
      ...p,
      location: typeof p?.location === 'string' ? p.location : '',
    }));
  } catch {
    return null;
  }
};

const writePalletsToFile = async (pallets: Pallet[]) => {
  const trimmed = pallets.slice(0, 300);
  await fetch('/api/pallets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pallets: trimmed }),
  });
};

const App: React.FC = () => {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [view, setView] = useState<'dashboard' | 'list' | 'add' | 'manifest'>('dashboard');
  const [selectedPalletId, setSelectedPalletId] = useState<string | null>(null);
  const [insights, setInsights] = useState<string>('재고 현황을 분석하고 있습니다...');
  const lastPersistedRef = useRef<string>('');
  const hydratedRef = useRef(false);

  const persistNow = (next: Pallet[]) => {
    const trimmed = next.slice(0, 300);
    const serialized = JSON.stringify(trimmed);
    if (serialized === lastPersistedRef.current) return;
    lastPersistedRef.current = serialized;

    localStorage.setItem(STORAGE_KEY, serialized);
    writePalletsToDb(trimmed).catch(() => {});
    writePalletsToFile(trimmed).catch(() => {});
  };

  // 데이터 로드
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const fromFile = await readPalletsFromFile();
        if (mounted && fromFile) {
          lastPersistedRef.current = JSON.stringify(fromFile.slice(0, 300));
          setPallets(fromFile);
          writePalletsToDb(fromFile).catch(() => {});
          return;
        }

        const fromDb = await readPalletsFromDb();
        if (mounted && fromDb) {
          lastPersistedRef.current = JSON.stringify(fromDb.slice(0, 300));
          setPallets(fromDb);
          return;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved) as unknown;
        if (!Array.isArray(parsed)) return;

        const normalized = parsed.map((p: any) => ({
          ...p,
          location: typeof p?.location === 'string' ? p.location : '',
        }));
        lastPersistedRef.current = JSON.stringify(normalized.slice(0, 300));
        if (mounted) setPallets(normalized);
        writePalletsToDb(normalized).catch(() => {});
      } finally {
        hydratedRef.current = true;
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    persistNow(pallets);
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
        persistNow(updated);
        return updated;
      }
      const next = [pallet, ...prev];
      persistNow(next);
      return next;
    });
    setSelectedPalletId(null);
    setView('list');
  };

  const updatePallet = (id: string, updates: Partial<Pallet>) => {
    setPallets(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates, lastUpdated: new Date().toLocaleString() } : p);
      persistNow(next);
      return next;
    });
  };

  const deletePallet = (id: string) => {
    if (window.confirm('선택한 팔레트 정보를 영구적으로 삭제하시겠습니까?')) {
      setPallets(prev => {
        const next = prev.filter(p => p.id !== id);
        persistNow(next);
        return next;
      });
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
            selectedPallet={selectedPallet}
            onEdit={(id) => { setSelectedPalletId(id); setView('add'); }}
            onUpdatePallet={updatePallet}
            onDelete={deletePallet}
            onPrint={(id) => { setSelectedPalletId(id); setView('manifest'); }}
            onAddNew={() => { setSelectedPalletId(null); setView('add'); }}
          />
        )}

        {view === 'add' && (
          <PalletForm
            initialPallet={selectedPallet || undefined}
            onSave={addOrUpdatePallet}
            onCancel={() => { setSelectedPalletId(null); setView('list'); }}
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
