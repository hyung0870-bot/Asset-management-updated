import { ref, onValue, set, push, update, remove, get } from "firebase/database";
import { db } from "../firebase";
import { formatDate } from "../utils/formatters";

/**
 * 실시간 자산 목록 구독
 * @param {(assets: Array) => void} callback 
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
export function subscribeAssets(callback, onError) {
  const assetsRef = ref(db, "assets");
  return onValue(assetsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const assetList = Object.entries(data).map(([key, val]) => ({
      ...val,
      id: key,
      principal: Number(val.principal) || 0,
      currentValue: Number(val.currentValue) || 0,
      principalUSD: val.principalUSD !== undefined ? Number(val.principalUSD) : null,
      currentValueUSD: val.currentValueUSD !== undefined ? Number(val.currentValueUSD) : null,
      exchangeRate: val.exchangeRate ? Number(val.exchangeRate) : null,
    }));
    callback(assetList);
  }, (error) => {
    console.error("Error subscribing to assets:", error);
    if (onError) onError(error);
  });
}

/**
 * 실시간 히스토리 스냅샷 목록 구독
 * @param {(history: Array) => void} callback 
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
export function subscribeHistory(callback, onError) {
  const historyRef = ref(db, "history");
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const historyList = Object.entries(data).map(([key, val]) => {
      // assets 배열 또는 객체 정규화
      let assets = [];
      if (val.assets) {
        if (Array.isArray(val.assets)) {
          assets = val.assets;
        } else if (typeof val.assets === 'object') {
          assets = Object.values(val.assets);
        }
      }

      return {
        ...val,
        id: key,
        date: val.date || key,
        totalPrincipal: Number(val.totalPrincipal) || 0,
        totalValue: Number(val.totalValue) || 0,
        assets: assets.map(a => ({
          ...a,
          principal: Number(a.principal) || 0,
          currentValue: Number(a.currentValue) || 0,
          principalUSD: a.principalUSD !== undefined ? Number(a.principalUSD) : null,
          currentValueUSD: a.currentValueUSD !== undefined ? Number(a.currentValueUSD) : null,
        }))
      };
    });

    // 날짜 오름차순 정렬
    historyList.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    callback(historyList);
  }, (error) => {
    console.error("Error subscribing to history:", error);
    if (onError) onError(error);
  });
}

function wrapFirebaseError(error) {
  if (error && (error.code === 'PERMISSION_DENIED' || String(error).toLowerCase().includes('permission_denied') || String(error).toLowerCase().includes('permission denied'))) {
    return new Error("Firebase 보안 규칙 권한 거부(PERMISSION_DENIED): Firebase 콘솔 > Realtime Database > 규칙(Rules)에서 읽기/쓰기를 true로 설정해주세요.");
  }
  return error;
}

/**
 * 특정 기준 날짜(dateStr) 이전의 가장 최신 날짜 자산 목록 탐색
 * @param {string} targetDate YYYY-MM-DD
 * @param {Array} historyList 정렬된 히스토리 목록
 * @param {Array} fallbackAssets 히스토리가 없을 때 대체할 최신 자산 목록
 * @returns {{ assets: Array, sourceDate: string|null }}
 */
export function getLatestAssetsBeforeDate(targetDate, historyList = [], fallbackAssets = []) {
  // 1. targetDate와 정확히 일치하는 날짜에 assets가 이미 저장되어 있는 경우
  const exactMatch = historyList.find(h => h.date === targetDate && h.assets && h.assets.length > 0);
  if (exactMatch) {
    return {
      assets: exactMatch.assets,
      sourceDate: exactMatch.date,
      isExactMatch: true
    };
  }

  // 2. targetDate 이전의 날짜 중 가장 최신 날짜 역순 탐색
  const pastHistories = historyList
    .filter(h => h.date < targetDate && h.assets && h.assets.length > 0)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "")); // 내림차순 정렬

  if (pastHistories.length > 0) {
    return {
      assets: pastHistories[0].assets,
      sourceDate: pastHistories[0].date,
      isExactMatch: false
    };
  }

  // 3. 이전 기록이 없으면 현재 전체 자산(fallbackAssets) 사용
  return {
    assets: fallbackAssets || [],
    sourceDate: fallbackAssets.length > 0 ? '현재 최신 자산' : null,
    isExactMatch: false
  };
}

/**
 * Firebase Realtime Database에서 키(Key)로 사용할 수 없는 문자
 * ('.', '#', '$', '/', '[', ']')를 언더스코어('_')로 치환합니다.
 */
