import React, { useState, useEffect, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  DateBar 
} from './components/DateBar';
import { 
  SummaryCards 
} from './components/SummaryCards';
import { 
  AssetTrendChart 
} from './components/AssetTrendChart';
import { 
  PortfolioChart 
} from './components/PortfolioChart';
import { 
  AssetList 
} from './components/AssetList';
import { 
  AssetModal 
} from './components/AssetModal';
import { 
  DailyUpdateModal 
} from './components/DailyUpdateModal';
import { 
  AICoachingModal 
} from './components/AICoachingModal';
import { 
  SettingsModal 
} from './components/SettingsModal';
import { 
  ConfirmModal 
} from './components/ConfirmModal';

import { 
  subscribeAssets, 
  subscribeHistory, 
  createAsset, 
  updateAsset, 
  deleteAsset, 
  saveSnapshotForDate,
  getLatestAssetsBeforeDate,
  saveTodaySnapshot, 
  seedSampleHistory, 
  seedSampleAssets 
} from './services/assetService';

import { 
  DEFAULT_AI_ROLE, 
  DEFAULT_AI_MODEL,
  THEMES,
  DEFAULT_THEME
} from './utils/constants';
import { formatDate } from './utils/formatters';

import { 
  Plus, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // 1. Firebase 실시간 상태
  const [globalAssets, setGlobalAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. 기준 일자 상태 (기본값: 오늘 YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));

  // 3. 사용자 설정 상태 (localStorage 연동, 기본 테마: 'light' 화이트 모드!)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('assetflow_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validModels = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.8-flash'];
        if (!validModels.includes(parsed.aiModel)) {
          parsed.aiModel = DEFAULT_AI_MODEL;
        }
        if (!parsed.theme) {
          parsed.theme = DEFAULT_THEME;
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      apiKey: '',
      aiModel: DEFAULT_AI_MODEL,
      aiRole: DEFAULT_AI_ROLE,
      colorMode: 'korean',
      theme: DEFAULT_THEME, // 화이트 모드가 default
    };
  });

  // 4. 모달 상태
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const [isDailyUpdateModalOpen, setIsDailyUpdateModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [assetIdToDelete, setAssetIdToDelete] = useState(null);

  // 5. 동작 인디케이터 및 에러 상태
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);

  // 테마 HTML 속성 및 class 동기화 (화이트 모드 및 다크 모드 정확한 클래스 전환)
  useEffect(() => {
    const currentTheme = settings.theme || DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', currentTheme);

    const isDark = currentTheme === 'dark' || currentTheme === 'navy';
    document.documentElement.classList.remove('light', 'warm', 'dark', 'navy');
    document.documentElement.classList.add(currentTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 6. Firebase 실시간 구독 등록
  useEffect(() => {
    setLoading(true);

    const handleSubError = (err) => {
      if (err && String(err).toLowerCase().includes('permission_denied')) {
        setPermissionError(true);
        setLoading(false);
      }
    };

    const unsubscribeAssets = subscribeAssets((data) => {
      setGlobalAssets(data);
      setPermissionError(false);
      setLoading(false);
    }, handleSubError);

    const unsubscribeHistory = subscribeHistory((data) => {
      setHistory(data);
    }, handleSubError);

    return () => {
      unsubscribeAssets();
      unsubscribeHistory();
    };
  }, []);

  // 7. 기준 일자에 따른 자산 목록 및 출처 계산 (새로운 날 최신 자산 자동 불러오기)
  const { currentAssets, isExactDateSaved, sourceDate } = useMemo(() => {
    const result = getLatestAssetsBeforeDate(selectedDate, history, globalAssets);
    return {
      currentAssets: result.assets,
      isExactDateSaved: result.isExactMatch,
      sourceDate: result.sourceDate
    };
  }, [selectedDate, history, globalAssets]);

  // 8. 설정 저장
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('assetflow_settings', JSON.stringify(newSettings));
    document.documentElement.setAttribute('data-theme', newSettings.theme || DEFAULT_THEME);
    showToast('설정이 성공적으로 저장되었습니다.');
  };

  // 빠른 테마 변경
  const handleSelectTheme = (newTheme) => {
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    localStorage.setItem('assetflow_settings', JSON.stringify(updated));
    document.documentElement.setAttribute('data-theme', newTheme);
    const themeName = THEMES.find(t => t.id === newTheme)?.name || newTheme;
    showToast(`'${themeName}' 테마로 변경되었습니다.`);
  };

  // 9. 자산 계산 통계
  const { totalPrincipal, totalValue } = useMemo(() => {
    const p = currentAssets.reduce((sum, a) => sum + (Number(a.principal) || 0), 0);
    const v = currentAssets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
    return { totalPrincipal: p, totalValue: v };
  }, [currentAssets]);

  // 10. 단일 자산 추가/수정 핸들러 (기준일자 반영)
  const handleSaveAsset = async (assetData) => {
    try {
      let updatedList = [];
      if (editingAsset) {
        // 기존 자산 수정
        updatedList = currentAssets.map(a => 
          a.id === editingAsset.id ? { ...a, ...assetData, updatedAt: new Date().toISOString() } : a
        );
        // 만약 기존 목록에 없었다면(수정 중 새로 매핑된 경우)
        if (!currentAssets.some(a => a.id === editingAsset.id)) {
          updatedList.push({ ...editingAsset, ...assetData, updatedAt: new Date().toISOString() });
        }
        await saveSnapshotForDate(selectedDate, updatedList, true);
        showToast(`'${assetData.name}' 자산이 수정되었습니다.`);
      } else {
        // 새 자산 추가
        const newId = `asset_${Date.now()}`;
        const newAsset = { ...assetData, id: newId, updatedAt: new Date().toISOString() };
        updatedList = [...currentAssets, newAsset];
        await saveSnapshotForDate(selectedDate, updatedList, true);
        showToast(`'${assetData.name}' 자산이 등록되었습니다.`);
      }
    } catch (e) {
      console.error(e);
      if (String(e).toLowerCase().includes('permission_denied') || String(e).toLowerCase().includes('permission denied')) {
        setPermissionError(true);
      }
      showToast(e.message || '저장 중 오류가 발생했습니다.', 'error');
      throw e;
    }
  };

  // 11. 새로운 날 자산 일괄 업데이트 저장 핸들러
  const handleSaveDailyAssets = async (targetDate, updatedAssetsList) => {
    try {
      setIsSnapshotting(true);
      await saveSnapshotForDate(targetDate, updatedAssetsList, true);
      showToast(`${targetDate} 자산 정보가 성공적으로 저장되었습니다.`);
    } catch (e) {
      console.error(e);
      if (String(e).toLowerCase().includes('permission_denied')) {
        setPermissionError(true);
      }
      showToast(e.message || '자산 저장 실패', 'error');
      throw e;
    } finally {
      setIsSnapshotting(false);
    }
  };

  // 12. 현재 날짜의 자산 스냅샷 확정 저장
  const handleTakeSnapshot = async () => {
    try {
      setIsSnapshotting(true);
      await saveSnapshotForDate(selectedDate, currentAssets, true);
      showToast(`${selectedDate} 시점의 자산 스냅샷이 저장되었습니다.`);
    } catch (e) {
      console.error(e);
      if (String(e).toLowerCase().includes('permission_denied')) {
        setPermissionError(true);
      }
      showToast(e.message || '스냅샷 저장에 실패했습니다.', 'error');
    } finally {
      setIsSnapshotting(false);
    }
  };

  // 13. 직전일 자산 다시 로드
  const handleReloadPrevious = () => {
    showToast(`직전일(${sourceDate || '이전'})의 최신 자산 정보를 다시 불러왔습니다.`);
  };

  // 14. 자산 삭제 핸들러
  const handleRequestDelete = (id) => {
    setAssetIdToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetIdToDelete) return;
    try {
      const updatedList = currentAssets.filter(a => a.id !== assetIdToDelete);
      await saveSnapshotForDate(selectedDate, updatedList, true);
      showToast('자산이 삭제되었습니다.');
      setIsAssetModalOpen(false);
      setEditingAsset(null);
    } catch (e) {
      console.error(e);
      showToast(e.message || '삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 15. 샘플 히스토리 생성
  const handleSeedSampleHistory = async () => {
    try {
      await seedSampleHistory(currentAssets.length > 0 ? currentAssets : globalAssets);
      showToast('시뮬레이션 히스토리 데이터가 생성되었습니다.');
    } catch (e) {
      console.error(e);
      if (String(e).toLowerCase().includes('permission_denied')) {
        setPermissionError(true);
      }
      showToast(e.message || '히스토리 생성 실패', 'error');
    }
  };

  // 16. 초기 샘플 자산 로드
  const handleSeedSampleAssets = async () => {
    try {
      await seedSampleAssets();
      showToast('기본 포트폴리오 샘플이 등록되었습니다.');
    } catch (e) {
      console.error(e);
      if (String(e).toLowerCase().includes('permission_denied')) {
        setPermissionError(true);
      }
      showToast(e.message || '샘플 자산 로드 실패', 'error');
    }
  };

  const handleCopyRules = () => {
    const rules = `{\n  "rules": {\n    ".read": true,\n    ".write": true\n  }\n}`;
    navigator.clipboard.writeText(rules);
    setRulesCopied(true);
    showToast('Firebase 규칙 코드가 클립보드에 복사되었습니다.');
    setTimeout(() => setRulesCopied(false), 3000);
  };

  // 모달 제어
  const openAddModal = () => {
    setEditingAsset(null);
    setIsAssetModalOpen(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setIsAssetModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-theme-app text-theme-main flex flex-col pb-safe transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-card border border-theme-border text-xs font-semibold shadow-2xl backdrop-blur-md animate-bounce max-w-md">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span className="text-theme-main">{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header */}
      <Header
        onOpenAddModal={openAddModal}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onTakeSnapshot={handleTakeSnapshot}
        isSnapshotting={isSnapshotting}
        hasApiKey={Boolean(settings.apiKey)}
        currentTheme={settings.theme || DEFAULT_THEME}
        onSelectTheme={handleSelectTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5 sm:space-y-6">
        
        {/* Firebase Permission Alert Banner */}
        {permissionError && (
          <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 p-4 sm:p-5 shadow-xl text-amber-800 dark:text-amber-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-900 dark:text-amber-200">
                    Firebase Realtime Database 권한 설정 필요 (PERMISSION_DENIED)
                  </h3>
                  <p className="text-xs sm:text-sm text-theme-sub mt-1 leading-relaxed">
                    Firebase DB의 보안 규칙(Rules)이 읽기/쓰기를 차단하고 있어 데이터 저장이 거부되었습니다.
                    아래 규칙을 복사한 뒤 Firebase 콘솔의 <strong>[규칙(Rules)]</strong> 탭에 붙여넣고 <strong>[게시]</strong>를 눌러주세요.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 pl-9 md:pl-0">
                <button
                  onClick={handleCopyRules}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow-md shadow-amber-500/20"
                >
                  {rulesCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{rulesCopied ? '규칙 복사완료' : '규칙 코드 복사'}</span>
                </button>
                <a
                  href="https://console.firebase.google.com/project/asset-management-a4351/database/asset-management-a4351-default-rtdb/rules"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-secondary hover:bg-theme-card text-theme-main font-semibold text-xs border border-theme-border transition"
                >
                  <span>Firebase 규칙 설정 열기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Quick Rule Code Preview */}
            <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs font-mono bg-theme-card/80 rounded-xl p-3 text-theme-main flex items-center justify-between">
              <code>{`{ "rules": { ".read": true, ".write": true } }`}</code>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-sans">누구나 읽기/쓰기 허용 (테스트 모드)</span>
            </div>
          </div>
        )}

        {/* 2. 날짜 제어 및 이전 자산 불러오기 상태 바 (DateBar) */}
        <DateBar
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          isExactDateSaved={isExactDateSaved}
          sourceDate={sourceDate}
          assetsCount={currentAssets.length}
          onOpenDailyUpdate={() => setIsDailyUpdateModalOpen(true)}
          onSaveSnapshot={handleTakeSnapshot}
          onReloadPrevious={handleReloadPrevious}
          isSnapshotting={isSnapshotting}
        />

        {/* 3. 대시보드 상단 요약 카드 */}
        <SummaryCards
          totalPrincipal={totalPrincipal}
          totalValue={totalValue}
          colorMode={settings.colorMode}
        />

        {/* 4. 차트 섹션 (변동 추이 차트 & 포트폴리오 비중 차트) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* 자산 변동 추이 차트 (AreaChart) */}
          <div className="lg:col-span-7">
            <AssetTrendChart
              history={history}
              onSeedSampleHistory={handleSeedSampleHistory}
              onSaveCurrentSnapshot={handleTakeSnapshot}
              isSnapshotting={isSnapshotting}
            />
          </div>

          {/* 포트폴리오 비중 도넛 차트 (PieChart) */}
          <div className="lg:col-span-5">
            <PortfolioChart
              assets={currentAssets}
              totalValue={totalValue}
            />
          </div>
        </div>

        {/* 5. 자산 목록 (Asset List) */}
        <AssetList
          assets={currentAssets}
          totalValue={totalValue}
          onOpenEditModal={openEditModal}
          onOpenAddModal={openAddModal}
          onSeedSampleAssets={currentAssets.length === 0 ? handleSeedSampleAssets : null}
          colorMode={settings.colorMode}
        />

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-theme-border py-4 text-center text-xs text-theme-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} AssetFlow - 스마트 자산관리 & AI 리밸런싱</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Firebase RTDB 동기화
            </span>
            <span>·</span>
            <span>테마: {THEMES.find(t => t.id === (settings.theme || DEFAULT_THEME))?.name || '화이트 모드'}</span>
            <span>·</span>
            <span>Gemini AI {settings.aiModel}</span>
          </div>
        </div>
      </footer>

      {/* Floating Action Button for Mobile */}
      <div className="sm:hidden fixed bottom-5 right-5 z-40 flex flex-col gap-2">
        <button
          onClick={() => setIsDailyUpdateModalOpen(true)}
          className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-90 text-white shadow-xl shadow-indigo-600/35 flex items-center justify-center transition"
          aria-label="오늘 자산 일괄 업데이트"
          title="오늘 자산 빠른 일괄 업데이트"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
        </button>
        <button
          onClick={openAddModal}
          className="w-13 h-13 p-3.5 rounded-full bg-sky-600 hover:bg-sky-500 active:scale-90 text-white shadow-xl shadow-sky-600/35 flex items-center justify-center transition"
          aria-label="새 자산 등록"
          title="새 자산 등록"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals */}
      {/* 1. Asset Modal (Create/Edit) */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSave={handleSaveAsset}
        onDelete={handleRequestDelete}
        initialAsset={editingAsset}
        colorMode={settings.colorMode}
        targetDate={selectedDate}
      />

      {/* 2. Daily Update Modal (새로운 날 빠른 일괄 업데이트 모달) */}
      <DailyUpdateModal
        isOpen={isDailyUpdateModalOpen}
        onClose={() => setIsDailyUpdateModalOpen(false)}
        selectedDate={selectedDate}
        sourceDate={sourceDate}
        initialAssets={currentAssets}
        onSaveDailyAssets={handleSaveDailyAssets}
        colorMode={settings.colorMode}
      />

      {/* 3. AI Coaching Modal */}
      <AICoachingModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        assets={currentAssets}
        history={history}
        apiKey={settings.apiKey}
        aiModel={settings.aiModel}
        aiRole={settings.aiRole}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* 4. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* 5. Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="자산 삭제"
        message="선택하신 자산을 삭제하시겠습니까? 데이터베이스에서 즉시 삭제되며 모든 동기화 기기에 반영됩니다."
      />

    </div>
  );
}
