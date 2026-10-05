import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Edit3, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  HelpCircle,
  FileText,
  CheckSquare,
  Layers,
  TrendingUp,
  X
} from 'lucide-react';
import { ASSET_CATEGORIES, CATEGORY_BADGES, CATEGORY_COLORS } from '../utils/constants';
import { formatKRW, formatUSD, calculateReturn } from '../utils/formatters';

export function AssetList({
  assets = [],
  totalValue = 0,
  onOpenEditModal,
  onOpenAddModal,
  onSeedSampleAssets,
  colorMode = 'korean'
}) {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('currentValue');
  const [sortDirection, setSortDirection] = useState('desc');

  // 1. 선택(Selection) 상태 및 선택 자산 전용 필터
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());
  const [filterSelectedOnly, setFilterSelectedOnly] = useState(false);

  // 2. 필터 및 정렬 처리
  const processedAssets = useMemo(() => {
    let list = [...assets];

    // (1) 카테고리 필터
    if (selectedCategory !== '전체') {
      list = list.filter(a => a.category === selectedCategory);
    }

    // (2) 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        (a.name || '').toLowerCase().includes(q) || 
        (a.memo || '').toLowerCase().includes(q)
      );
    }

    // (3) 선택된 자산만 보기 필터
    if (filterSelectedOnly) {
      list = list.filter(a => selectedAssetIds.has(a.id));
    }

    // (4) 정렬
    list.sort((a, b) => {
      let valA, valB;
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      }

      if (sortField === 'returnRate') {
        const retA = a.principal > 0 ? ((a.currentValue - a.principal) / a.principal) : 0;
        const retB = b.principal > 0 ? ((b.currentValue - b.principal) / b.principal) : 0;
        valA = retA;
        valB = retB;
      } else {
        valA = Number(a[sortField]) || 0;
        valB = Number(b[sortField]) || 0;
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [assets, selectedCategory, searchQuery, filterSelectedOnly, selectedAssetIds, sortField, sortDirection]);

  // 3. 필터/선택된 자산 통계 계산 (전체 원금, 전체 평가액, 전체 손익, 전체 손익 %)
  const { filteredPrincipal, filteredValue, filteredProfit, filteredReturnRate } = useMemo(() => {
    const p = processedAssets.reduce((sum, a) => sum + (Number(a.principal) || 0), 0);
    const v = processedAssets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
    const profit = v - p;
    const rate = p > 0 ? (profit / p) * 100 : 0;
    return {
      filteredPrincipal: p,
      filteredValue: v,
      filteredProfit: profit,
      filteredReturnRate: rate
    };
  }, [processedAssets]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 손익 색상 판별
  const getProfitColor = (profit) => {
    if (profit === 0) return 'text-slate-400 dark:text-slate-500';
    if (colorMode === 'korean') {
      return profit > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400';
    } else {
      return profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    }
  };

  const filteredProfitColor = getProfitColor(filteredProfit);

  // 선택 조작 함수들
  const toggleSelectAsset = (id) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllVisibleSelected = useMemo(() => {
    if (processedAssets.length === 0) return false;
    return processedAssets.every(a => selectedAssetIds.has(a.id));
  }, [processedAssets, selectedAssetIds]);

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedAssetIds(prev => {
        const next = new Set(prev);
        processedAssets.forEach(a => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedAssetIds(prev => {
        const next = new Set(prev);
        processedAssets.forEach(a => next.add(a.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedAssetIds(new Set());
    setFilterSelectedOnly(false);
  };

  const toggleFilterSelectedOnly = () => {
    if (!filterSelectedOnly && selectedAssetIds.size === 0) {
      // 선택된 항목이 없으면 현재 화면에 표시된 항목 전체를 자동 선택 후 필터링
      const allVisibleIds = new Set(processedAssets.map(a => a.id));
      setSelectedAssetIds(allVisibleIds);
      setFilterSelectedOnly(true);
    } else {
      setFilterSelectedOnly(prev => !prev);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
      
      {/* Top Header & Search */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              보유 자산 목록
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {processedAssets.length}개 / 전체 {assets.length}개
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="hidden sm:inline">체크박스로 자산을 다중 선택하거나, 행을 더블클릭하여 수정할 수 있습니다.</span>
              <span className="sm:hidden">항목을 탭하면 상세 확인 및 수정이 가능합니다.</span>
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="자산명 또는 메모 검색..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs, Selection Filter & Sort Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['전체', ...ASSET_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Right Controls: Selection Filter Button & Sort */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto text-xs">
            
            {/* Selection Filter Button (선택된 자산만 보기 토글) */}
            <button
              type="button"
              onClick={toggleFilterSelectedOnly}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                filterSelectedOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                  : selectedAssetIds.size > 0
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="체크박스로 선택한 자산만 모아서 보기"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>선택 자산만 보기</span>
              {selectedAssetIds.size > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterSelectedOnly ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
                }`}>
                  {selectedAssetIds.size}
                </span>
              )}
            </button>

            {/* Clear Selection Button */}
            {selectedAssetIds.size > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                title="선택 해제"
              >
                선택 해제
              </button>
            )}

            {/* Sort Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="shrink-0 px-1.5 text-slate-400 text-[11px] font-medium hidden sm:inline">
                정렬:
              </span>
              <button
                onClick={() => toggleSort('currentValue')}
                className={`px-2.5 py-1 rounded-md transition ${sortField === 'currentValue' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                평가액 {sortField === 'currentValue' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => toggleSort('returnRate')}
                className={`px-2.5 py-1 rounded-md transition ${sortField === 'returnRate' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                수익률 {sortField === 'returnRate' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => toggleSort('name')}
                className={`px-2.5 py-1 rounded-md transition ${sortField === 'name' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                이름 {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 2. 필터된 자산에 대한 수익률/손익 요약 위젯 (원금, 평가액, 손익, 손익 %) */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-xl p-3 sm:p-4 mb-4 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filterSelectedOnly 
                ? `선택된 자산 요약 (${processedAssets.length}개)`
                : selectedCategory !== '전체'
                  ? `${selectedCategory} 필터 요약 (${processedAssets.length}개)`
                  : searchQuery
                    ? `검색 결과 요약 (${processedAssets.length}개)`
                    : `전체 목록 요약 (${processedAssets.length}개)`}
            </span>
            {totalValue > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                전체 자산의 {((filteredValue / totalValue) * 100).toFixed(1)}%
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>
              {isAllVisibleSelected && processedAssets.length > 0 
                ? '현재 목록 전체 선택됨' 
                : selectedAssetIds.size > 0 
                  ? `${selectedAssetIds.size}개 항목 체크됨` 
                  : '체크박스로 자산을 개별 선택 가능'}
            </span>
          </div>
        </div>

        {/* 4대 주요 지표 카드 (원금, 평가액, 평가손익, 수익률) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-2.5">
          {/* 전체 원금 */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {filterSelectedOnly || selectedCategory !== '전체' ? '필터 투자 원금' : '전체 투자 원금'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
              {formatKRW(filteredPrincipal)}
            </span>
          </div>

          {/* 전체 평가액 */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {filterSelectedOnly || selectedCategory !== '전체' ? '필터 현재 평가액' : '전체 현재 평가액'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
              {formatKRW(filteredValue)}
            </span>
          </div>

          {/* 전체 평가 손익 */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {filterSelectedOnly || selectedCategory !== '전체' ? '필터 평가 손익' : '전체 평가 손익'}
            </span>
            <span className={`text-sm sm:text-base font-extrabold mt-0.5 block truncate ${filteredProfitColor}`}>
              {filteredProfit > 0 ? `+${formatKRW(filteredProfit)}` : formatKRW(filteredProfit)}
            </span>
          </div>

          {/* 전체 손익 % (수익률) */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {filterSelectedOnly || selectedCategory !== '전체' ? '필터 수익률' : '전체 수익률'}
            </span>
            <span className={`text-sm sm:text-base font-extrabold mt-0.5 block truncate ${filteredProfitColor}`}>
              {filteredReturnRate > 0 ? `+${filteredReturnRate.toFixed(2)}%` : `${filteredReturnRate.toFixed(2)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Content: Desktop Table vs Mobile Cards */}
      {processedAssets.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {/* Selection Checkbox Header */}
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="w-4 h-4 rounded text-sky-600 border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                      title={isAllVisibleSelected ? "전체 선택 해제" : "목록 전체 선택"}
                    />
                  </th>
                  <th className="py-3 px-4">카테고리</th>
                  <th className="py-3 px-4">자산명</th>
                  <th className="py-3 px-4 text-right">투자 원금</th>
                  <th className="py-3 px-4 text-right">현재 평가액</th>
                  <th className="py-3 px-4 text-right">평가손익</th>
                  <th className="py-3 px-4 text-right">수익률</th>
                  <th className="py-3 px-4 text-right">비중</th>
                  <th className="py-3 px-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {processedAssets.map((asset) => {
                  const profit = asset.currentValue - asset.principal;
                  const ret = calculateReturn(asset.principal, asset.currentValue);
                  const share = totalValue > 0 ? ((asset.currentValue / totalValue) * 100).toFixed(1) : 0;
                  const profitColor = getProfitColor(profit);
                  const isSelected = selectedAssetIds.has(asset.id);

                  return (
                    <tr
                      key={asset.id}
                      onDoubleClick={() => onOpenEditModal(asset)}
                      className={`transition cursor-pointer select-none group ${
                        isSelected 
                          ? 'bg-sky-50/70 dark:bg-sky-950/25 hover:bg-sky-100/60 dark:hover:bg-sky-950/40' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                      title="더블클릭하여 수정 모달 열기"
                    >
                      {/* Checkbox Cell */}
                      <td 
                        className="py-3.5 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="w-4 h-4 rounded text-sky-600 border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                        />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${CATEGORY_BADGES[asset.category] || CATEGORY_BADGES['기타']}`}>
                            {asset.category}
                          </span>
                          {asset.currency === 'USD' && (
                            <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              USD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-[180px] truncate">
                        <div className="flex items-center gap-1.5">
                          <span>{asset.name}</span>
                          {asset.memo && (
                            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" title={asset.memo} />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {formatKRW(asset.principal)}
                        </div>
                        {asset.currency === 'USD' && asset.principalUSD !== undefined && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                            {formatUSD(asset.principalUSD)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="text-slate-900 dark:text-white font-bold">
                          {formatKRW(asset.currentValue)}
                        </div>
                        {asset.currency === 'USD' && asset.currentValueUSD !== undefined && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatUSD(asset.currentValueUSD)}
                          </div>
                        )}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${profitColor}`}>
                        {profit > 0 ? `+${formatKRW(profit)}` : formatKRW(profit)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${profitColor}`}>
                        {ret.formatted}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <span>{share}%</span>
                          <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${Math.min(100, Number(share))}%`,
                                backgroundColor: CATEGORY_COLORS[asset.category] || '#38bdf8'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditModal(asset);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="자산 수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-2.5">
            {processedAssets.map((asset) => {
              const profit = asset.currentValue - asset.principal;
              const ret = calculateReturn(asset.principal, asset.currentValue);
              const share = totalValue > 0 ? ((asset.currentValue / totalValue) * 100).toFixed(1) : 0;
              const profitColor = getProfitColor(profit);
              const isSelected = selectedAssetIds.has(asset.id);

              return (
                <div
                  key={asset.id}
                  onClick={() => onOpenEditModal(asset)}
                  className={`border rounded-xl p-3.5 active:bg-slate-50 dark:active:bg-slate-800 transition cursor-pointer shadow-xs relative overflow-hidden ${
                    isSelected 
                      ? 'bg-sky-50/70 dark:bg-sky-950/25 border-sky-300 dark:border-sky-800' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Category Accent Bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1" 
                    style={{ backgroundColor: CATEGORY_COLORS[asset.category] || '#38bdf8' }}
                  />

                  <div className="flex items-start justify-between gap-2 mb-2 pl-1.5">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectAsset(asset.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-sky-600 border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer accent-sky-600 mt-0.5 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_BADGES[asset.category] || CATEGORY_BADGES['기타']}`}>
                            {asset.category}
                          </span>
                          {asset.currency === 'USD' && (
                            <span className="inline-flex px-1 py-0.2 rounded text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              USD
                            </span>
                          )}
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[170px]">
                            {asset.name}
                          </h3>
                        </div>
                        {asset.memo && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {asset.memo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-slate-400">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 pl-1.5 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">현재 평가액</span>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {formatKRW(asset.currentValue)}
                        </span>
                        {asset.currency === 'USD' && asset.currentValueUSD !== undefined && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            ({formatUSD(asset.currentValueUSD)})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        원금 {formatKRW(asset.principal)} {asset.currency === 'USD' && asset.principalUSD !== undefined ? `(${formatUSD(asset.principalUSD)})` : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">수익률 / 손익</span>
                      <span className={`font-bold text-sm ${profitColor}`}>
                        {ret.formatted}
                      </span>
                      <span className={`text-[10px] block mt-0.5 font-medium ${profitColor}`}>
                        {profit > 0 ? `+${formatKRW(profit)}` : formatKRW(profit)}
                      </span>
                    </div>
                  </div>

                  {/* Share Progress Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 pl-1.5">
                    <span>전체 자산 중 비중</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{share}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
          <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
            {filterSelectedOnly 
              ? '선택된 자산이 없습니다' 
              : searchQuery 
                ? '검색 결과가 없습니다' 
                : '등록된 자산이 없습니다'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {filterSelectedOnly
              ? '자산 목록의 체크박스를 선택하거나, [선택 자산만 보기] 필터를 해제하세요.'
              : searchQuery 
                ? '다른 검색어를 입력하시거나 카테고리 필터를 변경해 보세요.'
                : '새 자산을 등록하거나, 추천 샘플 포트폴리오를 불러와 시작해보세요.'}
          </p>
          {filterSelectedOnly ? (
            <button
              onClick={() => setFilterSelectedOnly(false)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              전체 자산 목록 보기
            </button>
          ) : !searchQuery && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>새 자산 등록하기</span>
              </button>
              {onSeedSampleAssets && (
                <button
                  onClick={onSeedSampleAssets}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>샘플 포트폴리오 로드</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