export function sanitizeFirebaseKey(key) {
  if (!key) return 'unknown';
  return String(key).replace(/[\.\#\$\/\[\]]/g, '_');
}

/**
 * 특정 날짜에 대한 자산 스냅샷 저장 (자산 배열 포함)
 * @param {string} dateStr 기준일자 (YYYY-MM-DD)
 * @param {Array} assetsList 저장할 자산 목록
 * @param {boolean} syncToGlobalAssets 최상위 /assets 컬렉션 동기화 여부
 */
export async function saveSnapshotForDate(dateStr, assetsList, syncToGlobalAssets = true) {
  const totalPrincipal = assetsList.reduce((sum, a) => sum + (Number(a.principal) || 0), 0);
  const totalValue = assetsList.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);

  const categoryBreakdown = {};
  assetsList.forEach((a) => {
    const rawCat = a.category || '기타';
    const safeCat = sanitizeFirebaseKey(rawCat);
    categoryBreakdown[safeCat] = (categoryBreakdown[safeCat] || 0) + (Number(a.currentValue) || 0);
  });

  const now = new Date().toISOString();
  const cleanedAssets = assetsList.map((a, idx) => ({
    id: sanitizeFirebaseKey(a.id || `asset_${Date.now()}_${idx}`),
    category: a.category || '기타',
    name: (a.name || '').trim(),
    currency: a.currency || 'KRW',
    exchangeRate: a.exchangeRate ? Number(a.exchangeRate) : null,
    principalUSD: a.principalUSD !== undefined && a.principalUSD !== null ? Number(a.principalUSD) : null,
    currentValueUSD: a.currentValueUSD !== undefined && a.currentValueUSD !== null ? Number(a.currentValueUSD) : null,
    principal: Number(a.principal) || 0,
    currentValue: Number(a.currentValue) || 0,
    memo: a.memo ? a.memo.trim() : '',
    updatedAt: a.updatedAt || now,
  }));

  const snapshotRef = ref(db, `history/${dateStr}`);
  const payload = {
    id: dateStr,
    date: dateStr,
    timestamp: Date.now(),
    totalPrincipal,
    totalValue,
    categoryBreakdown,
    assets: cleanedAssets
  };

  try {
    await set(snapshotRef, payload);

    // 최신 날짜이거나 오늘 날짜일 때 최상위 /assets 컬렉션도 동기화
    const today = formatDate(new Date());
    if (syncToGlobalAssets && dateStr >= today) {
      const assetsObject = {};
      cleanedAssets.forEach((item) => {
        const safeId = sanitizeFirebaseKey(item.id);
        assetsObject[safeId] = { ...item, id: safeId };
      });
      await set(ref(db, "assets"), assetsObject);
    }
  } catch (error) {
    throw wrapFirebaseError(error);
  }

  return payload;
}

/**
 * 당일 스냅샷 저장/갱신
 * @param {Array} assets 현재 자산 목록
 */
export async function saveTodaySnapshot(assets) {
  const today = formatDate(new Date());
  return await saveSnapshotForDate(today, assets, true);
}

/**
 * 새 자산 생성 및 당일/지정일 스냅샷 갱신
 * @param {Object} asset 
 * @param {string} targetDate 
 */
export async function createAsset(asset, targetDate = null) {
  const assetsRef = ref(db, "assets");
  const newAssetRef = push(assetsRef);
  const newId = newAssetRef.key;
  const now = new Date().toISOString();

  const payload = {
    id: newId,
    category: asset.category || '기타',
    name: asset.name.trim(),
    currency: asset.currency || 'KRW',
    exchangeRate: Number(asset.exchangeRate) || 0,
    principalUSD: Number(asset.principalUSD) || 0,
    currentValueUSD: Number(asset.currentValueUSD) || 0,
    principal: Number(asset.principal) || 0,
    currentValue: Number(asset.currentValue) || 0,
    memo: asset.memo ? asset.memo.trim() : '',
    updatedAt: now,
  };

  try {
    await set(newAssetRef, payload);
  } catch (error) {
    throw wrapFirebaseError(error);
  }

  const dateToSave = targetDate || formatDate(new Date());
  try {
    const allSnap = await get(ref(db, "assets"));
    const allData = allSnap.val() || {};
    const allList = Object.values(allData);
    await saveSnapshotForDate(dateToSave, allList, true);
  } catch (e) {
    console.error("Failed to auto-update snapshot after create:", e);
  }

  return newId;
}

/**
 * 자산 정보 수정 및 당일/지정일 스냅샷 갱신
 * @param {string} id 
 * @param {Object} asset 
 * @param {string} targetDate
 */
export async function updateAsset(id, asset, targetDate = null) {
  const assetRef = ref(db, `assets/${id}`);
  const now = new Date().toISOString();

  const payload = {
    category: asset.category || '기타',
    name: asset.name.trim(),
    currency: asset.currency || 'KRW',
    exchangeRate: Number(asset.exchangeRate) || 0,
    principalUSD: Number(asset.principalUSD) || 0,
    currentValueUSD: Number(asset.currentValueUSD) || 0,
    principal: Number(asset.principal) || 0,
    currentValue: Number(asset.currentValue) || 0,
    memo: asset.memo ? asset.memo.trim() : '',
    updatedAt: now,
  };

  try {
    await update(assetRef, payload);
  } catch (error) {
    throw wrapFirebaseError(error);
  }

  const dateToSave = targetDate || formatDate(new Date());
  try {
    const allSnap = await get(ref(db, "assets"));
    const allData = allSnap.val() || {};
    const allList = Object.values(allData);
    await saveSnapshotForDate(dateToSave, allList, true);
  } catch (e) {
    console.error("Failed to auto-update snapshot after update:", e);
  }
}

/**
 * 자산 삭제 및 당일/지정일 스냅샷 갱신
 * @param {string} id 
 * @param {string} targetDate
 */
export async function deleteAsset(id, targetDate = null) {
  const assetRef = ref(db, `assets/${id}`);
  try {
    await remove(assetRef);
  } catch (error) {
    throw wrapFirebaseError(error);
  }

  const dateToSave = targetDate || formatDate(new Date());
  try {
    const allSnap = await get(ref(db, "assets"));
    const allData = allSnap.val() || {};
    const allList = Object.values(allData);
    await saveSnapshotForDate(dateToSave, allList, true);
  } catch (e) {
    console.error("Failed to auto-update snapshot after delete:", e);
  }
}

/**
 * 초기 시뮬레이션 샘플 히스토리 생성 (테스트 및 초기 사용자용)
 * @param {Array} currentAssets 
 */
export async function seedSampleHistory(currentAssets) {
  const totalPrincipal = currentAssets.reduce((sum, a) => sum + (Number(a.principal) || 0), 0) || 50000000;
  const currentVal = currentAssets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0) || 58000000;

  const snapshots = {};
  const today = new Date();
  const steps = 14;

  for (let i = steps; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i * 4));
    const dateStr = formatDate(d);
    
    const progress = (steps - i) / steps;
    const baseP = Math.round(totalPrincipal * (0.85 + progress * 0.15));
    const variation = (Math.sin(i * 1.3) * 0.04) + (progress * 0.12) - 0.03;
    const baseV = Math.round(baseP * (1 + variation));

    // 개별 자산 비례 스냅샷 생성
    const snapAssets = currentAssets.map(a => {
      const ratio = currentVal > 0 ? (a.currentValue / currentVal) : 0.2;
      return {
        ...a,
        principal: Math.round(baseP * ratio),
        currentValue: i === 0 ? a.currentValue : Math.round(baseV * ratio),
        updatedAt: d.toISOString()
      };
    });

    snapshots[dateStr] = {
      id: dateStr,
      date: dateStr,
      timestamp: d.getTime(),
      totalPrincipal: baseP,
      totalValue: i === 0 ? currentVal : baseV,
      categoryBreakdown: {
        '현금_예금': Math.round(baseV * 0.25),
        '국내주식': Math.round(baseV * 0.30),
        '해외주식': Math.round(baseV * 0.35),
        '가상자산': Math.round(baseV * 0.10),
      },
      assets: snapAssets
    };
  }

  const historyRef = ref(db, "history");
  await update(historyRef, snapshots);
}

