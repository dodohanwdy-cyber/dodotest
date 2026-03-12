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
        const res = await postToWebhook(WEBHOOK_URLS.GET_COMPLETED_DETAIL, { request_id: rawId });
        const data = Array.isArray(res) ? res[0]?.data || res[0] : res?.data || res;

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
                ? data.next_step.split("\n").map((s: string) => s.replace(/^\d+\.\s*/, "").trim()).filter((s: string) => s !== "")
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-4">
        <Loader2 size={28} className="text-primary animate-spin" />
        <p className="text-sm text-slate-400 font-medium">리포트를 불러오는 중이에요...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-4">
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* 헤더 */}
      <div className="bg-primary px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-5 opacity-60">
            <FileText size={14} />
            <span className="text-xs font-medium uppercase tracking-widest text-white">
              Consultation Report
            </span>
          </div>
          <p className="text-indigo-200 text-sm mb-1">안녕하세요, {reportData.user_name}님 👋</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-white leading-snug">
            상담 분석 리포트가 준비되었어요.
          </h1>
          <p className="text-indigo-200/70 text-sm mt-2 leading-relaxed">
            전문 상담사가 정성껏 분석한 결과입니다. 천천히 읽어봐 주세요.
          </p>
        </div>
      </div>

      {/* 본문 */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 왼쪽: 핵심 요약 + 상담사 메시지 */}
          <div className="lg:col-span-2 space-y-5">

            {/* 핵심 요약 */}
            <section className="bg-white rounded-3xl p-7 md:p-9 shadow-sm border border-slate-100/80">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={15} className="text-primary/60" />
                <span className="text-[11px] font-semibold text-primary/60 uppercase tracking-widest">
                  핵심 요약
                </span>
              </div>
              <p className="text-base md:text-lg text-slate-600 leading-[1.85] font-normal">
                {reportData.main_issue}
              </p>
            </section>

            {/* 상담사 메시지 */}
            <section className="bg-primary/5 rounded-3xl p-7 md:p-9 border border-primary/10">
              <div className="flex items-center gap-2 mb-5">
                <Heart size={15} className="text-primary/60" />
                <span className="text-[11px] font-semibold text-primary/60 uppercase tracking-widest">
                  상담사 메시지
                </span>
              </div>
              <blockquote className="text-base md:text-lg text-slate-600 leading-[1.85] font-normal pl-4 border-l-2 border-primary/20 italic">
                &ldquo;{reportData.user_message}&rdquo;
              </blockquote>
            </section>

          </div>

          {/* 오른쪽: 추천 정책 */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100/80 h-full">
              <div className="flex items-center gap-2 mb-5">
                <Target size={15} className="text-primary/60" />
                <span className="text-[11px] font-semibold text-primary/60 uppercase tracking-widest">
                  추천 정책
                </span>
              </div>
              <div className="space-y-2.5">
                {reportData.policy_match.length > 0 ? (
                  reportData.policy_match.map((policy: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-primary/5 hover:border-primary/15 transition-colors"
                    >
                      <CheckCircle2 size={14} className="text-primary/50 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-600 leading-snug font-normal">{policy}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">준비 중입니다.</p>
                )}
              </div>
            </section>
          </div>

        </div>

        {/* 향후 실천 계획 */}
        <section className="mt-5 bg-white rounded-3xl p-7 md:p-9 shadow-sm border border-slate-100/80">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={15} className="text-primary/60" />
            <span className="text-[11px] font-semibold text-primary/60 uppercase tracking-widest">
              향후 실천 계획
            </span>
          </div>
          {reportData.next_steps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reportData.next_steps.map((step: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-primary/5 hover:border-primary/15 transition-colors"
                >
                  <span className="text-xs font-semibold text-primary/50 mt-0.5 shrink-0 w-5 text-center">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">{step}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-4">다음 단계를 준비 중입니다.</p>
          )}
        </section>

        {/* 푸터 */}
        <footer className="mt-10 pb-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart size={12} className="text-slate-300" />
            <p className="text-[11px] text-slate-300 uppercase tracking-widest">OPCL Care Team</p>
          </div>
          <p className="text-[10px] text-slate-300">© 2024 열고닫기. 모든 데이터는 보안으로 보호됩니다.</p>
        </footer>
      </main>
    </div>
  );
}
