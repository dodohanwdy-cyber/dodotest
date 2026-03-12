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
            main_issue:
              data.main_issue || "주요 고민 내용이 정리되지 않았습니다.",
            user_message:
              data.user_message ||
              "상담사가 전하는 메시지가 생성되지 않았습니다.",
            policy_match: data.policy_match
              ? typeof data.policy_match === "string"
                ? data.policy_match
                    .split("\n")
                    .filter((s: string) => s.trim() !== "")
                : data.policy_match
              : [],
            next_steps: data.next_step
              ? typeof data.next_step === "string"
                ? data.next_step
                    .split("\n")
                    .map((s: string) =>
                      s.replace(/^\d+\.\s*/, "").trim()
                    )
                    .filter((s: string) => s !== "")
                : data.next_step
              : [],
          });
        } else {
          setError(
            "리포트 정보를 찾을 수 없습니다. 아직 분석이 진행 중이거나, 잘못된 링크일 수 있습니다."
          );
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
      <div className="min-h-screen bg-rose-50/30 flex flex-col items-center justify-center p-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Loader2 size={32} className="text-rose-300 animate-spin" />
          </div>
          <Heart
            className="absolute -top-1 -right-1 text-rose-400 fill-rose-400"
            size={24}
          />
        </div>
        <h2 className="text-xl font-bold text-rose-900/70 animate-pulse">
          리포트를 불러오는 중입니다...
        </h2>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-8 border border-zinc-100">
          <AlertCircle size={40} className="text-amber-400" />
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
    <div className="min-h-screen bg-[#FFFDFD] pb-12 overflow-x-hidden">
      <div className="h-48 bg-gradient-to-br from-rose-100/50 to-indigo-100/50 absolute top-0 left-0 right-0 -z-10 blur-3xl opacity-60 rounded-full scale-150 transform -translate-y-1/2" />

      <main className="max-w-md mx-auto px-6 pt-12">
        <header className="mb-12 text-center">
          <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm border border-rose-50 mb-6">
            <Sparkles className="text-rose-400" size={28} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 leading-tight">
            <span className="text-rose-500">{reportData.user_name}</span>님을 위한
            <br />
            상담 분석 리포트
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-3 tracking-tight">
            오늘 상담에서 나눈 소중한 이야기들을 정리했습니다.
          </p>
        </header>

        <div className="space-y-6">
          <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-50 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-sm font-black text-rose-400/80 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageCircle size={16} /> 핵심 요약
            </h2>
            <div className="text-lg font-bold text-zinc-800 leading-relaxed">
              {reportData.main_issue}
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[32px] p-8 shadow-xl text-white transform hover:scale-[1.01] transition-transform animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 bg-white/20 rounded-xl">
                <Heart className="fill-white" size={24} />
              </div>
              <span className="text-xs font-bold text-white/60 tracking-widest uppercase">
                From your counselor
              </span>
            </div>
            <p className="text-xl font-bold leading-relaxed mb-4">
              &ldquo;{reportData.user_message}&rdquo;
            </p>
            <div className="h-1 w-12 bg-white/30 rounded-full" />
          </section>

          <section className="bg-rose-50/30 rounded-[32px] p-8 border border-white shadow-sm animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-sm font-black text-rose-400/80 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Target size={18} /> 맞춤형 추천 정책
            </h2>
            <div className="space-y-3">
              {reportData.policy_match.length > 0 ? (
                reportData.policy_match.map((policy: string, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl border border-rose-100/50 shadow-sm flex items-start gap-3"
                  >
                    <div className="mt-1 text-rose-400">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 leading-tight">
                      {policy}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400 py-4 italic">
                  추천 정책을 준비 중입니다.
                </p>
              )}
            </div>
          </section>

          <section className="bg-zinc-900 rounded-[32px] p-8 shadow-sm animate-in slide-in-from-bottom-10 duration-1000">
            <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Sparkles size={18} className="text-amber-400" /> 향후 실천 계획
            </h2>
            <div className="space-y-4">
              {reportData.next_steps.length > 0 ? (
                reportData.next_steps.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 border border-zinc-700 group-hover:bg-amber-400 group-hover:text-zinc-900 group-hover:border-amber-400 transition-colors shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-medium text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                      {step}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600 italic">
                  다음 단계를 준비 중입니다.
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-16 text-center pb-8 border-t border-rose-100/30 pt-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Heart size={16} className="text-rose-400 fill-rose-400" />
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
