"use client";

import { useState } from 'react';
import { X, User, MapPin, Briefcase, Heart, Calendar, Sparkles, FileText, Lightbulb, Route, AlertCircle, Play, Eye, EyeOff, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { postToWebhook } from '@/lib/api';
import { WEBHOOK_URLS } from '@/config/webhooks';

// ─── 프론트엔드 예시 데이터 (외부 API 호출 없음) ────────────────────────────
const EXAMPLE_AI_ANALYSIS = {
  chat_summary:
    "내담자는 최근 권고사직 이후 월세 체납이 발생하여 주거 지원이 절실한 상황입니다. 초기에는 대화에 소극적이었으나 지원 정책 안내 이후 구체적인 향후 계획에 대해 의지를 보였습니다. 현재 심리적으로 매우 위축되어 있어 즉각적인 생활 안정 지원이 병행되어야 합니다.",
  special_notes:
    "불면 증세 언급 있음. 정신건강복지센터와의 연계도 함께 고려 필요. 실직 후 6개월 경과, 긴급복지지원 신청 기간 내에 있음.",
  consultation_guide:
    "1. 먼저 현재 가장 급한 생활비·주거 문제를 파악하세요.\n2. 긴급복지지원 제도의 지급 가능 항목(생계·주거·의료)을 안내하세요.\n3. 취업 의지 확인 후 국민취업지원제도 1유형 연계를 제안하세요.\n4. 정서적 어려움이 있으면 정신건강복지센터 연계를 함께 안내하세요.",
  policy_roadmap: [
    {
      제목: "1단계 · 긴급 생활 안정",
      내용: "긴급복지지원 신청 (생계지원금 최대 6회), 관할 주민센터 방문 즉시 처리 가능"
    },
    {
      제목: "2단계 · 주거 안정",
      내용: "청년 월세 한시 특별지원 신청 (월 최대 20만 원, 12개월). 청년 전세임대주택 LH 신청도 병행 추천"
    },
    {
      제목: "3단계 · 자립 기반 마련",
      내용: "국민취업지원제도 1유형 등록 → 구직촉진수당 + 취업지원 서비스. 직업훈련 연계 시 훈련비 80% 지원"
    }
  ],
  recommended_policies: [
    {
      제목: "청년 월세 한시 특별지원",
      추천이유: "무주택 청년 대상, 월 최대 20만 원 × 12개월 지원"
    },
    {
      제목: "긴급복지지원 생계지원",
      추천이유: "위기 상황 발생 시 1개월 이내 신청 가능, 4인 가구 기준 월 162만 원"
    },
    {
      제목: "국민취업지원제도 1유형",
      추천이유: "구직촉진수당 월 50만 원 + 최대 6개월 취업 지원 서비스"
    }
  ]
};
// ────────────────────────────────────────────────────────────────────────────

interface ConsultationDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  isLoading: boolean;
}

