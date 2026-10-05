import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Sparkles, 
  Settings as SettingsIcon, 
  Sun,
  Moon,
  Sunrise,
  Compass,
  Palette,
  Check
} from 'lucide-react';
import { THEMES } from '../utils/constants';

export function Header({
  onOpenAddModal,
  onOpenAIModal,
  onOpenSettingsModal,
  onTakeSnapshot,
  isSnapshotting,
  hasApiKey,
  currentTheme = 'light',
  onSelectTheme
}) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (themeId) => {
    switch (themeId) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'warm':
        return <Sunrise className="w-4 h-4 text-orange-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'navy':
        return <Compass className="w-4 h-4 text-blue-400" />;
      default:
        return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Sync Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  Asset<span className="text-sky-600 dark:text-sky-400">Flow</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                  실시간 RTDB
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px]">모든 기기 실시간 동기화됨</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            
            {/* Theme Selector Popover */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                title={`배경 테마 변경 (현재: ${activeThemeObj.name})`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition active:scale-95 shadow-2xs"
              >
                {getThemeIcon(currentTheme)}
                <span className="hidden sm:inline">{activeThemeObj.shortName}</span>
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <Palette className="w-3.5 h-3.5" />
                    <span>배경 테마 선택</span>
                  </div>
                  <div className="space-y-1">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTheme(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                          currentTheme === t.id
                            ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-500/25'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getThemeIcon(t.id)}
                          <span>{t.name}</span>
                        </div>
                        {currentTheme === t.id && (
                          <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Coaching Button */}
            <button
              onClick={onOpenAIModal}
              title="AI 포트폴리오 리밸런싱 코칭"
              className="relative group flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>AI 코칭</span>
              {!hasApiKey && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900" title="API 키 필요" />
              )}
            </button>

            {/* Add Asset Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">자산 등록</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              title="환경 설정"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95 shadow-2xs"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
