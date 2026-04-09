"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Target,
  MessageCircle,
  Heart,
  AlertCircle,
  FileText,
} from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

// 텍스트 내의 **굵게**, [대괄호], (소괄호) 및 주요 키워드를 스타일링하여 렌더링하는 헬퍼
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]|\(.*?\)|추천\s*이유\s*:|활용\s*팁\s*:)/g);
  return parts.map((part, i) => {
    const trimmed = part.trim();
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('[') && part.endsWith(']')) || (part.startsWith('(') && part.endsWith(')'))) {
      return <strong key={i} className="font-black text-primary">{part}</strong>;
    }
    if (/^(추천\s*이유\s*:|활용\s*팁\s*:)$/.test(trimmed)) {
      return <strong key={i} className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md mr-1">{trimmed}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// 텍스트 내의 1. 2. 3. 패턴을 감지하여 줄바꿈을 삽입하는 헬퍼
const formatNumberedText = (text: string) => {
  if (!text) return text;
  return text.replace(/(?<!\n)\s*(\d+\.)\s*/g, '\n$1 ');
};

// 배열 내의 각 항목을 다시 한 번 번호 기준으로 쪼개어 평탄화(Flatten)하는 함수
const flattenNumberedList = (list: any[]) => {
  if (!Array.isArray(list)) return [];
  return list.reduce((acc: string[], item) => {
    const str = String(item);
    if (str.includes('.') && /\d+\./.test(str)) {
      const splitItems = formatNumberedText(str)
        .split('\n')
        .map(s => s.trim())
        .filter(s => s !== "");
      return [...acc, ...splitItems];
    }
    return [...acc, str];
  }, []);
};

export default function ClientReportPage() {
  const { id } = useParams();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!id) return;
    const rawId = Array.isArray(id) ? id[0] : id;

    const loadReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await postToWebhook(WEBHOOK_URLS.GET_COMPLETED_DETAIL, { request_id: rawId });
        const data = Array.isArray(res) ? res[0]?.data || res[0] : res?.data || res;

        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setReportData({
            user_name: data.name || data.user_name || "내담자",
            main_issue: formatNumberedText(data.main_issue) || "주요 고민 내용이 정리되지 않았습니다.",
            user_message: formatNumberedText(data.user_message) || "상담사가 전하는 메시지가 생성되지 않았습니다.",
            policy_match: data.policy_match
              ? flattenNumberedList(typeof data.policy_match === "string" ? [data.policy_match] : data.policy_match)
              : [],
            next_steps: data.next_step
              ? flattenNumberedList(typeof data.next_step === "string" ? [data.next_step] : data.next_step)
                  .map((s: string) => s.replace(/^\d+\.\s*/, "").trim()).filter((s: string) => s !== "")
              : [],
          });
        } else {
          setError("리포트 정보를 찾을 수 없습니다. 아직 분석이 진행 중이거나, 잘못된 링크일 수 있습니다.");
        }
      } catch {
        setError("서버와의 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50/30 flex flex-col items-center justify-center p-6 gap-4">
        <Loader2 size={28} className="text-primary animate-spin" />
        <p className="text-sm text-slate-400 font-medium">리포트를 불러오는 중이에요...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-blue-50/30 flex flex-col items-center justify-center p-6 text-center gap-4">
        <AlertCircle size={36} className="text-slate-300" />
        <div>
          <p className="text-base font-semibold text-slate-600 mb-1">리포트를 불러올 수 없어요</p>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{error || "알 수 없는 오류가 발생했습니다."}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
        >
          다시 시도하기
        </button>
      </div>
    );
  }



  const toggleCheck = (idx: number) => {
    if (checkedSteps.includes(idx)) {
      setCheckedSteps(checkedSteps.filter(i => i !== idx));
    } else {
      setCheckedSteps([...checkedSteps, idx]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* 상단 헤더 & 네비게이션 */}
      <div className="bg-white px-6 pt-10 pb-4 sticky top-0 z-50 border-b border-zinc-100 shadow-sm">
        <div className="max-w-md mx-auto">
          <p className="text-zinc-500 text-sm font-bold mb-1">안녕하세요, {reportData.user_name}님 👋</p>
          <h1 className="text-2xl font-black text-zinc-900 leading-snug tracking-tight mb-6">
            상담 분석 리포트가<br/>준비되었어요
          </h1>
          
          {/* 슬라이드 탭 네비게이션 */}
          <div className="flex gap-2 p-1 bg-zinc-100 rounded-2xl">
            {["진단 결과", "추천 정책", "실천 계획"].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  currentSlide === idx 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 py-8">
        {/* 슬라이드 1: 진단 결과 & 상담사 메시지 (채팅 버블 UI) */}
        {currentSlide === 0 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
            {/* 핵심 요약 */}
            <section>
              <h2 className="text-sm font-black text-zinc-400 mb-3 flex items-center gap-1.5 uppercase tracking-widest pl-1">
                <MessageCircle size={14} /> AI 분석 요약
              </h2>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                <p className="text-[15px] text-zinc-700 leading-relaxed font-medium">
                  {renderFormattedText(reportData.main_issue)}
                </p>
              </div>
            </section>

            {/* 상담사 메시지 (채팅 UI) */}
            <section className="pt-2">
              <h2 className="text-sm font-black text-zinc-400 mb-4 flex items-center gap-1.5 uppercase tracking-widest pl-1">
                <Heart size={14} className="text-rose-400" /> 상담사의 메시지
              </h2>
              <div className="flex gap-3">
                {/* 프로필 이미지 아이콘 */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm shadow-indigo-100 mt-1">
                  <span className="text-lg">👩‍💼</span>
                </div>
                {/* 말풍선 */}
                <div className="flex-1">
                   <p className="text-xs font-bold text-zinc-500 mb-1.5 pl-1">열고닫기 담당자</p>
                   <div className="bg-white text-[15px] text-zinc-800 leading-relaxed p-5 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 inline-block font-medium">
                     {renderFormattedText(reportData.user_message)}
                   </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 슬라이드 2: 추천 정책 */}
        {currentSlide === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <h2 className="text-sm font-black text-zinc-400 mb-2 flex items-center gap-1.5 uppercase tracking-widest pl-1">
              <Target size={14} className="text-blue-500" /> 맞춤 추천 정책
            </h2>
            <div className="space-y-3">
              {reportData.policy_match.length > 0 ? (
                reportData.policy_match.map((policy: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-blue-100/50 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={16} className="text-blue-500" />
                    </div>
                    <span className="text-[15px] text-zinc-700 leading-snug font-medium pt-1.5">{renderFormattedText(policy)}</span>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-3xl text-center border border-zinc-100">
                  <p className="text-sm text-zinc-400 font-bold">추천 정책을 찾지 못했습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 슬라이드 3: 실천 계획 (체크리스트 UI) */}
        {currentSlide === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
             <h2 className="text-sm font-black text-zinc-400 mb-2 flex items-center gap-1.5 uppercase tracking-widest pl-1">
               <Sparkles size={14} className="text-amber-500" /> 향후 실천 계획 (To-Do)
             </h2>
             <div className="bg-white p-2 rounded-3xl border border-amber-100/50 shadow-sm">
              {reportData.next_steps.length > 0 ? (
                <div className="divide-y divide-zinc-50">
                  {reportData.next_steps.map((step: string, idx: number) => {
                    const isChecked = checkedSteps.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleCheck(idx)}
                        className={`flex items-start gap-4 p-5 transition-all cursor-pointer select-none group ${isChecked ? 'opacity-50' : 'hover:bg-zinc-50/50 rounded-3xl'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isChecked ? 'bg-amber-400 border-amber-400 text-white' : 'border-zinc-200 bg-white group-hover:border-amber-400 text-transparent'}`}>
                          <CheckCircle2 size={14} color="currentColor" strokeWidth={3} />
                        </div>
                        <p className={`text-[15px] leading-relaxed transition-all ${isChecked ? 'text-zinc-400 line-through' : 'text-zinc-700 font-medium'}`}>
                          {renderFormattedText(step)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic text-center py-8 font-bold">준비된 다음 단계가 없습니다.</p>
              )}
             </div>
          </div>
        )}

        {/* 하단 네비게이션 버튼 */}
        <div className="mt-10 flex justify-between gap-3">
          {currentSlide > 0 && (
             <button onClick={() => setCurrentSlide(prev => prev - 1)} className="px-6 py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-200/50 hover:bg-zinc-200 transition-colors">
               이전
             </button>
          )}
          <button 
             onClick={() => currentSlide < 2 ? setCurrentSlide(prev => prev + 1) : window.close()} 
             className="px-6 py-4 rounded-2xl font-bold text-white bg-primary hover:bg-blue-600 transition-colors flex-1 shadow-lg shadow-blue-100"
          >
             {currentSlide < 2 ? "다음 보기" : "리포트 닫기"}
          </button>
        </div>
      </main>
    </div>
  );
}
