import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  Coins,
  Calculator,
  Calendar
} from 'lucide-react';
import { ASSET_CATEGORIES, CATEGORY_COLORS } from '../utils/constants';
import { 
  formatKRW, 
  formatUSD, 
  parseNumberInput, 
  parseFloatInput, 
  calculateReturn,
  evaluateMathExpression,
  isMathExpression
} from '../utils/formatters';
import { getUSDKRWRate } from '../services/exchangeRateService';

export function AssetModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAsset = null,
  colorMode = 'korean',
  targetDate = null
}) {
  const isEditMode = Boolean(initialAsset);

  // 기본 폼 상태
  const [category, setCategory] = useState('현금/예금');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('KRW');
  const [exchangeRate, setExchangeRate] = useState(1350);
  const [rateDate, setRateDate] = useState('');
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  // 원화 입력값 (수식 문자열 허용)
  const [principalStr, setPrincipalStr] = useState('');
  const [currentValueStr, setCurrentValueStr] = useState('');

  // 달러 입력값 (수식 문자열 허용)
  const [principalUSDStr, setPrincipalUSDStr] = useState('');
  const [currentValueUSDStr, setCurrentValueUSDStr] = useState('');

  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 환율 조회 함수
  const fetchRate = async (dateStr) => {
    try {
      setIsLoadingRate(true);
      const res = await getUSDKRWRate(dateStr);
      setExchangeRate(res.rate);
      setRateDate(res.date);
    } catch (err) {
      console.error('환율 조회 실패:', err);
    } finally {
      setIsLoadingRate(false);
    }
  };

  // 모달 오픈 시 초기값 설정
  useEffect(() => {
    if (!isOpen) return;

    if (initialAsset) {
      setCategory(initialAsset.category || '기타');
      setName(initialAsset.name || '');
      const assetCurrency = initialAsset.currency || 'KRW';
      setCurrency(assetCurrency);

      if (assetCurrency === 'USD') {
        const rate = initialAsset.exchangeRate || 1350;
        setExchangeRate(rate);
        setPrincipalUSDStr(initialAsset.principalUSD !== undefined && initialAsset.principalUSD !== null ? String(initialAsset.principalUSD) : '');
        setCurrentValueUSDStr(initialAsset.currentValueUSD !== undefined && initialAsset.currentValueUSD !== null ? String(initialAsset.currentValueUSD) : '');
        setPrincipalStr(initialAsset.principal ? formatKRW(initialAsset.principal, false) : '');
        setCurrentValueStr(initialAsset.currentValue ? formatKRW(initialAsset.currentValue, false) : '');
      } else {
        setPrincipalStr(initialAsset.principal ? formatKRW(initialAsset.principal, false) : '0');
        setCurrentValueStr(initialAsset.currentValue ? formatKRW(initialAsset.currentValue, false) : '0');
        setPrincipalUSDStr('');
        setCurrentValueUSDStr('');
      }

      setMemo(initialAsset.memo || '');
    } else {
      setCategory('현금/예금');
      setName('');
      setCurrency('KRW');
      setPrincipalStr('');
      setCurrentValueStr('');
      setPrincipalUSDStr('');
      setCurrentValueUSDStr('');
      setMemo('');
    }

    setErrorMessage('');
    setIsSubmitting(false);

    fetchRate();
  }, [initialAsset, isOpen]);

  if (!isOpen) return null;

  // 값 파싱
  const resolveCalculatedNumber = (inputStr, isUSD = false) => {
    if (!inputStr) return 0;
    const mathVal = evaluateMathExpression(inputStr);
    if (mathVal !== null && !isNaN(mathVal) && isFinite(mathVal)) {
      return isUSD ? mathVal : Math.round(mathVal);
    }
    return isUSD ? parseFloatInput(inputStr) : parseNumberInput(inputStr);
  };

  // 통화 전환 핸들러
  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === currency) return;
    setCurrency(newCurrency);

    if (newCurrency === 'USD') {
      const pKRW = resolveCalculatedNumber(principalStr, false);
      const vKRW = resolveCalculatedNumber(currentValueStr, false);
      if (pKRW > 0 && exchangeRate > 0) {
        setPrincipalUSDStr((pKRW / exchangeRate).toFixed(2));
      }
      if (vKRW > 0 && exchangeRate > 0) {
        setCurrentValueUSDStr((vKRW / exchangeRate).toFixed(2));
      }
      fetchRate();
    } else {
      const pUSD = resolveCalculatedNumber(principalUSDStr, true);
      const vUSD = resolveCalculatedNumber(currentValueUSDStr, true);
      if (pUSD > 0 && exchangeRate > 0) {
        setPrincipalStr(formatKRW(Math.round(pUSD * exchangeRate), false));
      }
      if (vUSD > 0 && exchangeRate > 0) {
        setCurrentValueStr(formatKRW(Math.round(vUSD * exchangeRate), false));
      }
    }
  };

  // --- 원화 입력 핸들러 ---
  const handlePrincipalKRWChange = (e) => {
    const raw = e.target.value.replace(/[^0-9+\-*/().,\s]/g, '');
    setPrincipalStr(raw);
  };

  const handlePrincipalKRWBlur = () => {
    const calculated = resolveCalculatedNumber(principalStr, false);
    if (calculated > 0 || principalStr.trim() !== '') {
      setPrincipalStr(formatKRW(calculated, false));
    }
  };

  const handleCurrentValueKRWChange = (e) => {
    const raw = e.target.value.replace(/[^0-9+\-*/().,\s]/g, '');
    setCurrentValueStr(raw);
  };

  const handleCurrentValueKRWBlur = () => {
    const calculated = resolveCalculatedNumber(currentValueStr, false);
    if (calculated > 0 || currentValueStr.trim() !== '') {
      setCurrentValueStr(formatKRW(calculated, false));
    }
  };

  const addAmountToPrincipalKRW = (amount) => {
    const current = resolveCalculatedNumber(principalStr, false);
    setPrincipalStr(formatKRW(current + amount, false));
  };

  const addAmountToCurrentValueKRW = (amount) => {
    const current = resolveCalculatedNumber(currentValueStr, false);
    setCurrentValueStr(formatKRW(current + amount, false));
  };

  // --- 달러 입력 핸들러 ---
  const handlePrincipalUSDChange = (e) => {
    const raw = e.target.value.replace(/[^0-9+\-*/().,\s]/g, '');
    setPrincipalUSDStr(raw);
  };

  const handlePrincipalUSDBlur = () => {
    const calculated = resolveCalculatedNumber(principalUSDStr, true);
    if (calculated > 0 || principalUSDStr.trim() !== '') {
      setPrincipalUSDStr(Number.isInteger(calculated) ? String(calculated) : calculated.toFixed(2));
    }
  };

  const handleCurrentValueUSDChange = (e) => {
    const raw = e.target.value.replace(/[^0-9+\-*/().,\s]/g, '');
    setCurrentValueUSDStr(raw);
  };

  const handleCurrentValueUSDBlur = () => {
    const calculated = resolveCalculatedNumber(currentValueUSDStr, true);
    if (calculated > 0 || currentValueUSDStr.trim() !== '') {
      setCurrentValueUSDStr(Number.isInteger(calculated) ? String(calculated) : calculated.toFixed(2));
    }
  };

  const addAmountToPrincipalUSD = (amount) => {
    const current = resolveCalculatedNumber(principalUSDStr, true);
    setPrincipalUSDStr((current + amount).toFixed(2));
  };

  const addAmountToCurrentValueUSD = (amount) => {
    const current = resolveCalculatedNumber(currentValueUSDStr, true);
    setCurrentValueUSDStr((current + amount).toFixed(2));
  };

  const syncCurrentValueWithPrincipal = () => {
    if (currency === 'USD') {
      const p = resolveCalculatedNumber(principalUSDStr, true);
      setCurrentValueUSDStr(Number.isInteger(p) ? String(p) : p.toFixed(2));
    } else {
      const p = resolveCalculatedNumber(principalStr, false);
      setCurrentValueStr(formatKRW(p, false));
    }
  };

  // 실시간 최종 금액 계산
  let finalPrincipalKRW = 0;
  let finalValueKRW = 0;
  let finalPrincipalUSD = 0;
  let finalValueUSD = 0;

  if (currency === 'USD') {
    finalPrincipalUSD = resolveCalculatedNumber(principalUSDStr, true);
    finalValueUSD = resolveCalculatedNumber(currentValueUSDStr, true);
    finalPrincipalKRW = Math.round(finalPrincipalUSD * exchangeRate);
    finalValueKRW = Math.round(finalValueUSD * exchangeRate);
  } else {
    finalPrincipalKRW = resolveCalculatedNumber(principalStr, false);
    finalValueKRW = resolveCalculatedNumber(currentValueStr, false);
    finalPrincipalUSD = exchangeRate > 0 ? (finalPrincipalKRW / exchangeRate) : 0;
    finalValueUSD = exchangeRate > 0 ? (finalValueKRW / exchangeRate) : 0;
  }

  const profitKRW = finalValueKRW - finalPrincipalKRW;
  const profitUSD = finalValueUSD - finalPrincipalUSD;
  const returnInfo = calculateReturn(
    currency === 'USD' ? finalPrincipalUSD : finalPrincipalKRW,
    currency === 'USD' ? finalValueUSD : finalValueKRW
  );

  // 저장 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('자산 이름을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        category,
        name: name.trim(),
        currency,
        exchangeRate: currency === 'USD' ? Number(exchangeRate) : null,
        principalUSD: currency === 'USD' ? finalPrincipalUSD : null,
        currentValueUSD: currency === 'USD' ? finalValueUSD : null,
        principal: finalPrincipalKRW,
        currentValue: finalValueKRW,
        memo: memo.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPositive = returnInfo.isPositive;
  const isZero = returnInfo.isZero;
  const profitColor = isZero 
    ? 'text-slate-400 dark:text-slate-500' 
    : (colorMode === 'korean' ? (isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400') : (isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: CATEGORY_COLORS[category] || '#38bdf8' }}
              />
              <span>{isEditMode ? '자산 상세 정보 및 수정' : '새 자산 등록'}</span>
            </h2>
            {targetDate && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>기준일자: {targetDate}</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. 통화 단위 선택 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>입력 통화 단위</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1">
                <Calculator className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>금액란에 사칙연산 (+,-,*,/) 입력 가능</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCurrencyChange('KRW')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  currency === 'KRW'
                    ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-400 dark:border-sky-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>원화 (KRW ₩)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCurrencyChange('USD')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  currency === 'USD'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>달러 (USD $)</span>
              </button>
            </div>
          </div>

          {/* 달러 선택 시 환율 박스 */}
          {currency === 'USD' && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  적용 환율 (USD/KRW)
                </span>
                <button
                  type="button"
                  onClick={() => fetchRate()}
                  disabled={isLoadingRate}
                  className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline transition"
                  title="최신 환율 새로고침"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingRate ? 'animate-spin' : ''}`} />
                  <span>{isLoadingRate ? '불러오는 중...' : '환율 갱신'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-800 dark:text-slate-200 font-semibold">$1 =</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-right pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    원
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>* 해당일 기준 환율 자동 조회됨 (직접 수정 가능)</span>
                {rateDate && <span>기준일: {rateDate}</span>}
              </div>
            </div>
          )}

          {/* 2. 카테고리 선택 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              자산 카테고리
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {ASSET_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition ${
                    category === cat
                      ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-400 dark:border-sky-500 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 자산 이름 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              자산명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={currency === 'USD' ? '예: Apple (AAPL), Nvidia (NVDA), 테슬라' : '예: 삼성전자, 토스뱅크 예금, 비트코인 등'}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-medium"
            />
          </div>

          {/* 4. 투자 원금 입력 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>투자 원금 {currency === 'USD' ? '(USD $)' : '(KRW ₩)'}</span>
              </label>
              
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                {currency === 'USD' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => addAmountToPrincipalUSD(100)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      +$100
                    </button>
                    <button
                      type="button"
                      onClick={() => addAmountToPrincipalUSD(1000)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      +$1K
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => addAmountToPrincipalKRW(100000)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      +10만
                    </button>
                    <button
                      type="button"
                      onClick={() => addAmountToPrincipalKRW(1000000)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      +100만
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              {currency === 'USD' ? (
                <>
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="text"
                    value={principalUSDStr}
                    onChange={handlePrincipalUSDChange}
                    onBlur={handlePrincipalUSDBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    placeholder="예: 3000-120.5 (사칙연산 가능)"
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-right"
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="text"
                    value={principalStr}
                    onChange={handlePrincipalKRWChange}
                    onBlur={handlePrincipalKRWBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    placeholder="예: 3000000-120638 (사칙연산 가능)"
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition text-right pr-9"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    원
                  </span>
                </>
              )}
            </div>

            {/* 수식 프리뷰 */}
            {currency === 'KRW' && isMathExpression(principalStr) && (
              <div className="flex items-center gap-1.5 text-[11px] text-sky-700 dark:text-sky-300 font-semibold mt-1.5 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-500/20 w-fit">
                <Calculator className="w-3.5 h-3.5 shrink-0" />
                <span>계산 결과: <strong>{formatKRW(finalPrincipalKRW)}</strong></span>
              </div>
            )}

            {currency === 'USD' && isMathExpression(principalUSDStr) && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 w-fit">
                <Calculator className="w-3.5 h-3.5 shrink-0" />
                <span>계산 결과: <strong>{formatUSD(finalPrincipalUSD)}</strong></span>
              </div>
            )}
          </div>

          {/* 5. 현재 평가액 입력 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                현재 평가액 {currency === 'USD' ? '(USD $)' : '(KRW ₩)'}
              </label>

              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={syncCurrentValueWithPrincipal}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sky-700 dark:text-sky-400 font-medium border border-slate-200 dark:border-slate-700"
                >
                  원금과 동일
                </button>
                {currency === 'USD' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => addAmountToCurrentValueUSD(100)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      +$100
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => addAmountToCurrentValueKRW(100000)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      +10만
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              {currency === 'USD' ? (
                <>
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="text"
                    value={currentValueUSDStr}
                    onChange={handleCurrentValueUSDChange}
                    onBlur={handleCurrentValueUSDBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    placeholder="예: 3200+150 (사칙연산 가능)"
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-right"
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="text"
                    value={currentValueStr}
                    onChange={handleCurrentValueKRWChange}
                    onBlur={handleCurrentValueKRWBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    placeholder="예: 3200000-150000 (사칙연산 가능)"
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition text-right pr-9"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    원
                  </span>
                </>
              )}
            </div>

            {/* 수식 프리뷰 */}
            {currency === 'KRW' && isMathExpression(currentValueStr) && (
              <div className="flex items-center gap-1.5 text-[11px] text-sky-700 dark:text-sky-300 font-semibold mt-1.5 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-500/20 w-fit">
                <Calculator className="w-3.5 h-3.5 shrink-0" />
                <span>계산 결과: <strong>{formatKRW(finalValueKRW)}</strong></span>
              </div>
            )}

            {currency === 'USD' && isMathExpression(currentValueUSDStr) && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 w-fit">
                <Calculator className="w-3.5 h-3.5 shrink-0" />
                <span>계산 결과: <strong>{formatUSD(finalValueUSD)}</strong></span>
              </div>
            )}
          </div>

          {/* 6. 실시간 예상 손익 */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">예상 평가 손익:</span>
              {currency === 'USD' && (
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  달러: {profitUSD > 0 ? `+${formatUSD(profitUSD)}` : formatUSD(profitUSD)}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className={`font-black mr-2 text-sm ${profitColor}`}>
                {profitKRW > 0 ? `+${formatKRW(profitKRW)}` : formatKRW(profitKRW)}
              </span>
              <span className={`font-black px-2 py-0.5 rounded text-xs ${
                isZero 
                  ? 'bg-slate-200 text-slate-600' 
                  : (isPositive ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300')
              }`}>
                {returnInfo.formatted}
              </span>
            </div>
          </div>

          {/* 7. 투자 메모 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              투자 메모 (선택)
            </label>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="매수 사유, 목표가, 배당 주기 등을 기록하세요."
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {isEditMode ? (
              <button
                type="button"
                onClick={() => onDelete(initialAsset.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>삭제</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 transition disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? '저장 중...' : isEditMode ? '변경사항 저장' : '자산 추가'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
