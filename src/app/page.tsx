"use client";

import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-[calc(100vh-160px)] bg-white flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>
      
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase">
            <Sparkles size={14} className="text-blue-500" /> AI 기반 청년정책 맞춤 상담
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.2] tracking-tight">
            내일의 고민을<br/>
            <span className="text-primary underline decoration-accent decoration-4 underline-offset-8">오늘의 정책</span>으로
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg break-keep">
            열고닫기는 청년들의 목소리를 귀담아듣고, AI 분석을 통해 가장 필요한 정책 수혜로 연결합니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            {user ? (
              <Link 
                href={user.role === "manager" ? "/manager/dashboard" : "/client/intake"}
                className="bg-primary text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 btn-interactive shadow-xl shadow-blue-100 transition-all hover:bg-primary/90"
              >
                {user.role === "manager" ? "관리자 대시보드" : "상담 신청하기"} <ArrowRight size={20} />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="bg-primary text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 btn-interactive shadow-xl shadow-blue-100 transition-all hover:bg-primary/90"
              >
                지금 시작하기 <ArrowRight size={20} />
              </Link>
            )}
            <button className="bg-white text-slate-600 border border-slate-200 px-10 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
              서비스 소개 보기
            </button>
          </div>
        </div>

        <div className="relative group hidden md:block">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-amber-500 rounded-[3rem] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"></div>
          <div className="relative glass p-10 rounded-[3rem] shadow-2xl border-white/50 space-y-8">
            <div className="flex gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">신뢰할 수 있는 분석</h3>
                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Security & Trust</p>
              </div>
            </div>
            <div className="h-px bg-slate-100 w-full" />
            <div className="flex gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                <Zap size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">빠른 정책 매칭</h3>
                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Fast & Accurate</p>
              </div>
            </div>
            <div className="pt-4 bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">실시간 상담 매칭 시스템</span>
                <span className="flex items-center gap-1.5 text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                </span>
              </div>
              <div className="space-y-3">
                <div className="h-2.5 bg-slate-200 rounded-full w-full opacity-40" />
                <div className="h-2.5 bg-slate-200 rounded-full w-3/4 opacity-40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