/**
 * 자산 데이터가 비어있을 때 샘플 포트폴리오를 채우는 헬퍼
 */
export async function seedSampleAssets() {
  const sampleItems = [
    {
      category: '현금/예금',
      name: '토스뱅크 모임통장 / 파킹통장',
      principal: 15000000,
      currentValue: 15120000,
      memo: '비상금 및 생활비 완충용 2%대 예금'
    },
    {
      category: '국내주식',
      name: '삼성전자 (005930)',
      principal: 12000000,
      currentValue: 10800000,
      memo: '반도체 사이클 회복 기대 분할매수 중'
    },
    {
      category: '해외주식',
      name: 'VOO (Vanguard S&P 500 ETF)',
      principal: 20000000,
      currentValue: 24500000,
      memo: '미국 지수추종 코어 포트폴리오'
    },
    {
      category: '해외주식',
      name: 'Apple (AAPL)',
      principal: 8000000,
      currentValue: 9200000,
      memo: 'AI 인텔리전스 생태계 수혜'
    },
    {
      category: '가상자산',
      name: '비트코인 (BTC)',
      principal: 5000000,
      currentValue: 8400000,
      memo: '디지털 금 헷지 자산'
    }
  ];

  for (const item of sampleItems) {
    await createAsset(item);
  }
}
