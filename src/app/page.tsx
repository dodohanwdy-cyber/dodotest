"use client";

import { ArrowRight, Sparkles, ShieldCheck, Zap, MessageCircle, Calendar, ClipboardCheck, Lock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-white">
      {/* 장식용 背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-blue-100 shadow-sm animate-fade-in">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[8px] text-white font-bold border-2 border-white">열</div>
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white overflow-hidden">
                <img src="/logo_opcl.png" className="w-4 h-4 object-contain opacity-50" alt="CO" />
              </div>
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
              청년센터 공식 정책 상담 매칭 파트너
            </span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight break-keep">
              청년의 내일을 위한<br/>
              <span className="text-primary relative inline-block">
                가장 든든한 상담 창구
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                   <path d="M1 9.5C50 3.5 150 1.5 299 9.5" stroke="#FFAE00" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed pt-4 break-keep">
              청년센터가 검증한 '열고닫기'의 AI 기술과 전문 상담사가 만나,<br/>
              당신에게 꼭 필요한 정책 솔루션을 안전하게 찾아드립니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full sm:w-auto">
            {user ? (
              <Link 
                href={user.role === "manager" ? "/manager/dashboard" : "/client/intake"}
                className="group bg-primary text-white ml-0 sm:ml-4 px-12 py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all hover:bg-primary/90 shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95"
              >
                {user.role === "manager" ? "관리자 대시보드" : "바로 상담 신청하기"} 
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="group bg-primary text-white px-12 py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all hover:bg-primary/90 shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95"
              >
                상담 시작하기 <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          {/* Trust Elements */}
          <div className="pt-12 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="flex items-center gap-2">
                <ShieldCheck className="text-slate-400" size={20} />
                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">100% 개인정보 비밀보장</span>
             </div>
             <div className="flex items-center gap-2">
                <Lock className="text-slate-400" size={20} />
                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">청년정책 데이터 보안 검증</span>
             </div>
             <div className="flex items-center gap-2">
                <Sparkles className="text-slate-400" size={20} />
                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">정부 인증 상담 알고리즘</span>
             </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Easy Process</h2>
            <p className="text-3xl font-black text-slate-800">3단계로 끝내는 맞춤 정책 진단</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 hidden md:block -z-10" />
            
            {[
              { 
                step: "01", 
                title: "AI 사전 진단", 
                desc: "AI 챗과 가벼운 대화를 나누며 현재 가장 시급한 고민을 파악합니다.",
                icon: <MessageCircle size={32} />,
                color: "bg-blue-500"
              },
              { 
                step: "02", 
                title: "상담 일정 예약", 
                desc: "당신이 편안하게 대화할 수 있는 시간을 자유롭게 선택하세요.",
                icon: <Calendar size={32} />,
                color: "bg-amber-500"
              },
              { 
                step: "03", 
                title: "상담 리포트 확인", 
                desc: "전문가가 분석한 맞춤 정책 가이드를 리포트로 받아보세요.",
                icon: <ClipboardCheck size={32} />,
                color: "bg-green-500"
              }
            ].map((item, idx) => (
              <div key={idx} className="group relative bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl transition-all hover:-translate-y-2">
                <div className={`w-16 h-16 ${item.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="text-[50px] font-black text-slate-100 absolute top-8 right-10 leading-none">
                  {item.step}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{item.title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed break-keep">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Partner Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16 bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl border border-slate-50 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
           
           <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner mx-auto md:mx-0">
                 <Lock size={32} />
              </div>
              <h3 className="text-3xl font-black text-slate-900">당신의 고민은 안전합니다</h3>
              <p className="text-lg text-slate-500 font-bold leading-relaxed break-keep">
                청년센터와의 긴밀한 협력을 통해 운영되는 열고닫기는 최고 수준의 보안 가이드라인을 준수합니다. 상담 내용은 오직 정책 추천을 위한 데이터로만 활용되며 상담 완료 후 철저히 보호됩니다.
              </p>
              <div className="flex gap-4 pt-4 justify-center md:justify-start">
                 <div className="bg-slate-50 px-5 py-3 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-wider">가명 처리 분석</div>
                 <div className="bg-slate-50 px-5 py-3 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-wider">보안 등급 준수</div>
              </div>
           </div>

           <div className="w-full md:w-[360px] space-y-4">
              <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100 space-y-6">
                 <p className="text-[11px] font-black text-primary uppercase tracking-widest text-center">In collaboration with</p>
                 <div className="flex flex-col items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm w-full flex items-center justify-center">
                       <img src="/logo_opcl.png" className="h-8 object-contain" alt="YOUTH CENTER" />
                    </div>
                    <div className="text-slate-300 font-black text-lg">X</div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm w-full flex items-center justify-center">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">열</div>
                          <span className="font-black text-slate-900">열고닫기</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-32 px-6">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[4rem] p-12 md:p-20 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight break-keep relative z-10">
            지금, 청년센터의 공식 상담을<br/> 시작해 보세요
          </h2>
          <div className="pt-4 relative z-10">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-3 bg-white text-slate-900 px-12 py-5 rounded-[2rem] font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
            >
              로그인 후 신청하기 <ArrowRight size={22} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
