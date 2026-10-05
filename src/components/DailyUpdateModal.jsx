import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Trash2, 
  Plus, 
  Calendar, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { ASSET_CATEGORIES, CATEGORY_BADGES, CATEGORY_COLORS } from '../utils/constants';
import { 
  formatKRW, 
  formatUSD, 
  parseNumberInput, 
  parseFloatInput, 
  calculateReturn,
  evaluateMathExpression
} from '../utils/formatters';

export function DailyUpdateModal({
  isOpen,
  onClose,
  selectedDate,
  sourceDate,
  initialAssets = [],
  onSaveDailyAssets,
  colorMode = 'korean'
}) {
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // 새 자산 빠른 추가 폼 임시 상태
  const [newCategory, setNewCategory] = useState('현금/예금');
  const [newName, setNewName] = useState('');
  const [newCurrency, setNewCurrency] = useState('KRW');
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newCurrentValue, setNewCurrentValue] = useState('');

  // 모달 열릴 때 초기 데이터 복제
  useEffect(() => {
    if (!isOpen) return;

    const cloned = initialAssets.map(a => ({
      ...a,
      id: a.id || `temp_${Date.now()}_${Math.random()}`,
      originalValue: Number(a.currentValue) || 0,
      originalPrincipal: Number(a.principal) || 0,
      valueInput: a.currency === 'USD' && a.currentValueUSD !== undefined && a.currentValueUSD !== null
        ? String(a.currentValueUSD) 
        : formatKRW(a.currentValue || 0, false),
      principalInput: a.currency === 'USD' && a.principalUSD !== undefined && a.principalUSD !== null
        ? String(a.principalUSD)
        : formatKRW(a.principal || 0, false),
      isModified: false
    }));

    setItems(cloned);
    setShowAddForm(false);
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen, initialAssets]);

  if (!isOpen) return null;

  // 값 파싱 헬퍼
  const resolveValue = (inputStr, isUSD) => {
    if (!inputStr) return 0;
    const mathVal = evaluateMathExpression(inputStr);
    if (mathVal !== null && !isNaN(mathVal) && isFinite(mathVal)) {
      return isUSD ? mathVal : Math.round(mathVal);
    }
    return isUSD ? parseFloatInput(inputStr) : parseNumberInput(inputStr);
  };

  // 개별 자산의 평가액 수정
  const handleValueChange = (index, val) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      item.valueInput = val.replace(/[^0-9+\-*/().,\s]/g, '');
      item.isModified = true;
      next[index] = item;
      return next;
    });
  };

  // 평가액 인풋 블러 시 포맷팅
  const handleValueBlur = (index) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      const isUSD = item.currency === 'USD';
      const calc = resolveValue(item.valueInput, isUSD);
      item.valueInput = isUSD ? (Number.isInteger(calc) ? String(calc) : calc.toFixed(2)) : formatKRW(calc, false);
      next[index] = item;
      return next;
    });
  };

  // 항목 삭제
  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // 원금과 동일 버튼
  const handleSyncWithPrincipal = (index) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      item.valueInput = item.principalInput;
      item.isModified = true;
      next[index] = item;
      return next;
    });
  };

  // 새 자산 추가
  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const isUSD = newCurrency === 'USD';
    const p = resolveValue(newPrincipal, isUSD);
    const v = resolveValue(newCurrentValue, isUSD);

    const newItem = {
      id: `new_${Date.now()}`,
      category: newCategory,
      name: newName.trim(),
      currency: newCurrency,
      originalValue: 0,
      originalPrincipal: 0,
      valueInput: isUSD ? String(v) : formatKRW(v, false),
      principalInput: isUSD ? String(p) : formatKRW(p, false),
      exchangeRate: isUSD ? 1350 : null,
      isModified: true
    };

    setItems(prev => [...prev, newItem]);
    setNewName('');
    setNewPrincipal('');
    setNewCurrentValue('');
    setShowAddForm(false);
  };

  // 전체 실시간 통계 계산
  const { totalValueKRW, totalPrincipalKRW, modifiedCount } = items.reduce(
    (acc, item) => {
      const isUSD = item.currency === 'USD';
      const rate = item.exchangeRate || 1350;
      const calcVal = resolveValue(item.valueInput, isUSD);
      const calcPrinc = resolveValue(item.principalInput, isUSD);

      const valKRW = isUSD ? Math.round(calcVal * rate) : calcVal;
      const princKRW = isUSD ? Math.round(calcPrinc * rate) : calcPrinc;

      acc.totalValueKRW += valKRW;
      acc.totalPrincipalKRW += princKRW;
      if (item.isModified) acc.modifiedCount += 1;
      return acc;
    },
    { totalValueKRW: 0, totalPrincipalKRW: 0, modifiedCount: 0 }
  );

  const profitKRW = totalValueKRW - totalPrincipalKRW;
  const returnInfo = calculateReturn(totalPrincipalKRW, totalValueKRW);

  // 저장 제출
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const updatedAssets = items.map(item => {
        const isUSD = item.currency === 'USD';
        const rate = item.exchangeRate || 1350;
        const calcVal = resolveValue(item.valueInput, isUSD);
        const calcPrinc = resolveValue(item.principalInput, isUSD);

        const valKRW = isUSD ? Math.round(calcVal * rate) : calcVal;
        const princKRW = isUSD ? Math.round(calcPrinc * rate) : calcPrinc;

        return {
          id: item.id,
          category: item.category || '기타',
          name: item.name,
          currency: item.currency || 'KRW',
          exchangeRate: isUSD ? rate : null,
          principalUSD: isUSD ? calcPrinc : null,
          currentValueUSD: isUSD ? calcVal : null,
          principal: princKRW,
          currentValue: valKRW,
          memo: item.memo || '',
          updatedAt: new Date().toISOString()
        };
      });

      await onSaveDailyAssets(selectedDate, updatedAssets);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPositive = returnInfo.isPositive;
  const profitColor = returnInfo.isZero 
    ? 'text-slate-500' 
    : (colorMode === 'korean' ? (isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400') : (isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>{selectedDate} 자산 빠른 일괄 업데이트</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              직전일({sourceDate || '이전'})의 최신 자산이 로드되었습니다. 오늘 변동된 평가액만 쏙쏙 수정하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Summary Bar */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">합산 총 평가액</span>
            <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
              {formatKRW(totalValueKRW)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">총 투자 원금</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              {formatKRW(totalPrincipalKRW)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">총 손익 / 수익률</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-bold text-xs sm:text-sm ${profitColor}`}>
                {profitKRW > 0 ? `+${formatKRW(profitKRW)}` : formatKRW(profitKRW)}
              </span>
              <span className={`text-[11px] font-bold ${profitColor}`}>
                ({returnInfo.formatted})
              </span>
            </div>
          </div>
          <div className="text-right sm:text-left">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">자산 변경 상태</span>
            <span className={`font-bold text-xs sm:text-sm ${modifiedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {modifiedCount}개 수정됨 / 총 {items.length}개
            </span>
          </div>
        </div>

        {/* Table Body Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              불러올 이전 자산이 없습니다. 아래 버튼으로 자산을 추가하세요.
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const isUSD = item.currency === 'USD';
                const prevVal = item.originalValue;

                return (
                  <div
                    key={item.id}
                    className={`p-3 sm:p-4 rounded-xl border transition ${
                      item.isModified 
                        ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-300 dark:border-sky-500/40 shadow-xs' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      
                      {/* Left: 자산 기본 정보 */}
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#38bdf8' }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-semibold border ${CATEGORY_BADGES[item.category] || CATEGORY_BADGES['기타']}`}>
                              {item.category}
                            </span>
                            {isUSD && (
                              <span className="inline-flex px-1 py-0.2 rounded text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                USD
                              </span>
                            )}
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            직전 평가액: {isUSD ? formatUSD(item.currentValueUSD || 0) : formatKRW(prevVal)}
                          </div>
                        </div>
                      </div>

                      {/* Middle: 새로운 평가액 입력칸 */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="relative flex-1">
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block sm:hidden mb-0.5">
                            오늘 평가액 ({item.currency}):
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.valueInput}
                              onChange={(e) => handleValueChange(idx, e.target.value)}
                              onBlur={() => handleValueBlur(idx)}
                              placeholder="평가액 입력 (사칙연산 가능)"
                              className={`w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-right transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                item.isModified ? 'border-sky-500 ring-1 ring-sky-500 font-extrabold bg-white dark:bg-slate-800' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium pointer-events-none">
                              {isUSD ? '$' : '원'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Helper Button */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSyncWithPrincipal(idx)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition"
                            title="투자 원금과 동일하게 맞춤"
                          >
                            원금과 동일
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                            title="이 날짜 목록에서 제외"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* New Asset Add Drawer Button */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 text-slate-600 dark:text-slate-400 hover:text-sky-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-50/50 dark:bg-slate-800/30"
            >
              <Plus className="w-4 h-4" />
              <span>새로운 자산 추가하기</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">새 자산 등록</span>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  닫기
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="자산명 (예: 삼성전자, 토스뱅크 등)"
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="KRW">원화 (KRW)</option>
                    <option value="USD">달러 (USD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newPrincipal}
                  onChange={(e) => setNewPrincipal(e.target.value)}
                  placeholder="투자 원금"
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-right"
                />
                <input
                  type="text"
                  value={newCurrentValue}
                  onChange={(e) => setNewCurrentValue(e.target.value)}
                  placeholder="현재 평가액"
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-right"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                >
                  자산 추가
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            * 변동 없는 항목은 이전 날짜의 최신 정보가 그대로 보존됩니다.
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? '저장 중...' : `${selectedDate} 자산 저장 완료`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
