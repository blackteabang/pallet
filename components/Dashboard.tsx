
import React from 'react';
import { Pallet, MonitorGrade } from '../types';

interface DashboardProps {
  pallets: Pallet[];
  insights: string;
  onViewList: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ pallets, insights, onViewList }) => {
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; unit: string; color: string }> = ({ title, value, unit, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
    <div className="flex items-baseline space-x-1">
      <span className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</span>
      <span className="text-sm font-medium text-slate-600">{unit}</span>
    </div>
    <div className={`mt-4 h-1 w-12 rounded-full ${color}`} />
  </div>
);

export default Dashboard;
