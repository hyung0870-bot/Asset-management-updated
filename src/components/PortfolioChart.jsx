import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { CATEGORY_COLORS } from '../utils/constants';
import { formatKRW } from '../utils/formatters';

export function PortfolioChart({ assets = [], totalValue = 0 }) {
  // 카테고리별 집계
  const chartData = useMemo(() => {
    if (!assets || assets.length === 0 || totalValue === 0) return [];

    const categoryMap = {};
    assets.forEach((a) => {
      const cat = a.category || '기타';
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          name: cat,
          value: 0,
          principal: 0,
          count: 0
        };
      }
      categoryMap[cat].value += (Number(a.currentValue) || 0);
      categoryMap[cat].principal += (Number(a.principal) || 0);
      categoryMap[cat].count += 1;
    });

    return Object.values(categoryMap)
      .filter(item => item.value > 0)
      .map(item => ({
        ...item,
        percentage: ((item.value / totalValue) * 100).toFixed(1),
        profit: item.value - item.principal,
        returnRate: item.principal > 0 ? (((item.value - item.principal) / item.principal) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets, totalValue]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    const color = CATEGORY_COLORS[item.name] || '#6B7280';
    const isPositive = item.profit >= 0;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-bold mb-1.5" style={{ color }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
          <span>{item.name} ({item.percentage}%)</span>
        </div>
        <div className="space-y-1 text-slate-700 dark:text-slate-300">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">평가액:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatKRW(item.value)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">원금:</span>
            <span>{formatKRW(item.principal)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-1">
            <span className="text-slate-500 dark:text-slate-400">손익률:</span>
            <span className={`font-semibold ${isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {isPositive ? `+${item.returnRate}%` : `${item.returnRate}%`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              포트폴리오 비중 (Allocation)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              자산군별 비중 분포와 분산 수준을 확인합니다.
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Donut Chart */}
            <div className="relative w-full h-52 sm:h-56 md:col-span-5 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="65%"
                    outerRadius="88%"
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={CATEGORY_COLORS[entry.name] || '#6B7280'} 
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Total Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">총 자산</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 max-w-[120px] truncate text-center">
                  {formatKRW(totalValue)}
                </span>
              </div>
            </div>

            {/* Category Breakdown Cards */}
            <div className="md:col-span-7 space-y-2">
              {chartData.map((item) => {
                const color = CATEGORY_COLORS[item.name] || '#6B7280';
                return (
                  <div 
                    key={item.name} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {item.count}개 자산
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {formatKRW(item.value)}
                      </div>
                      <div className="text-[11px] font-bold" style={{ color }}>
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            <PieIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              등록된 자산이 없어 비중을 표시할 수 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
