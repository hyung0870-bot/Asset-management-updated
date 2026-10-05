import React, { useState } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  Save, 
  ExternalLink, 
  Sparkles, 
  Palette, 
  Key, 
  Bot, 
  CheckCircle,
  Sun,
  Sunrise,
  Moon,
  Compass,
  Check
} from 'lucide-react';
import { AI_PRESETS, DEFAULT_AI_MODEL, DEFAULT_AI_ROLE, THEMES, DEFAULT_THEME } from '../utils/constants';

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [aiModel, setAiModel] = useState(settings.aiModel || DEFAULT_AI_MODEL);
  const [aiRole, setAiRole] = useState(settings.aiRole || DEFAULT_AI_ROLE);
  const [colorMode, setColorMode] = useState(settings.colorMode || 'korean');
  const [theme, setTheme] = useState(settings.theme || DEFAULT_THEME);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (presetRole) => {
    setAiRole(presetRole);
  };

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

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      apiKey: apiKey.trim(),
      aiModel,
      aiRole: aiRole.trim(),
      colorMode,
      theme,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>환경 설정 (Settings)</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto">
          
          {/* 1. 배경 테마 선택 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                배경 테마 선택 (Background Theme)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                기본값: 화이트 모드
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-500/15 shadow-xs ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {getThemeIcon(t.id)}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 font-bold" />
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                      {t.description}
                    </p>

                    <div className="flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div 
                        className="w-4 h-3 rounded border border-black/10" 
                        style={{ backgroundColor: t.colors.bg }}
                        title="배경색"
                      />
                      <div 
                        className="w-4 h-3 rounded border border-black/10" 
                        style={{ backgroundColor: t.colors.card }}
                        title="카드색"
                      />
                      <div 
                        className="w-4 h-3 rounded border border-black/10" 
                        style={{ backgroundColor: t.colors.accent }}
                        title="포인트색"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>무료 키 발급</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              * API 키는 브라우저 로컬 저장소에 안전하게 보관되며 외부 서버로 전송되지 않습니다.
            </p>
          </div>

          {/* 3. AI Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              AI 분석 모델 (Model)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gemini-3.5-flash', label: '3.5 Flash (권장, 안정)' },
                { id: 'gemini-2.5-flash', label: '2.5 Flash (초고속)' },
                { id: 'gemini-3.8-flash', label: '3.8 Flash (최신)' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setAiModel(m.id)}
                  className={`py-2 px-1 text-xs font-medium rounded-xl border text-center transition ${
                    aiModel === m.id
                      ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-400 dark:border-sky-500 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. AI Persona / Role Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                AI 코칭 역할 및 투자 원칙 (aiRole)
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {AI_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.role)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition"
                  title={preset.description}
                >
                  [{preset.label}]
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              placeholder="예: 리스크 관리를 최우선으로 하는 자산배분 및 올웨더 포트폴리오 전문가"
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed font-medium"
            />
          </div>

          {/* 5. 수익률 차트 색상 테마 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-500" />
              수익률 및 손익 색상 모드
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setColorMode('korean')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  colorMode === 'korean'
                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">한국형 (KRX)</div>
                <div className="text-[11px] flex items-center gap-2">
                  <span className="text-rose-600 font-semibold">▲ 상승 빨강</span>
                  <span className="text-blue-600 font-semibold">▼ 하락 파랑</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setColorMode('global')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  colorMode === 'global'
                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">글로벌형 (US/Crypto)</div>
                <div className="text-[11px] flex items-center gap-2">
                  <span className="text-emerald-600 font-semibold">▲ 상승 초록</span>
                  <span className="text-rose-600 font-semibold">▼ 하락 빨강</span>
                </div>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/25 transition active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>설정이 저장되었습니다!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>설정 저장하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
