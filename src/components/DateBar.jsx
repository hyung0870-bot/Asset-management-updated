import React from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Save, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  Clock
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export function DateBar({
  selectedDate,
  onChangeDate,
  isExactDateSaved,
  sourceDate,
  assetsCount = 0,
  onOpenDailyUpdate,
  onSaveSnapshot,
  onReloadPrevious,
  isSnapshotting
}) {
  const todayStr = formatDate(new Date());
  const isToday = selectedDate === todayStr;

  // 하루 전으로 이동
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onChangeDate(formatDate(d));
  };

  // 하루 뒤로 이동
  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onChangeDate(formatDate(d));
  };

  // 오늘로 이동
  const handleGoToday = () => {
    onChangeDate(todayStr);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm transition">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: 날짜 선택기 & 이전/다음 이동 컨트롤 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-none">
                자산 기록 기준일자
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && onChangeDate(e.target.value)}
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 transition cursor-pointer shadow-sm"
                />
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                    오늘
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Date Stepper Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs ml-auto sm:ml-2">
            <button
              onClick={handlePrevDay}
              title="어제"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToday}
              disabled={isToday}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                isToday 
                  ? 'text-slate-400 dark:text-slate-500 opacity-60' 
                  : 'text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 font-bold'
              }`}
            >
              오늘
            </button>
            <button
              onClick={handleNextDay}
              title="내일"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: 액션 버튼들 */}
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          
          {/* Quick Batch Update Button */}
          <button
            onClick={onOpenDailyUpdate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition active:scale-95"
            title="이전 자산 목록을 바탕으로 오늘 변동된 금액만 한 번에 수정"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>오늘 자산 빠른 업데이트</span>
          </button>

          {/* Snapshot Save Button */}
          <button
            onClick={onSaveSnapshot}
            disabled={isSnapshotting}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition active:scale-95 disabled:opacity-50 ${
              isExactDateSaved
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-600/20 font-bold'
            }`}
            title="현재 자산 정보를 이 날짜의 기록으로 저장"
          >
            <Save className={`w-4 h-4 ${isSnapshotting ? 'animate-spin' : ''}`} />
            <span>{isSnapshotting ? '저장 중...' : isExactDateSaved ? '기록 갱신' : '이 날짜로 저장'}</span>
          </button>

          {/* Reload from previous date button */}
          {!isExactDateSaved && sourceDate && (
            <button
              onClick={onReloadPrevious}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 transition"
              title="이전 날짜의 최신 자산 정보를 다시 불러오기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">직전일 자산 다시 로드</span>
            </button>
          )}

        </div>
      </div>

      {/* 안내 알림 배너 */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {isExactDateSaved ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{selectedDate} 자산 기록이 보관되어 있습니다 ({assetsCount}개 항목)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
              <span>
                <strong>새로운 날({selectedDate}) 입력 모드:</strong> 직전일
                <span className="font-bold underline mx-1">{sourceDate || '최신'}</span>
                의 자산 {assetsCount}개를 자동 로드했습니다. 변동된 자산만 수정한 후 저장하세요.
              </span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>날짜별 독립 스냅샷 보존</span>
        </div>
      </div>
    </div>
  );
}
