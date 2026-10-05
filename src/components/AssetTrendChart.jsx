import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend 
} from 'recharts';
import { Calendar, Sparkles, PlusCircle } from 'lucide-react';
import { formatKRW, formatShortDate } from '../utils/formatters';

const PERIOD_OPTIONS = [
  { label: '1주일', days: 7 },
  { label: '1개월', days: 30 },
  { label: '3개월', days: 90 },
  { label: '6개월', days: 180 },
  { label: '전체', days: 0 },
];

export function AssetTrendChart({ 
  history = [], 
  onSeedSampleHistory, 
  onSaveCurrentSnapshot,
  isSnapshotting 
}) {
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const filteredData = useMemo(() => {
    if (!history || history.length === 0) return [];
    if (selectedPeriod === 0) return history;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedPeriod);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const filtered = history.filter(item => item.date >= cutoffStr);
    return filtered.length > 0 ? filtered : history;
  }, [history, selectedPeriod]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0]?.payload;
    if (!item) return null;

    const principal = item.totalPrincipal || 0;
    const value = item.totalValue || 0;
    const profit = value - principal;
    const returnRate = principal > 0 ? ((profit / principal) * 100).toFixed(2) : '0.00';
    const isPositive = profit >= 0;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xl text-xs sm:text-sm">
        <div className="font-semibold text-slate-900 dark:text-white mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
          <span>{item.date}</span>
          <span className={`font-bold ml-2 ${isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {isPositive ? `+${returnRate}%` : `${returnRate}%`}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
              총 평가액:
            </span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{formatKRW(value)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
              총 투자 원금:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKRW(principal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500">당시 손익:</span>
            <span className={`font-semibold ${isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {profit > 0 ? `+${formatKRW(profit)}` : formatKRW(profit)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            자산 변동 추이 (Asset Trend)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            총 평가액과 원금의 격차를 통해 누적 손익 추이를 확인합니다.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto overflow-x-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSelectedPeriod(opt.days)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                selectedPeriod === opt.days
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {filteredData.length >= 2 ? (
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" opacity={0.8} vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatShortDate} 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
                  if (val >= 10000) return `${Math.round(val / 10000)}만`;
                  return val;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                formatter={(val) => <span className="text-slate-700 dark:text-slate-300 font-medium">{val}</span>}
              />
              <Area
                name="총 평가액"
                type="monotone"
                dataKey="totalValue"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#valueGradient)"
              />
              <Area
                name="총 투자 원금"
                type="monotone"
                dataKey="totalPrincipal"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#principalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-100 dark:border-sky-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
            아직 축적된 변동 추이 스냅샷이 부족합니다 ({filteredData.length}/2개)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            자산을 변경할 때마다 당일 스냅샷이 자동 저장되며, 아래 버튼으로 현재 시점 스냅샷을 저장하거나 시뮬레이션 히스토리를 로드하여 테스트할 수 있습니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onSaveCurrentSnapshot}
              disabled={isSnapshotting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>현재 시점 스냅샷 저장</span>
            </button>
            <button
              onClick={onSeedSampleHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>시뮬레이션 히스토리 생성</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
