import { formatKRW } from "../utils/formatters";

/**
 * 사용자 계정에 활성화된 모델 및 대체 모델 후보 목록
 * 1) Gemini 3.5 Flash (검증된 고성능/안정 모델)
 * 2) Gemini 2.5 Flash (고속/안정 모델)
 * 3) Gemini 3.8 Flash (최신 모델)
 */
const FALLBACK_MODEL_CANDIDATES = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-1.5-flash'
];

/**
 * 에러 메시지가 일시적 과부하/트래픽/모델 만료로 인해 다음 모델로 전환 가능한지 판단
 */
function isFallbackEligibleError(statusCode, errorMessage = '') {
  const msg = errorMessage.toLowerCase();
  if (statusCode === 503 || statusCode === 429 || statusCode === 500) return true;
  if (
    msg.includes('high demand') ||
    msg.includes('try again later') ||
    msg.includes('overloaded') ||
    msg.includes('temporarily') ||
    msg.includes('no longer available') ||
    msg.includes('resource has been exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit')
  ) {
    return true;
  }
  return false;
}

/**
 * 단일 모델 호출 함수
 */
async function callGeminiModel(modelName, apiKey, userPrompt, role) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: userPrompt }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        { text: `너는 전문 자산배분 및 포트폴리오 리밸런싱 AI 어드바이저다. 사용자 지정 역할: "${role || '리스크 관리를 최우선으로 하는 자산배분 및 올웨더 포트폴리오 전문가'}". 한국어로 전문적이면서도 친절하고 명확하게 답변하라.` }
      ]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || `API 요청 실패 (HTTP ${response.status})`;
    const error = new Error(errMsg);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  // 모든 파트 텍스트를 하나로 결합
  const text = parts.map(p => p.text || '').join('');

  if (!text) {
    throw new Error("AI 응답 본문이 비어 있습니다.");
  }

  return text;
}

/**
 * Gemini API를 호출하여 포트폴리오 분석 및 리밸런싱 코칭을 요청 (자동 폴백 체인 탑재)
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.model
 * @param {string} params.role
 * @param {Array} params.assets
 * @param {Array} params.history
 * @param {(statusMsg: string) => void} [params.onStatusUpdate]
 * @returns {Promise<{ text: string, usedModel: string, isFallback: boolean }>}
 */
