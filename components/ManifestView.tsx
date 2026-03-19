
// 이 화면은 '인쇄용 전표(헌품표)'입니다.
// 깔끔하게 출력하기 위해 표 모양으로 정보를 정리해서 보여줘요.
import React from 'react';
import { Pallet, MonitorGrade } from '../types';

interface ManifestViewProps {
  pallet: Pallet;
  onBack: () => void;
}

const ManifestView: React.FC<ManifestViewProps> = ({ pallet, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const totalQty = pallet.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-slate-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>뒤로가기</span>
        </button>
        <button 
          onClick={handlePrint}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>헌품표 인쇄</span>
        </button>
      </div>

      {/* Manifest Template */}
      <div className="bg-white p-4 sm:p-8 border-4 border-slate-900 rounded-lg shadow-xl print:shadow-none print:border-slate-900 print:m-0 print:p-8">
        <div className="text-center mb-8 border-b-4 border-slate-900 pb-4">
          <h2 className="text-2xl sm:text-4xl font-black tracking-widest text-slate-900 uppercase italic">Pallet Manifest</h2>
          <p className="text-base sm:text-xl font-bold text-slate-600 mt-2">모니터 전용 헌품표</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-900 border-2 border-slate-900 mb-8">
          <InfoBox label="팔레트 ID" value={pallet.id} mono />
          <InfoBox label="자산 주체 본부" value={pallet.department} />
          <InfoBox label="거래처" value={pallet.customer || '-'} />
          <InfoBox label="팔레트 위치" value={pallet.location || '-'} />
          <InfoBox label="업데이트 일시" value={pallet.lastUpdated} />
          <InfoBox label="총 적재 수량" value={`${totalQty} 대`} highlight />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold border-l-4 border-slate-900 pl-2">세부 적재 내역</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-2 border-slate-900 border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border-2 border-slate-900 p-2 text-center text-sm font-bold">상태</th>
                  <th className="border-2 border-slate-900 p-2 text-center text-sm font-bold">브랜드</th>
                  <th className="border-2 border-slate-900 p-2 text-center text-sm font-bold">인치</th>
                  <th className="border-2 border-slate-900 p-2 text-center text-sm font-bold">전원</th>
                  <th className="border-2 border-slate-900 p-2 text-center text-sm font-bold">수량</th>
                </tr>
              </thead>
              <tbody>
                {pallet.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={`border-2 border-slate-900 p-2 text-center font-bold ${item.grade === MonitorGrade.BAD ? 'text-rose-600' : ''}`}>{item.grade}</td>
                    <td className="border-2 border-slate-900 p-2 text-center font-bold">{item.brand}</td>
                    <td className="border-2 border-slate-900 p-2 text-center">{item.inch}"</td>
                    <td className="border-2 border-slate-900 p-2 text-center text-xs">{item.powerType}</td>
                    <td className="border-2 border-slate-900 p-2 text-center font-black text-lg">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pallet.memo && (
          <div className="mt-8 pt-4 border-t-2 border-slate-900 italic text-slate-700">
            <span className="font-bold not-italic">메모:</span> {pallet.memo}
          </div>
        )}

        <div className="mt-12 flex justify-between items-end">
          <div className="text-[10px] text-slate-400">
            System Generated @ {new Date().toLocaleString()}
          </div>
          <div className="text-right">
            <div className="w-24 h-24 bg-slate-100 border border-slate-300 flex items-center justify-center text-[8px] text-slate-300">
              QR Code Area
            </div>
            <p className="text-[10px] font-bold mt-1">창고 관리팀 검인</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoBox: React.FC<{ label: string; value: string; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div className="bg-white p-4">
    <div className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</div>
    <div className={`text-xl font-black text-slate-900 ${mono ? 'font-mono' : ''} ${highlight ? 'text-blue-600 text-2xl' : ''}`}>
      {value}
    </div>
  </div>
);

export default ManifestView;
