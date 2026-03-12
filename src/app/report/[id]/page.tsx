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
  ArrowRight,
  FileText,
} from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

export default function ClientReportPage() {
  const { id } = useParams();

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const rawId = Array.isArray(id) ? id[0] : id;

    const loadReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await postToWebhook(WEBHOOK_URLS.GET_COMPLETED_DETAIL, {
          request_id: rawId,
        });
        const data = Array.isArray(res)
          ? res[0]?.data || res[0]
          : res?.data || res;

        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setReportData({
            user_name: data.name || data.user_name || "내담자",
            main_issue: data.main_issue || "주요 고민 내용이 정리되지 않았습니다.",
            user_message: data.user_message || "상담사가 전하는 메시지가 생성되지 않았습니다.",
            policy_match: data.policy_match
              ? typeof data.policy_match === "string"
                ? data.policy_match.split("\n").filter((s: string) => s.trim() !== "")
                : data.policy_match
              : [],
            next_steps: data.next_step
              ? typeof data.next_step === "string"
                ? data.next_step
                    .split("\n")
                    .map((s: string) => s.replace(/^\d+\.\s*/, "").trim())
                    .filter((s: string) => s !== "")
                : data.next_step
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
      <div className="min-h-screen bg-indigo-50/40 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 border border-indigo-100">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-indigo-900/60 animate-pulse">
          리포트를 불러오는 중입니다...
        </h2>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-indigo-50/40 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-8 border border-indigo-100">
          <AlertCircle size={40} className="text-indigo-300" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">
          리포트를 불러올 수 없습니다
        </h2>
        <p className="text-zinc-500 font-medium mb-10 max-w-xs leading-relaxed">
          {error || "알 수 없는 오류가 발생했습니다."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 상단 헤더 배너 */}
      <div className="bg-primary px-6 py-12 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <FileText size={16} />
            <span className="text-sm font-bold uppercase tracking-widest">
              Consultation Analysis Report
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            <span className="opacity-70">{reportData.user_name}님을 위한</span>
            <br />
            상담 분석 리포트
          </h1>
          <p className="text-indigo-200 font-medium mt-3 text-sm md:text-base">
            오늘 상담에서 나눈 소중한 이야기들을 전문가가 정리했습니다.
          </p>
        </div>
      </div>

      {/* 본문 */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 왼쪽: 핵심 요약 + 상담사 메시지 (세로로 쌓임, 데스크탑에서는 2칸) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 핵심 요약 */}
            <section className="bg-white rounded-[28px] p-8 md:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageCircle size={18} />
                </div>
                <h2 className="text-xs font-black text-primary uppercase tracking-widest">
                  핵심 요약
                </h2>
              </div>
              <p className="text-lg md:text-xl font-bold text-zinc-800 leading-relaxed">
                {reportData.main_issue}
              </p>
            </section>

            {/* 상담사 메시지 */}
            <section className="bg-primary/5 rounded-[28px] p-8 md:p-10 border border-primary/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Heart size={18} />
                  </div>
                  <h2 className="text-xs font-black text-primary uppercase tracking-widest">
                    상담사 메시지
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-primary/40 tracking-widest uppercase hidden md:block">
                  From your counselor
                </span>
              </div>
              <blockquote className="text-lg md:text-xl font-bold text-zinc-800 leading-relaxed border-l-4 border-primary/30 pl-6">
                &ldquo;{reportData.user_message}&rdquo;
              </blockquote>
            </section>

          </div>

          {/* 오른쪽: 맞춤형 추천 정책 */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Target size={18} />
                </div>
                <h2 className="text-xs font-black text-primary uppercase tracking-widest">
                  추천 정책
                </h2>
              </div>
              <div className="space-y-3">
                {reportData.policy_match.length > 0 ? (
                  reportData.policy_match.map((policy: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                    >
                      <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm font-bold text-zinc-700 leading-snug">
                        {policy}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400 py-4 italic text-center">
                    추천 정책을 준비 중입니다.
                  </p>
                )}
              </div>
            </section>
          </div>

        </div>

        {/* 하단: 향후 실천 계획 (전체 너비) */}
        <section className="mt-6 bg-white rounded-[28px] p-8 md:p-10 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={18} />
            </div>
            <h2 className="text-xs font-black text-primary uppercase tracking-widest">
              향후 실천 계획
            </h2>
          </div>
          {reportData.next_steps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.next_steps.map((step: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium text-zinc-700 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 italic text-center py-4">
              다음 단계를 준비 중입니다.
            </p>
          )}
        </section>

        {/* 푸터 */}
        <footer className="mt-12 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart size={14} className="text-primary" />
            </div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-[.2em]">
              OPCL Care Team
            </p>
          </div>
          <p className="text-[10px] text-zinc-300 font-medium">
            © 2024 열고닫기. 모든 데이터는 보안으로 보호됩니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
