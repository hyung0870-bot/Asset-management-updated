import React from 'react';
import { 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { formatKRW } from '../utils/formatters';

export function SummaryCards({ 
  totalPrincipal, 
  totalValue, 
  colorMode = 'korean' // 'korean' (상승: 빨강, 하락: 파랑) or 'global' (상승: 초록, 하락: 빨강)
}) {
  const profit = totalValue - totalPrincipal;
  const returnRate = totalPrincipal > 0 ? (profit / totalPrincipal) * 100 : 0;
  const isPositive = profit > 0;
  const isZero = profit === 0;

  // 손익 텍스트 색상
  const getProfitColorClasses = () => {
    if (isZero) return 'text-slate-500 dark:text-slate-400';
    if (colorMode === 'korean') {
      return isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400';
    } else {
      return isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    }
  };

  // 손익 아이콘 배지 색상
  const getProfitBadgeClasses = () => {
    if (isZero) return 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';
    if (colorMode === 'korean') {
      return isPositive 
        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' 
        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
    } else {
      return isPositive 
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
    }
  };

  const profitTextColor = getProfitColorClasses();
  const profitBadgeColor = getProfitBadgeClasses();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. 총 자산 평가액 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">총 평가액</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
          {formatKRW(totalValue)}
        </div>
        <div className="mt-1 flex items-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
          <span>실시간 합산 자산</span>
        </div>
      </div>

      {/* 2. 총 투자 원금 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">총 투자 원금</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
          {formatKRW(totalPrincipal)}
        </div>
        <div className="mt-1 flex items-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
          <span>납입 및 매수 원금</span>
        </div>
      </div>

      {/* 3. 총 평가 손익 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">총 평가 손익</span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${profitBadgeColor}`}>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-lg sm:text-2xl font-black tracking-tight truncate ${profitTextColor}`}>
          {profit > 0 ? `+${formatKRW(profit)}` : formatKRW(profit)}
        </div>
        <div className="mt-1 flex items-center text-[11px] sm:text-xs">
          <span className={`inline-flex items-center font-bold ${profitTextColor}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : !isZero ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : null}
            {isPositive ? '순수익 상태' : isZero ? '변동 없음' : '손실 상태'}
          </span>
        </div>
      </div>

      {/* 4. 총 수익률 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">총 수익률</span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${profitBadgeColor}`}>
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-lg sm:text-2xl font-black tracking-tight truncate ${profitTextColor}`}>
          {returnRate > 0 ? `+${returnRate.toFixed(2)}%` : `${returnRate.toFixed(2)}%`}
        </div>
        <div className="mt-1 flex items-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
          <span>원금 대비 총 누적 수익률</span>
        </div>
      </div>
    </div>
  );
}
