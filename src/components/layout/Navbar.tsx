"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, LayoutDashboard, FileText, PlusCircle, Tag } from "lucide-react";
import { useUITag } from "@/context/UITagContext";

export default function Navbar() {
  const { user, userRole, logout, isLoading } = useAuth();
  const { showTags, toggleTags } = useUITag();

  return (
    <nav className="global-navbar sticky top-0 z-50 w-full glass border-b border-slate-100 px-2.5 sm:px-6 py-2 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* 좌측 로고 */}
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-base text-white font-black shadow-sm shadow-blue-100">
            열
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-none">열고닫기</h3>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest hidden sm:block mt-0.5">Youth Policy CRM</p>
          </div>
        </Link>

        {/* 우측 메뉴 및 계정 컨트롤 */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* UI 식별 태그 토글 스위치 (피드백 용) */}
          <button
            onClick={toggleTags}
            title="피드백용 UI 식별 태그 온/오프"
            className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all border shrink-0 whitespace-nowrap ${
              showTags 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Tag size={11} className={showTags ? "text-indigo-600" : "text-zinc-400"} />
            <span className="font-extrabold">{showTags ? "ID ON" : "ID OFF"}</span>
          </button>

          {isLoading ? (
            <div className="w-14 sm:w-20 h-7 sm:h-8 bg-zinc-100 animate-pulse rounded-lg sm:rounded-xl" />
          ) : user ? (
            <>
              {/* 매니저/내담자 네비게이션 메뉴 */}
              {userRole === "manager" ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link 
                    href="/manager/dashboard" 
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-zinc-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <LayoutDashboard size={13} className="text-zinc-500 shrink-0" />
                    <span className="hidden sm:inline">상담 접수 관리</span>
                    <span className="sm:hidden">접수</span>
                  </Link>
                  <Link 
                    href="/manager/completed" 
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-zinc-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <FileText size={13} className="text-zinc-500 shrink-0" />
                    <span className="hidden sm:inline">상담 완료 내역</span>
                    <span className="sm:hidden">완료</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link 
                    href="/client/dashboard" 
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-zinc-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <LayoutDashboard size={13} className="text-zinc-500 shrink-0" />
                    <span className="hidden sm:inline">상담 현황</span>
                    <span className="sm:hidden">현황</span>
                  </Link>
                  <Link 
                    href="/client/intake" 
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-zinc-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <PlusCircle size={13} className="text-zinc-500 shrink-0" />
                    <span className="hidden sm:inline">상담 신청</span>
                    <span className="sm:hidden">신청</span>
                  </Link>
                </div>
              )}
              
              <div className="h-3.5 w-px bg-zinc-200 mx-0.5 shrink-0" />
              
              {/* 유저 계정 및 로그아웃 */}
              <div className="flex items-center gap-1 sm:gap-2 font-bold shrink-0">
                <Link 
                  href="/profile" 
                  title={user?.email || "내 프로필"}
                  className="flex items-center gap-1 px-1.5 py-1 text-[11px] sm:text-xs text-zinc-600 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <User size={12} className="sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="hidden sm:inline max-w-[90px] truncate">{user?.email?.split("@")[0] || ""}</span>
                </Link>
                <button 
                  onClick={async () => {
                    await logout();
                    window.location.href = "/";
                  }}
                  className="p-1 sm:p-1.5 hover:bg-red-50 rounded-md sm:rounded-lg transition-colors text-zinc-400 hover:text-red-500 shrink-0"
                  title="로그아웃"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link href="/login" className="text-xs sm:text-sm font-bold text-zinc-600 hover:text-primary px-2 py-1">
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="text-xs sm:text-sm font-bold bg-primary text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-primary/90 transition-all shadow-sm shadow-blue-100"
              >
                시작하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
