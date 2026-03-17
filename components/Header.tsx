
// 상단 메뉴(대시보드/목록/등록)를 담고 있는 헤더입니다.
// 누르면 해당 화면으로 바뀝니다.
import React from 'react';
import { LayoutDashboard, ClipboardList, Plus, User } from 'lucide-react';

interface HeaderProps {
  className?: string;
  currentView: string;
  setView: (view: any) => void;
}

const Header: React.FC<HeaderProps> = ({ className, currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'list', label: '팔레트 관리', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'add', label: '팔레트 등록', icon: <Plus className="w-5 h-5" /> },
  ];

  return (
    <header className={`bg-white border-b border-slate-200 shadow-sm px-4 md:px-8 h-16 flex items-center justify-between shrink-0 ${className}`}>
      <div className="flex items-center gap-3 md:gap-8 min-w-0 flex-1">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-blue-100">M</div>
          <span className="text-base sm:text-lg font-black text-slate-800 tracking-tighter whitespace-nowrap">팔레트관리</span>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-2 px-2 min-w-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`shrink-0 flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-blue-50 text-blue-700 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span className="text-sm hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4 shrink-0">
        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">물류 관리자</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Inventory Ops</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-inner overflow-hidden">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
