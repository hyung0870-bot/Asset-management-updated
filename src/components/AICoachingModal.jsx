import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  RotateCw, 
  Copy, 
  Check, 
  AlertTriangle, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  BrainCircuit,
  Zap,
  Maximize2,
  Minimize2,
  ArrowUp
} from 'lucide-react';
import { getAICoachingAdvice } from '../services/aiService';

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function MarkdownViewer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentUnorderedList = [];
  let currentOrderedList = [];

  const flushLists = (key) => {
    if (currentUnorderedList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-2.5 space-y-1.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
          {currentUnorderedList.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      currentUnorderedList = [];
    }
    if (currentOrderedList.length > 0) {
      elements.push(
        <ol key={`ol-${key}`} className="list-decimal pl-5 my-2.5 space-y-1.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
          {currentOrderedList.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ol>
      );
      currentOrderedList = [];
    }
  };

  const parseInline = (text) => {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-sky-700 dark:text-sky-300 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700">$1</code>');
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = parseInline(trimmed.substring(2));
      currentUnorderedList.push(itemText);
      return;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      const itemText = parseInline(orderedMatch[2]);
      currentOrderedList.push(itemText);
      return;
    }

    flushLists(index);

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-sm sm:text-base font-bold text-sky-700 dark:text-sky-400 mt-5 mb-2.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          {trimmed.substring(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-6 mb-3 pb-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {trimmed.substring(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-7 mb-4">
          {trimmed.substring(2)}
        </h1>
      );
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={index} className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-2.5 rounded-r-xl my-3 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
          <span dangerouslySetInnerHTML={{ __html: parseInline(trimmed.substring(2)) }} />
        </blockquote>
      );
    } else if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={index} className="my-5 border-slate-200 dark:border-slate-800" />);
    } else if (trimmed.length > 0) {
      elements.push(
        <p key={index} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />
      );
    }
  });

  flushLists('end');
  return <div className="space-y-1">{elements}</div>;
}

export function AICoachingModal({
  isOpen,
  onClose,
  assets = [],
  history = [],
  apiKey,
  aiModel,
  aiRole,
  onOpenSettings
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [report, setReport] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const scrollRef = useRef(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    if (!apiKey) {
      setError('Gemini API Key가 필요합니다. 설정에서 API Key를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setStatusMessage('');
      const result = await getAICoachingAdvice({
        apiKey,
        model: aiModel,
        role: aiRole,
        assets,
        history,
        onStatusUpdate: (msg) => setStatusMessage(msg)
      });
      setReport(result.text);
      setUsedModel(result.usedModel);
      setIsFallback(result.isFallback);
    } catch (err) {
      console.error(err);
      setError(err.message || 'AI 분석 실행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn ${isMaximized ? 'p-0' : ''}`}>
      <div 
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
          isMaximized 
            ? 'w-full h-full max-w-none max-h-none rounded-none' 
            : 'w-full max-w-4xl lg:max-w-5xl h-[92vh] max-h-[92vh] rounded-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                AI 포트폴리오 리밸런싱 코칭
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                설정 모델: <span className="text-sky-600 dark:text-sky-400 font-medium">{aiModel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isMaximized ? '창 크기 복원' : '전체화면으로 크게 보기'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Active Persona Banner */}
        <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              코칭 페르소나
            </span>
            <span className="text-slate-800 dark:text-slate-200 truncate font-semibold">
              "{aiRole}"
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="shrink-0 flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>변경</span>
          </button>
        </div>

        {/* Content Body */}
        <div 
          ref={scrollRef}
          className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 overscroll-contain relative"
        >
          {!apiKey && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Gemini API Key가 등록되지 않았습니다</div>
                  <div className="text-xs mt-0.5 opacity-80">
                    Google AI Studio에서 무료 API Key를 발급받아 환경설정에 입력하세요.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs shrink-0 transition"
              >
                API Key 등록하기
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <BrainCircuit className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                포트폴리오 정밀 진단 및 리밸런싱 전략 생성 중...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-3">
                현재 자산 비중, 수익률 격차, 유동성 완충력을 종합 분석하여 최적의 코칭 리포트를 도출하고 있습니다.
              </p>
              {statusMessage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 animate-pulse font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          ) : report ? (
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs pb-14">
              
              {isFallback && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      요청 모델({aiModel})의 트래픽 급증으로 인해 <strong>{usedModel}</strong> 모델로 자동 전환되어 안전하게 분석을 완료했습니다.
                    </span>
                  </span>
                </div>
              )}

              {/* Sticky Action Toolbar inside Report */}
              <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 py-2.5 px-3 mb-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-bold truncate">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="truncate">AI 리밸런싱 리포트 ({usedModel || aiModel})</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '복사됨' : '리포트 복사'}</span>
                  </button>
                  <button
                    onClick={handleRunAnalysis}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>재분석</span>
                  </button>
                </div>
              </div>

              {/* Full Markdown Render Area */}
              <div className="prose-ai max-w-none leading-relaxed">
                <MarkdownViewer content={report} />
              </div>

              {/* Bottom Quick Jump */}
              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>리포트 끝까지 확인 완료</span>
                <button
                  onClick={scrollToTop}
                  className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold transition hover:underline"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>맨 위로 스크롤</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs border border-indigo-100 dark:border-indigo-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                포트폴리오 AI 코칭 분석을 시작하세요
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                현재 등록된 {assets.length}개의 자산 데이터와 히스토리를 바탕으로 리스크 진단, 카테고리별 목표 비중, 구체적인 매매 액션 플랜을 전문 어드바이저 관점에서 브리핑해 드립니다.
              </p>
              <button
                onClick={handleRunAnalysis}
                disabled={!apiKey || loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI 리밸런싱 코칭 실행하기</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>* 본 AI 코칭은 투자 참고용이며 투자 판단의 최종 책임은 본인에게 있습니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
