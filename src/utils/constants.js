export const ASSET_CATEGORIES = [
  '현금/예금',
  '국내주식',
  '해외주식',
  '가상자산',
  '기타'
];

export const CATEGORY_COLORS = {
  '현금/예금': '#10B981', // emerald
  '국내주식': '#3B82F6', // blue
  '해외주식': '#8B5CF6', // purple
  '가상자산': '#F59E0B', // amber
  '기타': '#6B7280',     // gray
};

export const CATEGORY_BADGES = {
  '현금/예금': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  '국내주식': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '해외주식': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  '가상자산': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  '기타': 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

export const AI_PRESETS = [
  {
    id: 'all-weather',
    label: '올웨더/자산배분',
    description: '시장 변동성에 흔들리지 않는 올웨더 및 리스크 패리티 전문가 관점',
    role: '너는 레이 달리오 스타일의 올웨더 포트폴리오 및 리스크 패리티 자산배분 전문가다. 경제 국면(인플레이션, 디플레이션, 성장, 침체)에 상관없이 포트폴리오의 최대 낙폭(MDD)을 방어하고, 주식/채권/원자재/현금의 상관관계를 면밀히 분석하여 균형 있는 리밸런싱 계획을 한국어로 상세하고 실천 가능하게 제시해줘.'
  },
  {
    id: 'value-investing',
    label: '보수적 가치투자',
    description: '원금 보존과 안정적 배당/현금흐름을 중시하는 보수적 가치투자자 관점',
    role: '너는 워런 버핏과 벤저민 그레이엄 철학을 계승한 보수적 가치투자자다. 원금 보존(안전마진)을 제1원칙으로 삼으며, 불확실성이 큰 투기성 자산을 경계하고 안정적인 현금흐름과 우량 자산 중심의 포트폴리오 비중 조정을 조언해줘.'
  },
  {
    id: 'growth-momentum',
    label: '성장/모멘텀',
    description: '고성장 주식 및 가상자산의 트렌드 추종과 공격적 수익 극대화 관점',
    role: '너는 테크/혁신 주식 및 가상자산 트렌드를 적극적으로 공략하는 성장주/모멘텀 투자 전략가다. 시장 주도주와 강세 자산의 비중을 극대화하면서도, 과열 징후 시 분할 익절과 철저한 손절 기준을 바탕으로 한 역동적인 리밸런싱을 조언해줘.'
  }
];

export const DEFAULT_AI_ROLE = '리스크 관리를 최우선으로 하는 자산배분 및 올웨더 포트폴리오 전문가';
export const DEFAULT_AI_MODEL = 'gemini-3.5-flash';

export const THEMES = [
  {
    id: 'light',
    name: '화이트 모드 (기본)',
    shortName: '화이트',
    description: '선명하고 깔끔한 모던 라이트 테마',
    icon: 'Sun',
    colors: {
      bg: '#f8fafc',
      card: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a',
      accent: '#0284c7'
    }
  },
  {
    id: 'warm',
    name: '웜 아이보리',
    shortName: '아이보리',
    description: '눈이 편안한 부드러운 웜 라이트 테마',
    icon: 'Sunrise',
    colors: {
      bg: '#faf8f5',
      card: '#ffffff',
      border: '#ebe5dc',
      text: '#292524',
      accent: '#d97706'
    }
  },
  {
    id: 'dark',
    name: '미드나잇 다크',
    shortName: '다크',
    description: '몰입감 높은 프리미엄 블랙 & 차콜',
    icon: 'Moon',
    colors: {
      bg: '#090d16',
      card: '#1e293b',
      border: '#334155',
      text: '#f8fafc',
      accent: '#38bdf8'
    }
  },
  {
    id: 'navy',
    name: '딥 네이비',
    shortName: '네이비',
    description: '세련되고 깊이 있는 사파이어 블루 테마',
    icon: 'Compass',
    colors: {
      bg: '#0a1224',
      card: '#111d38',
      border: '#1e355b',
      text: '#f0f6fc',
      accent: '#60a5fa'
    }
  }
];

export const DEFAULT_THEME = 'light';

