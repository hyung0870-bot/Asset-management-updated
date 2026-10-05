/**
 * 실시간 및 일자별 USD/KRW 환율 조회 서비스
 */

const rateCache = new Map();
const DEFAULT_FALLBACK_RATE = 1350.0;

/**
 * 특정 날짜(또는 오늘)의 USD -> KRW 환율을 조회합니다.
 * @param {string} [dateStr] 'YYYY-MM-DD' 형식 (선택)
 * @returns {Promise<{ rate: number, date: string, isLive: boolean }>}
 */
export async function getUSDKRWRate(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = dateStr || today;

  // 캐시 확인
  if (rateCache.has(targetDate)) {
    return rateCache.get(targetDate);
  }

  // 1. 당일이거나 날짜가 지정되지 않은 경우 최신 환율 API 우선 호출
  if (targetDate === today) {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        const rate = Number(data.rates?.KRW);
        if (rate && !isNaN(rate)) {
          const result = {
            rate: Math.round(rate * 100) / 100,
            date: today,
            isLive: true
          };
          rateCache.set(targetDate, result);
          return result;
        }
      }
    } catch (e) {
      console.warn('Live exchange rate API failed, trying fallback...', e);
    }
  } else {
    // 2. 과거 특정 일자의 환율 조회 시도
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${targetDate}/v1/currencies/usd.json`);
      if (res.ok) {
        const data = await res.json();
        const rate = Number(data.usd?.krw);
        if (rate && !isNaN(rate)) {
          const result = {
            rate: Math.round(rate * 100) / 100,
            date: targetDate,
            isLive: true
          };
          rateCache.set(targetDate, result);
          return result;
        }
      }
    } catch (e) {
      console.warn(`Historical rate API for ${targetDate} failed:`, e);
    }
  }

  // 3. Fallback: 최신 API 재시도 또는 기본값
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = Number(data.rates?.KRW);
      if (rate && !isNaN(rate)) {
        const result = {
          rate: Math.round(rate * 100) / 100,
          date: today,
          isLive: true
        };
        rateCache.set(targetDate, result);
        return result;
      }
    }
  } catch (e) {
    console.error('All exchange rate APIs failed:', e);
  }

  // 최종 Fallback
  return {
    rate: DEFAULT_FALLBACK_RATE,
    date: today,
    isLive: false
  };
}