export default function ConsultationDetailPopup({
  isOpen,
  onClose,
  data,
  isLoading
}: ConsultationDetailPopupProps) {
  const [showExample, setShowExample] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareStatus, setPrepareStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const handlePrepare = async () => {
    if (!data?.request_id) {
      setPrepareStatus('error');
      setTimeout(() => setPrepareStatus('idle'), 3000);
      return;
    }
    setIsPreparing(true);
    setPrepareStatus('idle');
    try {
      await postToWebhook(WEBHOOK_URLS.CHECK_CASE, { request_id: data.request_id });
      setPrepareStatus('ok');
      setTimeout(() => setPrepareStatus('idle'), 4000);
    } catch {
      setPrepareStatus('error');
      setTimeout(() => setPrepareStatus('idle'), 4000);
    } finally {
      setIsPreparing(false);
    }
  };

  if (!isOpen) return null;

  // 실제 데이터 또는 예시 데이터
  const aiAnalysis = showExample ? EXAMPLE_AI_ANALYSIS : data?.ai_analysis;

  // ─── 헬퍼 함수들 ────────────────────────────────────────────────────────
  const isEmpty = (value: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  };

  const renderField = (value: any, emptyText = "상담자가 응답하지 않은 항목입니다.") => {
    if (isEmpty(value)) return <span className="text-zinc-400 italic">{emptyText}</span>;
    return <span className="text-zinc-900 font-medium">{String(value)}</span>;
  };

  const renderArrayField = (arr: any[], emptyText = "상담자가 응답하지 않은 항목입니다.") => {
    if (isEmpty(arr)) return <span className="text-zinc-400 italic">{emptyText}</span>;
    const safeArr = Array.isArray(arr) ? arr : [arr];
    return (
      <div className="flex flex-wrap gap-2">
        {safeArr.map((item, idx) => (
          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </span>
        ))}
      </div>
    );
  };

  const renderJsonField = (value: any, emptyText = "상담자가 응답하지 않은 항목입니다.") => {
    if (isEmpty(value)) return <span className="text-zinc-400 italic">{emptyText}</span>;
    if (typeof value === 'string') return <p className="text-zinc-900 whitespace-pre-wrap">{value}</p>;
    return (
      <pre className="text-sm text-zinc-900 whitespace-pre-wrap bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  // 객체에서 안전하게 문자열 추출
  const extractStr = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.trim() || null;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    return null; // 객체/배열은 null
  };

  // 정책 항목 객체에서 title/desc 추출
  const extractItemTexts = (item: any): { title: string; desc: string } | null => {
    if (!item || typeof item !== 'object') return null;

    const TITLE_KEYS = ['제목', 'title', 'name', '단계', 'step', '정책명', '항목', 'label', '이름', '단계명'];
    const DESC_KEYS  = ['추천이유', 'reason', '내용', 'description', 'desc', '설명', 'detail', 'summary', '요약', '이유', '효과'];
    const SKIP_KEYS  = ['ID', 'id', '_id'];

    let title = '';
    let desc  = '';

    for (const k of TITLE_KEYS) {
      const v = extractStr(item[k]);
      if (v) { title = v; break; }
    }
    for (const k of DESC_KEYS) {
      const v = extractStr(item[k]);
      if (v) { desc = v; break; }
    }

    // 알려진 필드가 없으면 모든 값을 순서대로 수집
    if (!title && !desc) {
      const allVals: string[] = [];
      for (const k of Object.keys(item)) {
        if (SKIP_KEYS.includes(k)) continue;
        const v = extractStr(item[k]);
        if (v) allVals.push(v);
      }
      if (allVals.length === 0) {
        // 최후 수단: JSON.stringify
        const raw = JSON.stringify(item);
        if (raw && raw !== '{}') return { title: raw, desc: '' };
        return null;
      }
      title = allVals[0];
      desc  = allVals.slice(1).join(' | ');
    }

    return { title: title || '(항목)', desc };
  };

  // 정책 배열/JSON문자열을 카드 형태로 렌더링
  const renderPolicyList = (rawData: any, sectionTitle: string) => {
    if (rawData === null || rawData === undefined) return null;

    let items: any[] = [];
    let parseFailed = false;

    try {
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (typeof rawData === 'string') {
        const trimmed = rawData.trim();
        if (!trimmed || trimmed === '[object Object]') {
          parseFailed = true;
        } else if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          const parsed = JSON.parse(trimmed);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // 일반 텍스트 문자열
          return (
            <div className="space-y-2">
              <p className="text-sm font-bold text-indigo-900/70 uppercase tracking-wide">{sectionTitle}</p>
              <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-sm">{trimmed}</p>
            </div>
          );
        }
      } else if (typeof rawData === 'object') {
        items = [rawData];
      }
    } catch {
      parseFailed = true;
    }

    if (parseFailed) return null;
    if (items.length === 0) return null;

    const renderableItems = items
      .map((item, idx) => {
        if (typeof item === 'string') {
          const v = item.trim();
          if (!v || v === '[object Object]') return null;
          return { idx, title: v, desc: '' };
        }
        if (typeof item === 'number' || typeof item === 'boolean') {
          return { idx, title: String(item), desc: '' };
        }
        if (typeof item === 'object' && item !== null) {
          const texts = extractItemTexts(item);
          if (!texts) return null;
          return { idx, title: texts.title, desc: texts.desc };
        }
        return null;
      })
      .filter((r): r is { idx: number; title: string; desc: string } => r !== null);

    if (renderableItems.length === 0) return null;

    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-indigo-900/70 uppercase tracking-wide">{sectionTitle}</p>
        <div className="space-y-3">
          {renderableItems.map((r) => (
            <div
              key={r.idx}
              className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/60 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  {r.idx + 1}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="font-bold text-zinc-900 text-sm leading-snug">{r.title}</h4>
                  {r.desc && (
                    <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap">{r.desc}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // AI 섹션 데이터가 모두 비어있는지 확인
  const isAiDataEmpty =
    isEmpty(data?.ai_analysis?.chat_summary) &&
    isEmpty(data?.ai_analysis?.special_notes) &&
    isEmpty(data?.ai_analysis?.consultation_guide) &&
    isEmpty(data?.ai_analysis?.policy_roadmap) &&
    isEmpty(data?.ai_analysis?.recommended_policies);

  const handleStartConsultation = async () => {
    if (!data?.request_id) {
      setStartError("상담 ID가 없어 상담을 시작할 수 없습니다.");
      return;
    }
    setStartError(null);
    try {
      await postToWebhook(WEBHOOK_URLS.START_CONSULTATION, {
        request_id: data.request_id,
        email: data.email,
        timestamp: new Date().toISOString()
      });
      const consultationUrl = `/manager/consultation/${data.request_id}`;
      window.open(consultationUrl, '_blank', 'noopener,noreferrer');
      onClose();
    } catch (error) {
      console.error("상담 시작 실패:", error);
      setStartError("상담 시작 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-zinc-100">

        {/* 헤더 */}
        <div className="bg-white px-8 py-7 flex items-center justify-between border-b border-zinc-100">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">상담 상세 정보</h2>
            <p className="text-zinc-500 text-sm mt-1.5 font-medium">상담 준비를 위한 모든 데이터를 한눈에 확인하세요</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-5" />
              <p className="text-zinc-400 font-medium">정보를 안전하게 불러오는 중입니다</p>
            </div>
          ) : data ? (
            <div className="space-y-8">

              {/* 1. 기본 정보 */}
              <div className="bg-[#f2f8ff] rounded-3xl p-7 border border-blue-50/50">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                    <User className="text-blue-500" size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">기본 정보</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">이름</p>
                    {renderField(data.name)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">이메일</p>
                    <div className="break-all">{renderField(data.email)}</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">나이</p>
                    {renderField(data.age ? `${data.age}세` : null)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">성별</p>
                    {renderField(data.gender === 'male' ? '남성' : data.gender === 'female' ? '여성' : data.gender)}
                  </div>
                </div>
              </div>

              {/* 2 & 3 그리드 배치 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 지역 정보 */}
                <div className="bg-[#f0f9f4] rounded-3xl p-7 border border-green-50/50">
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                      <MapPin className="text-green-500" size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">지역 정보</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-green-500/70 uppercase tracking-wider mb-2">광역 자치단체</p>
                      {renderField(data.region?.regional)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-500/70 uppercase tracking-wider mb-2">기초 자치단체</p>
                      {renderField(data.region?.basic)}
                    </div>
                  </div>
                </div>

                {/* 사회적 상태 */}
                <div className="bg-[#f5f3ff] rounded-3xl p-7 border border-purple-50/50">
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                      <Briefcase className="text-purple-500" size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">사회적 상태</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">직업 상태</p>
                      {renderField(data.job_status)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">소득 수준</p>
                      {renderField(data.income_level)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 관심 분야 & 수혜 정책 */}
              <div className="bg-zinc-50 rounded-3xl p-7 border border-zinc-100">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                    <Heart className="text-rose-400" size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">관심 및 수혜</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-zinc-500 mb-3 ml-1">주요 관심 분야</p>
                    {renderArrayField(data.interest_areas)}
                  </div>
                  <div className="pt-4 border-t border-zinc-200/60">
                    <p className="text-sm font-bold text-zinc-500 mb-2 ml-1">현재 수혜 중인 정책</p>
                    {renderField(data.benefited_policy)}
                  </div>
                </div>
              </div>

              {/* 5. 상담 확정 정보 */}
              <div className="bg-emerald-50/50 rounded-3xl p-7 border border-emerald-100">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                    <Calendar className="text-emerald-500" size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">상담 확정 정보</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white/60 p-4 rounded-2xl border border-white">
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-2 text-center">확정 일시</p>
                    <p className="text-zinc-900 font-bold text-center">{data.confirmed?.datetime || "-"}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-white">
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-2 text-center">상담 장소</p>
                    <p className="text-zinc-900 font-bold text-center">
                      {data.confirmed?.location === 'center' ? '청년센터' : (data.confirmed?.location || "-")}
                    </p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-white">
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-2 text-center">상담 방식</p>
                    <p className="text-zinc-900 font-bold text-center">
                      {data.confirmed?.method === 'online' ? '💻 온라인' :
                       data.confirmed?.method === 'offline' ? '🤝 오프라인' :
                       data.confirmed?.method === 'phone' ? '📞 전화' : (data.confirmed?.method || "-")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. AI 상담 가이드 */}
              <div className="bg-[#fff9eb] rounded-[32px] p-8 border border-amber-100/50">
                {/* 섹션 헤더 + 예시/준비 버튼 */}
                <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-white shadow-sm rounded-[20px] flex items-center justify-center">
                      <Sparkles className="text-amber-500" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-zinc-900">AI 상담 가이드</h3>
                      <p className="text-amber-600/70 text-sm font-medium">더 나은 상담을 위한 AI의 심층 분석 리포트</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 바로 준비하기 버튼 */}
                    <button
                      onClick={handlePrepare}
                      disabled={isPreparing}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all border ${
                        prepareStatus === 'ok'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : prepareStatus === 'error'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                      } disabled:opacity-60`}
                    >
                      {isPreparing ? (
                        <><Loader2 size={15} className="animate-spin" /> 준비 중...</>
                      ) : prepareStatus === 'ok' ? (
                        <><CheckCircle2 size={15} /> 요청 완료!</>
                      ) : prepareStatus === 'error' ? (
                        <><AlertCircle size={15} /> 오류 발생</>
                      ) : (
                        <><Zap size={15} /> 바로 준비하기</>
                      )}
                    </button>

                    {/* 예시 보기 / 실제 데이터 보기 토글 버튼 */}
                    <button
                      onClick={() => setShowExample((prev) => !prev)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all border ${
                        showExample
                          ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
                          : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {showExample ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showExample ? '실제 데이터 보기' : '예시 보기'}
                    </button>
                  </div>
                </div>

                {/* 예시 모드 배너 */}
                {showExample && (
                  <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
                    <p className="text-amber-700 text-xs font-bold">
                      예시 데이터를 표시 중입니다. 실제 AI 분석 결과와 다를 수 있습니다.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 대화 요약 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-1">
                      <FileText size={18} className="text-amber-500" />
                      <p className="font-bold text-zinc-800">대화 요약</p>
                    </div>
                    <div className="bg-white/80 p-5 rounded-[24px] border border-white min-h-[100px] leading-relaxed">
                      {renderJsonField(aiAnalysis?.chat_summary)}
                    </div>
                  </div>

                  {/* 특이사항 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-1">
                      <AlertCircle size={18} className="text-rose-400" />
                      <p className="font-bold text-zinc-800">중요 특이사항</p>
                    </div>
                    <div className="bg-rose-50/30 p-5 rounded-[24px] border border-rose-100/30 min-h-[100px] leading-relaxed text-rose-700">
                      {renderJsonField(aiAnalysis?.special_notes)}
                    </div>
                  </div>

                  {/* 상담 가이드 */}
                  <div className="space-y-3 lg:col-span-2 mt-4">
                    <div className="flex items-center gap-2.5 px-1">
                      <Lightbulb size={20} className="text-amber-500" />
                      <p className="font-bold text-zinc-800">추천 상담 가이드라인</p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-amber-100 shadow-sm leading-relaxed">
                      {renderJsonField(aiAnalysis?.consultation_guide)}
                    </div>
                  </div>

                  {/* 정책 로드맵 및 추천 */}
                  <div className="space-y-3 lg:col-span-2">
                    <div className="flex items-center gap-2.5 px-1">
                      <Route size={20} className="text-indigo-400" />
                      <p className="font-bold text-zinc-800">맞춤 정책 로드맵 &amp; 추천</p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-indigo-50 shadow-sm space-y-6">
                      <div className="space-y-8">
                        {(() => {
                          const roadmap = aiAnalysis?.policy_roadmap;
                          const result = renderPolicyList(roadmap, "정책 로드맵");
                          if (!result) {
                            return (
                              <p className="text-sm text-zinc-400 italic">
                                {showExample ? '예시 데이터 로드 중...' : '정책 로드맵 정보가 없습니다.'}
                              </p>
                            );
                          }
                          return result;
                        })()}
                        <div className="border-t border-zinc-100" />
                        {(() => {
                          const policies = aiAnalysis?.recommended_policies;
                          const result = renderPolicyList(policies, "추천 정책 리스트");
                          if (!result) {
                            return (
                              <p className="text-sm text-zinc-400 italic">
                                {showExample ? '예시 데이터 로드 중...' : '추천 정책 정보가 없습니다.'}
                              </p>
                            );
                          }
                          return result;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 에러 메시지 */}
              {startError && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {startError}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-zinc-300" size={40} />
              </div>
              <p className="text-zinc-500 font-medium">상세 데이터를 불러올 수 없습니다</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="bg-white px-8 py-5 flex justify-end gap-3 border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-2xl font-bold transition-all duration-200 active:scale-95"
          >
            닫기
          </button>
          {!isLoading && data && !data.error && (
            <button
              onClick={handleStartConsultation}
              className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-100"
            >
              <Play size={18} fill="currentColor" />
              상담 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
