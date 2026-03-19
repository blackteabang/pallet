
// 이 화면은 '새 팔레트 등록/수정' 양식입니다.
// 필요한 정보를 입력하고 '데이터 저장하기'를 누르면 목록에 반영돼요.
import React, { useState, useEffect } from 'react';
import { Pallet, MonitorItem, MonitorGrade, PowerType } from '../types';
import { DEPARTMENTS, BRANDS, INCHES } from '../constants';

interface PalletFormProps {
  initialPallet?: Pallet;
  onSave: (pallet: Pallet) => void;
  onCancel: () => void;
}

const PalletForm: React.FC<PalletFormProps> = ({ initialPallet, onSave, onCancel }) => {
  const [department, setDepartment] = useState(initialPallet?.department || DEPARTMENTS[0]);
  const [customer, setCustomer] = useState(initialPallet?.customer || '');
  const [location, setLocation] = useState(initialPallet?.location || '');
  const [memo, setMemo] = useState(initialPallet?.memo || '');
  const [items, setItems] = useState<MonitorItem[]>(initialPallet?.items || []);

  // 한글은 1글자가 2~3바이트일 수 있어서,
  // 글자 수를 정확히 세기 위해 '문자 단위'로 자릅니다.
  const limitToGraphemes = (value: string, max: number) => {
    const segmenter = (Intl as any)?.Segmenter ? new (Intl as any).Segmenter('ko', { granularity: 'grapheme' }) : null;
    const segments = segmenter ? Array.from(segmenter.segment(value), (s: any) => s.segment as string) : Array.from(value);
    return segments.slice(0, max).join('');
  };

  // 예쁜 팔레트 번호를 자동으로 만들어 줍니다. 예) P-20260101-123
  const generatePalletId = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `P-${dateStr}-${random}`;
  };

  // 모니터 항목을 한 줄 추가해요.
  const addItem = () => {
    const newItem: MonitorItem = {
      id: crypto.randomUUID(),
      grade: MonitorGrade.GOOD,
      brand: BRANDS[0],
      inch: INCHES[3], // 24" default
      powerType: PowerType.POWER,
      quantity: '' as unknown as number,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<MonitorItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // 저장 버튼을 눌렀을 때만 실제 저장이 되도록 처리합니다.
  const handleSave = () => {
    if (items.length === 0) {
      alert('최소 하나 이상의 모니터 정보를 입력해주세요.');
      return;
    }

    const pallet: Pallet = {
      id: initialPallet?.id || generatePalletId(),
      department,
      customer: customer.trim(),
      location: location.trim(),
      memo,
      lastUpdated: new Date().toLocaleString(),
      items: items.map(({ id, ...rest }) => ({ ...rest, id, quantity: Number(rest.quantity) || 1 })), // Ensure unique IDs and valid quantity
    };
    onSave(pallet);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-bold text-slate-900">
          {initialPallet ? `팔레트 수정 (${initialPallet.id})` : '신규 팔레트 등록'}
        </h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">취소</button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">자산 주체 본부 *</label>
            <select 
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">거래처 (선택)</label>
            <input
              type="text"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              placeholder="예: 리맨"
              className="w-full border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">메모 (선택)</label>
            <input 
              type="text" 
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="특이사항 입력"
              className="w-full border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">팔레트 위치 (선택)</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(limitToGraphemes(e.target.value, 6))}
              placeholder="예: A-01"
              className="w-full border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">모니터 구성 정보</h3>
            <button 
              onClick={addItem}
              className="px-3 py-1.5 bg-slate-800 text-white text-sm rounded hover:bg-slate-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>항목 추가</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3 relative group">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">상태</label>
                  <select 
                    value={item.grade}
                    onChange={e => updateItem(item.id, { grade: e.target.value as MonitorGrade })}
                    className="w-full border-slate-200 rounded text-sm bg-white"
                  >
                    <option value={MonitorGrade.GOOD}>양품</option>
                    <option value={MonitorGrade.BAD}>불량/파손</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">브랜드</label>
                  <select 
                    value={item.brand}
                    onChange={e => updateItem(item.id, { brand: e.target.value })}
                    className="w-full border-slate-200 rounded text-sm bg-white"
                  >
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[80px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">인치</label>
                  <select 
                    value={item.inch}
                    onChange={e => updateItem(item.id, { inch: e.target.value })}
                    className="w-full border-slate-200 rounded text-sm bg-white"
                  >
                    {INCHES.map(i => <option key={i} value={i}>{i}"</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">전원</label>
                  <select 
                    value={item.powerType}
                    onChange={e => updateItem(item.id, { powerType: e.target.value as PowerType })}
                    className="w-full border-slate-200 rounded text-sm bg-white"
                  >
                    <option value={PowerType.POWER}>파워케이블</option>
                    <option value={PowerType.ADAPTER}>어댑터</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">수량</label>
                  <input 
                    type="number" 
                    min="1"
                    value={item.quantity}
                    onFocus={e => e.target.select()}
                    onChange={e => updateItem(item.id, { quantity: e.target.value === '' ? ('' as unknown as number) : parseInt(e.target.value) })}
                    className="w-full border-slate-200 rounded text-sm bg-white"
                  />
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                적재된 모니터가 없습니다. 항목을 추가해 주세요.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            데이터 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PalletForm;
