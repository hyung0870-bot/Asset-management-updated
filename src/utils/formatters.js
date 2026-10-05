/**
 * 숫자를 한국 원화 세 자리 콤마 포맷(예: 1,234,567원)으로 변환
 * @param {number|string} value 
 * @param {boolean} includeWon '원' 단위 포함 여부
 * @returns {string}
 */
export function formatKRW(value, includeWon = true) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return includeWon ? '0원' : '0';
  }
  const num = Math.round(Number(value));
  const formatted = num.toLocaleString('ko-KR');
  return includeWon ? `${formatted}원` : formatted;
}

/**
 * 숫자를 미국 달러 포맷(예: $1,234.56)으로 변환
 * @param {number|string} value 
 * @param {boolean} includeSymbol '$' 기호 포함 여부
 * @returns {string}
 */
export function formatUSD(value, includeSymbol = true) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return includeSymbol ? '$0.00' : '0.00';
  }
  const num = Number(value);
  // 소수점 2자리 포맷팅
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * 콤마가 포함된 문자열 또는 숫자 입력값을 순수 정수 숫자로 파싱
 * @param {string|number} str 
 * @returns {number}
 */
export function parseNumberInput(str) {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * 소수점이 포함될 수 있는 달러(USD) 입력값을 숫자로 파싱
 * @param {string|number} str 
 * @returns {number}
 */
export function parseFloatInput(str) {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  // 숫자와 소수점(.)을 제외한 모든 문자 제거
  const cleaned = String(str).replace(/[^0-9.]/g, '');
  // 소수점이 여러 개 있을 경우 첫 번째만 유지
  const parts = cleaned.split('.');
  const sanitized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
  return sanitized ? parseFloat(sanitized) : 0;
}

/**
 * 간단한 사칙연산 수식 문자열을 안전하게 계산
 * 지원: +, -, *, /, (, )
 * 예: "3000000-120638" -> 2879362
 * 예: "3,000,000 + 500,000" -> 3500000
 * @param {string|number} expr 
 * @returns {number|null}
 */
export function evaluateMathExpression(expr) {
  if (expr === null || expr === undefined) return null;
  if (typeof expr === 'number') return isNaN(expr) ? null : expr;

  let clean = String(expr).replace(/,/g, '').trim();
  if (!clean) return null;

  // 허용된 문자: 숫자, +, -, *, /, (, ), ., 공백
  if (!/^[0-9+\-*/().\s]+$/.test(clean)) {
    return null;
  }

  // 입력 중일 수 있는 마지막 연산자/소수점 제거
  clean = clean.replace(/[+\-*/.\s]+$/, '').trim();
  if (!clean) return null;

  try {
    const result = new Function(`'use strict'; return (${clean})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * 입력 문자열에 사칙연산 수식이 포함되어 있는지 확인
 * @param {string} str 
 * @returns {boolean}
 */
export function isMathExpression(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.replace(/,/g, '').trim();
  return /[+*/]/.test(clean) || /\d\s*-\s*\d/.test(clean);
}

/**
 * 수익률 계산 및 포맷팅 (+12.34%, -5.67%)
 * @param {number} principal 
 * @param {number} currentValue 
 * @returns {{ percent: number, formatted: string, isPositive: boolean, isZero: boolean }}
 */
export function calculateReturn(principal, currentValue) {
  const p = Number(principal) || 0;
  const c = Number(currentValue) || 0;
  if (p <= 0) {
    return {
      percent: 0,
      formatted: '0.00%',
      isPositive: c > 0,
      isZero: c === 0
    };
  }
  const profit = c - p;
  const percent = (profit / p) * 100;
  const sign = percent > 0 ? '+' : '';
  return {
    percent,
    formatted: `${sign}${percent.toFixed(2)}%`,
    isPositive: percent > 0,
    isZero: Math.abs(percent) < 0.001
  };
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 * @param {Date|string|number} date 
 * @returns {string}
 */
export function formatDate(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 차트 축에 맞게 축약 (MM.DD)
 * @param {string} dateStr YYYY-MM-DD
 * @returns {string}
 */
export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}
