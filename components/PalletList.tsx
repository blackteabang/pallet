
// 이 화면은 '팔레트 재고 현황' 목록입니다.
// - 위쪽에서 검색/필터를 고르고
// - 가운데에서 목록을 보고
// - 필요한 버튼(인쇄/수정/삭제)을 눌러요.
import React, { useState, useMemo } from 'react';
import { Pallet, MonitorGrade, MonitorItem, PowerType } from '../types';
import { DEPARTMENTS, BRANDS, INCHES } from '../constants';
import PalletForm from './PalletForm';

interface PalletListProps {
  pallets: Pallet[];
  isAdding?: boolean;
  selectedPallet?: Pallet | null;
  onEdit: (id: string) => void;
  onUpdatePallet: (id: string, updates: Partial<Pallet>) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void;
  onAddNew: () => void;
  onSave?: (pallet: Pallet) => void;
  onCancel?: () => void;
}

const PalletList: React.FC<PalletListProps> = ({
  pallets,
  isAdding = false,
  selectedPallet,
  onEdit,
  onUpdatePallet,
  onDelete,
  onPrint,
  onAddNew,
  onSave,
  onCancel
}) => {
  const [filter, setFilter] = useState({
    dept: '',
    brand: '',
    grade: '',
    palletId: '',
    customer: '',
    location: '',
    inch: '',
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filter).reduce((count, [, value]) => (String(value).trim() ? count + 1 : count), 0);
  }, [filter]);

  // 선택한 조건에 맞는 데이터만 골라 보여줍니다.
  const filteredPallets = useMemo(() => {
    const palletIdQuery = filter.palletId.trim().toLowerCase();
    const customerQuery = filter.customer.trim().toLowerCase();
    const locationQuery = filter.location.trim().toLowerCase();

    return pallets.filter(p => {
      const matchDept = !filter.dept || p.department === filter.dept;
      const matchBrand = !filter.brand || p.items.some(i => i.brand === filter.brand);
      const matchGrade = !filter.grade || p.items.some(i => i.grade === filter.grade);
      const matchInch = !filter.inch || p.items.some(i => i.inch === filter.inch);
      const matchPalletId = !palletIdQuery || String(p.id).toLowerCase().includes(palletIdQuery);
      const matchCustomer = !customerQuery || String(p.customer || '').toLowerCase().includes(customerQuery);
      const matchLocation = !locationQuery || String(p.location || '').toLowerCase().includes(locationQuery);
      return matchDept && matchBrand && matchGrade && matchInch && matchPalletId && matchCustomer && matchLocation;
    });
  }, [pallets, filter]);

  const handleQuantityChange = (palletId: string, itemId: string, newQty: number) => {
    const pallet = pallets.find(p => p.id === palletId);
    if (!pallet) return;

    const updatedItems = pallet.items.map(item =>
      item.id === itemId ? { ...item, quantity: Math.max(0, newQty) } : item
    );

    onUpdatePallet(palletId, { items: updatedItems });
  };

  // 엑셀에서 열 수 있는 CSV 파일로 저장해요.
  const exportToCsv = () => {
    const headers = ['팔레트ID', '본부명', '거래처', '위치', '구분', '브랜드', '인치', '전원방식', '수량', '메모', '최종업데이트'];
    const rows = filteredPallets.flatMap(p =>
      p.items.map(i => [
        p.id,
        p.department,
        p.customer || '',
        p.location || '',
        i.grade,
        i.brand,
        i.inch,
        i.powerType,
        i.quantity,
        p.memo,
        p.lastUpdated
      ])
    );

    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `monitor_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON 형태로도 저장할 수 있어요(복구용 백업 느낌).
  const exportToJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      pallets: pallets.slice(0, 300),
    };

    const jsonContent = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pallet_backup_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limitToGraphemes = (value: string, max: number) => {
    const segmenter = (Intl as any)?.Segmenter ? new (Intl as any).Segmenter('ko', { granularity: 'grapheme' }) : null;
    const segments = segmenter ? Array.from(segmenter.segment(value), (s: any) => s.segment as string) : Array.from(value);
    return segments.slice(0, max).join('');
  };

  // 위치는 목록에서 바로 바꿀 수 있어요. 글자 수는 6글자까지!
  const handleLocationChange = (palletId: string, nextLocation: string) => {
    const limited = limitToGraphemes(nextLocation, 6);
    const pallet = pallets.find(p => p.id === palletId);
    if (!pallet) return;
    if ((pallet.location || '') === limited) return;
    onUpdatePallet(palletId, { location: limited });
  };

  const getPowerLabel = (powerType: PowerType) => {
    return powerType === PowerType.POWER ? '파워케이블' : '어댑터';
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">팔레트 재고 현황</h2>

        <div className="md:hidden flex items-center justify-end gap-2">
          <button
            onClick={exportToCsv}
            aria-label="Excel 출력"
            title="Excel 출력"
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={exportToJson}
            aria-label="로컬 저장"
            title="로컬 저장"
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v7m0 0l-3-3m3 3l3-3M8 7h8M8 3h8" />
            </svg>
          </button>
          <button
            onClick={onAddNew}
            aria-label="신규 팔레트 등록"
            title="신규 팔레트 등록"
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={exportToCsv}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center space-x-2 transition-colors"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Excel 출력</span>
          </button>
          <button
            onClick={exportToJson}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center space-x-2 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v7m0 0l-3-3m3 3l3-3M8 7h8M8 3h8" />
            </svg>
            <span>로컬 저장</span>
          </button>
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2 shadow-lg shadow-blue-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>신규 팔레트 등록</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsMobileFilterOpen(v => !v)}
        className="md:hidden w-full bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">검색/필터</span>
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isMobileFilterOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${isMobileFilterOpen ? 'block' : 'hidden'} md:block bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 gap-4 md:flex md:flex-nowrap md:items-end md:gap-3 md:overflow-x-auto`}>
        <div className="md:min-w-[140px] md:flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider md:sr-only">팔레트 ID</label>
          <input
            type="text"
            value={filter.palletId}
            onChange={e => setFilter(f => ({ ...f, palletId: e.target.value }))}
            placeholder="예: P-2026..."
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="md:min-w-[140px] md:flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider md:sr-only">거래처</label>
          <input
            type="text"
            value={filter.customer}
            onChange={e => setFilter(f => ({ ...f, customer: e.target.value }))}
            placeholder="예: 리맨"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="md:min-w-[120px] md:flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider md:sr-only">위치</label>
          <input
            type="text"
            value={filter.location}
            onChange={e => setFilter(f => ({ ...f, location: e.target.value }))}
            placeholder="예: A-01"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="md:min-w-[140px] md:flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider md:sr-only">자산 주체 본부</label>
          <select
            value={filter.dept}
            onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">전체 본부</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="md:min-w-[140px] md:flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider md:sr-only">제조사 브랜드</label>
          <select
            value={filter.brand}
            onChange={e => setFilter(f => ({ ...f, brand: e.target.value }))}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">전체 브랜드</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="md:min-w-[96px] md:flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider md:sr-only">인치</label>
          <select
            value={filter.inch}
            onChange={e => setFilter(f => ({ ...f, inch: e.target.value }))}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">인치</option>
            {INCHES.map(i => <option key={i} value={i}>{i}"</option>)}
          </select>
        </div>
        <div className="md:min-w-[96px] md:flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider md:sr-only">양/불 구분</label>
          <select
            value={filter.grade}
            onChange={e => setFilter(f => ({ ...f, grade: e.target.value }))}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">상태</option>
            <option value={MonitorGrade.GOOD}>양품</option>
            <option value={MonitorGrade.BAD}>불량</option>
          </select>
        </div>
      </div>

      {isAdding && onSave && onCancel && (
        <div className="mb-8">
          <PalletForm
            initialPallet={selectedPallet || undefined}
            onSave={onSave}
            onCancel={onCancel}
          />
        </div>
      )}

      <div className="md:bg-white md:rounded-xl md:border md:border-slate-200 md:shadow-sm md:overflow-hidden">
        <div className="md:hidden space-y-4">
          {filteredPallets.map(p => {
            const totalQty = p.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{p.id}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{p.lastUpdated}</span>
                      </div>
                      <div className="mt-2 font-bold text-slate-900 text-sm break-words">{p.department}</div>
                      {!!p.customer && (
                        <div className="mt-1 text-[11px] font-semibold text-slate-600 break-words">
                          거래처: {p.customer}
                        </div>
                      )}
                      <div className="mt-1">
                        <input
                          type="text"
                          value={p.location || ''}
                          onChange={(e) => handleLocationChange(p.id, e.target.value)}
                          placeholder="-"
                          className="w-28 max-w-full h-8 px-2 text-[11px] font-semibold border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-slate-800 leading-none">{totalQty}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    {p.items.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black tracking-tighter shrink-0 ${item.grade === MonitorGrade.GOOD ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {item.grade}
                            </span>
                            <span className="text-sm font-semibold text-slate-700 break-words">
                              {item.brand} {item.inch}"
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500 font-semibold">
                            전원: {getPowerLabel(item.powerType)}
                          </div>
                        </div>

                        <div className="shrink-0 w-20">
                          <input
                            type="number"
                            className="w-full h-9 px-2 text-sm font-black border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(p.id, item.id, parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Memo</div>
                    <div className="mt-1 text-[11px] text-slate-600 whitespace-pre-wrap break-words">
                      {p.memo || '별도 기록된 특이사항이 없습니다.'}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => onPrint(p.id)}
                      aria-label="헌품표 출력"
                      title="헌품표 출력"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(p.id)}
                      aria-label="품목 수정/추가"
                      title="품목 수정/추가"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      aria-label="삭제"
                      title="삭제"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPallets.length === 0 && (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-slate-400 font-medium">검색 조건에 부합하는 팔레트 정보가 없습니다.</p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-40">팔레트 ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">본부</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">거래처</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-28">위치</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">적재 품목</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-28">전원</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-24"></th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-24">합계</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-32">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPallets.map(p => {
                const totalQty = p.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 align-top">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{p.id}</span>
                        <div className="text-[10px] text-slate-400 mt-2 font-medium">{p.lastUpdated}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="font-bold text-slate-900 text-sm whitespace-nowrap">{p.department}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm font-semibold text-slate-700 whitespace-nowrap">{p.customer || '-'}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <input
                          type="text"
                          value={p.location || ''}
                          onChange={(e) => handleLocationChange(p.id, e.target.value)}
                          placeholder="-"
                          className="w-24 h-8 px-2 text-sm font-semibold border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="space-y-2">
                          {p.items.map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2 h-8">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black tracking-tighter shrink-0 ${item.grade === MonitorGrade.GOOD ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {item.grade}
                              </span>
                              <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                                {item.brand} {item.inch}"
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="space-y-2">
                          {p.items.map((item) => (
                            <div key={item.id} className="flex items-center h-8 text-xs font-semibold text-slate-600">
                              {getPowerLabel(item.powerType)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="space-y-2">
                          {p.items.map((item) => (
                            <div key={item.id} className="flex items-center h-8">
                              <input
                                type="number"
                                className="w-full h-8 px-2 text-sm font-black border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(p.id, item.id, parseInt(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <div className="flex flex-col items-center justify-center pt-1">
                          <span className="text-2xl font-black text-slate-800 leading-none">{totalQty}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right align-top">
                        <div className="flex justify-end space-x-1">
                          <button onClick={() => onPrint(p.id)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="헌품표 출력">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                          <button onClick={() => onEdit(p.id)} className="p-2 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors" title="품목 수정/추가">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => onDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="삭제">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 group-hover:bg-slate-100/30 transition-colors">
                        <div className="flex items-start gap-3 text-[11px] text-slate-500">
                          <span className="font-black shrink-0 bg-slate-200 px-1.5 py-0.5 rounded-sm text-slate-600 uppercase tracking-tighter">Memo</span>
                          <span className="flex-1 min-w-0 whitespace-pre-wrap break-words italic font-medium leading-relaxed">
                            {p.memo || '별도 기록된 특이사항이 없습니다.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {filteredPallets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-slate-400 font-medium">검색 조건에 부합하는 팔레트 정보가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PalletList;