export async function getAICoachingAdvice({
  apiKey,
  model = "gemini-3.8-flash",
  role,
  assets = [],
  history = [],
  onStatusUpdate
}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Gemini API Key가 설정되지 않았습니다. 우측 상단 [설정] 아이콘을 눌러 API Key를 입력해주세요.");
  }

  // 1. 포트폴리오 분석 데이터 요약
  const totalPrincipal = assets.reduce((s, a) => s + (Number(a.principal) || 0), 0);
  const totalValue = assets.reduce((s, a) => s + (Number(a.currentValue) || 0), 0);
  const totalProfit = totalValue - totalPrincipal;
  const totalReturnPercent = totalPrincipal > 0 ? ((totalProfit / totalPrincipal) * 100).toFixed(2) : '0.00';

  // 카테고리별 비중 요약
  const categorySummary = {};
  assets.forEach((a) => {
    const cat = a.category || '기타';
    categorySummary[cat] = (categorySummary[cat] || 0) + (Number(a.currentValue) || 0);
  });

  const categoryBreakdownText = Object.entries(categorySummary).map(([cat, val]) => {
    const share = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : 0;
    return `- ${cat}: ${formatKRW(val)} (${share}%)`;
  }).join("\n");

  // 개별 자산 목록 텍스트
  const assetDetailsText = assets.map((a) => {
    const p = Number(a.principal) || 0;
    const v = Number(a.currentValue) || 0;
    const profit = v - p;
    const ret = p > 0 ? ((profit / p) * 100).toFixed(2) : '0.00';
    const share = totalValue > 0 ? ((v / totalValue) * 100).toFixed(1) : '0.0';
    return `- [${a.category}] ${a.name}: 원금 ${formatKRW(p)}, 평가액 ${formatKRW(v)} (수익률: ${ret > 0 ? '+' : ''}${ret}%, 비중: ${share}%)${a.memo ? ` [메모: ${a.memo}]` : ''}`;
  }).join("\n");

  // 최근 추이 요약 (최대 5개)
  const recentHistory = history.slice(-5).map(h => 
    `- ${h.date}: 총 원금 ${formatKRW(h.totalPrincipal)}, 총 평가액 ${formatKRW(h.totalValue)}`
  ).join("\n");

  // 2. 사용자 프롬프트 구성
  const userPrompt = `
[사용자 포트폴리오 실시간 데이터]
- 총 투자 원금: ${formatKRW(totalPrincipal)}
- 총 자산 평가액: ${formatKRW(totalValue)}
- 총 평가 손익: ${formatKRW(totalProfit)} (${totalReturnPercent}%)

[카테고리별 자산 비중]
${categoryBreakdownText || '자산 데이터 없음'}

[개별 자산 상세 현황]
${assetDetailsText || '등록된 자산 없음'}

[최근 자산 변동 히스토리 스냅샷]
${recentHistory || '히스토리 데이터 없음'}

---
[요청 사항]
당신이 맡은 역할 페르소나에 입각하여, 아래 3개 핵심 영역에 대해 체계적이고 구체적인 리밸런싱 코칭 리포트를 마크다운(Markdown) 형식으로 작성해주세요.

1. **포트폴리오 리스크 진단**
   - 특정 자산군/종목에 대한 과도한 집중 위험 분석
   - 현금/유동성 완충력 평가 (하락장 대비 여력)
   - 전반적인 변동성 및 자산 상관관계 평가

2. **구체적인 리밸런싱 액션 플랜 (Action Plan)**
   - 목표 비중(현금, 주식, 가상자산 등) 제시
   - 비중 축소(이익실현/손절) 추천 자산과 비중 확대(신규/분할매수) 추천 자산 구체적 명시
   - 분할 매매 실행 가이드

3. **중단기 포트폴리오 운용 조언**
   - 현재 거시경제 상황을 염두에 둔 1~6개월 운용 팁
   - 멘탈 관리 및 투자 원칙 조언

가독성 높게 소제목(##, ###), 글머리 기호(-), 볼드(**) 등을 적극 활용해 전문적이면서도 알기 쉽게 설명해 주세요.
`.trim();

  // 3. 지능형 Fallback Chain 구성
  const requestedModel = (model || 'gemini-3.8-flash').trim();
  // 사용자가 선택한 모델을 최우선으로 두고, 중복 없는 fallback 체인 구성
  const modelChain = [
    requestedModel,
    ...FALLBACK_MODEL_CANDIDATES.filter(m => m !== requestedModel)
  ];

  let lastError = null;

  for (let i = 0; i < modelChain.length; i++) {
    const currentCandidate = modelChain[i];
    const isFirstAttempt = i === 0;

    try {
      if (!isFirstAttempt && onStatusUpdate) {
        onStatusUpdate(`이전 모델 트래픽 초과로 대체 모델(${currentCandidate})로 분석 진행 중...`);
      }

      const text = await callGeminiModel(currentCandidate, apiKey, userPrompt, role);
      
      return {
        text,
        usedModel: currentCandidate,
        isFallback: !isFirstAttempt
      };
    } catch (err) {
      console.warn(`[AI Service] Model ${currentCandidate} failed:`, err.message);
      lastError = err;

      // 만약 API Key 자체가 유효하지 않거나 인증 실패(401/403)인 경우, 모델 교체로 해결되지 않으므로 즉시 throw
      if (err.status === 401 || err.message.toLowerCase().includes('api key not valid')) {
        throw new Error("Gemini API Key가 올바르지 않습니다. 설정을 확인해 주세요.");
      }

      // Fallback 대상 에러인지 검사
      const isEligible = isFallbackEligibleError(err.status, err.message);
      if (!isEligible && i === 0) {
        // Fallback 시도할 가치가 없는 에러라도 다음 모델로 한 번 더 시도
        console.warn('Continuing fallback chain despite error type...');
      }
    }
  }

  // 모든 모델이 실패한 경우
  throw new Error(`모든 AI 모델 호출 실패 (${modelChain.join(', ')}): ${lastError?.message || '트래픽 급증으로 연결 불가'}`);
}
