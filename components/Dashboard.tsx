
// 대시보드는 창고 현황을 한눈에 보여주는 화면입니다.
// 카드로 요약 숫자를 보여주고, 아래에는 팔레트 요약 카드가 나열돼요.
import React from 'react';
import { Pallet, MonitorGrade } from '../types';

interface DashboardProps {
  pallets: Pallet[];
  insights: string;
  onViewList: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ pallets, insights, onViewList }) => {
  // 전체 수량, 양품/불량 수량, 브랜드 분포 등을 계산합니다.
  const stats = React.useMemo(() => {
    let totalMonitors = 0;
    let goodMonitors = 0;
    let badMonitors = 0;
    const brandCounts: Record<string, number> = {};

    pallets.forEach(p => {
      p.items.forEach(i => {
        totalMonitors += i.quantity;
        if (i.grade === MonitorGrade.GOOD) goodMonitors += i.quantity;
        else badMonitors += i.quantity;
        
        brandCounts[i.brand] = (brandCounts[i.brand] || 0) + i.quantity;
      });
    });

    const topBrands = Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { totalPallets: pallets.length, totalMonitors, goodMonitors, badMonitors, topBrands };
  }, [pallets]);

  // 각 팔레트의 간단 요약(아이디/위치/본부/품목/수량)을 만들어요.
  const palletSummaries = React.useMemo(() => {
    return pallets.slice(0, 12).map(p => {
      const totalQty = p.items.reduce((sum, item) => sum + item.quantity, 0);
      const itemNames = Array.from(new Set(p.items.map(i => `${i.brand} ${i.inch}"`)));
      const itemsText = itemNames.slice(0, 3).join(', ') + (itemNames.length > 3 ? ` 외 ${itemNames.length - 3}` : '');
      return {
        id: p.id,
        location: p.location || '-',
        department: p.department,
        customer: p.customer || '',
        itemsText: itemsText || '-',
        totalQty,
      };
    });
  }, [pallets]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-slate-900">창고 운영 현황</h2>
        <button 
          onClick={onViewList}
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
        >
          <span>전체 리스트 보기</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="총 팔레트 수" value={stats.totalPallets} unit="개" color="bg-blue-500" />
        <StatCard title="총 모니터 재고" value={stats.totalMonitors} unit="대" color="bg-indigo-500" />
        <StatCard title="양품 수량" value={stats.goodMonitors} unit="대" color="bg-emerald-500" />
        <StatCard title="불량/파손" value={stats.badMonitors} unit="대" color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand Chart Replacement */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">주요 제조사별 점유율</h3>
          <div className="space-y-4">
            {stats.topBrands.map(([brand, count]) => {
              const percentage = stats.totalMonitors > 0 ? (count / stats.totalMonitors) * 100 : 0;
              return (
                <div key={brand}>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span>{brand}</span>
                    <span>{count}대 ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.topBrands.length === 0 && <div className="text-center py-10 text-slate-400">등록된 데이터가 없습니다.</div>}
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-900">창고 운영 AI 제안</h3>
          </div>
          <p className="text-blue-800 text-sm leading-relaxed flex-1 whitespace-pre-wrap">
            {insights}
          </p>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Gemini 3 Flash Powered</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-semibold text-slate-900">팔레트 요약</h3>
          <button onClick={onViewList} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            전체 보기
          </button>
        </div>

        {palletSummaries.length === 0 ? (
          <div className="text-center py-10 text-slate-400">등록된 데이터가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {palletSummaries.map(s => (
              <PalletSummaryCard
                key={s.id}
                id={s.id}
                location={s.location}
                department={s.department}
                customer={s.customer}
                itemsText={s.itemsText}
                totalQty={s.totalQty}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; unit: string; color: string }> = ({ title, value, unit, color }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[11px] sm:text-sm font-medium text-slate-500 truncate">{title}</p>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-xl sm:text-3xl font-bold text-slate-900">{value.toLocaleString()}</span>
        <span className="text-[11px] sm:text-sm font-medium text-slate-600">{unit}</span>
      </div>
    </div>
    <div className={`hidden sm:block mt-4 h-1 w-12 rounded-full ${color}`} />
  </div>
);

const PalletSummaryCard: React.FC<{ id: string; location: string; department: string; customer: string; itemsText: string; totalQty: number }> = ({ id, location, department, customer, itemsText, totalQty }) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-colors">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{id}</span>
          <span className="text-xs font-semibold text-slate-600">{location}</span>
        </div>
        <div className="mt-2 text-sm font-bold text-slate-900 break-words">{department}</div>
        {!!customer && (
          <div className="mt-1 text-[11px] font-semibold text-slate-600 break-words">거래처: {customer}</div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-2xl font-black text-slate-800 leading-none">{totalQty.toLocaleString()}</div>
      </div>
    </div>

    <div className="mt-3 text-sm font-semibold text-slate-700 break-words">{itemsText}</div>
  </div>
);

export default Dashboard;
