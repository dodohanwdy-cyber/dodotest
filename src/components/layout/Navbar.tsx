"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, LayoutDashboard, FileText, PlusCircle, Tag } from "lucide-react";
import { useUITag } from "@/context/UITagContext";

export default function Navbar() {
  const { user, userRole, logout, isLoading } = useAuth();
  const { showTags, toggleTags } = useUITag();



  return (
    <nav className="global-navbar sticky top-0 z-50 w-full glass border-b border-slate-100 px-3 sm:px-6 py-2.5 sm:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-10">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group transition-transform hover:scale-105 active:scale-95">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg text-white font-black shadow-md shadow-blue-100">열</div>
              <div className="flex flex-col">
                <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">열고닫기</h3>
                <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest hidden sm:block">Official Partner of Youth Center</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          {/* UI 식별 태그 토글 스위치 (피드백 용) */}
          <button
            onClick={toggleTags}
            title="피드백용 UI 식별 태그 온/오프"
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all border shrink-0 ${
              showTags 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Tag size={12} className={showTags ? "text-indigo-600" : "text-zinc-400"} />
            <span>ID {showTags ? "ON" : "OFF"}</span>
          </button>


          {isLoading ? (
            <div className="w-16 sm:w-20 h-7 sm:h-8 bg-zinc-100 animate-pulse rounded-xl" />
          ) : user ? (
            <>
              {userRole === "manager" ? (
                <div className="flex items-center gap-2 sm:gap-6">
                  <Link href="/manager/dashboard" className="flex items-center gap-1.5 text-xs sm:text-[14px] font-bold text-zinc-600 hover:text-primary transition-all group">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all">
                      <LayoutDashboard size={14} className="text-zinc-500 group-hover:text-primary" />
                    </div>
                    <span className="hidden sm:inline">상담 접수 관리</span>
                    <span className="sm:hidden">접수관리</span>
                  </Link>
                  <Link href="/manager/completed" className="flex items-center gap-1.5 text-xs sm:text-[14px] font-bold text-zinc-600 hover:text-primary transition-all group">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all">
                      <FileText size={14} className="text-zinc-500 group-hover:text-primary" />
                    </div>
                    <span className="hidden sm:inline">상담 완료 내역</span>
                    <span className="sm:hidden">완료내역</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-6">
                  <Link href="/client/dashboard" className="flex items-center gap-1.5 text-xs sm:text-[14px] font-bold text-zinc-600 hover:text-primary transition-all group">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all">
                      <LayoutDashboard size={14} className="text-zinc-500 group-hover:text-primary" />
                    </div>
                    <span className="hidden sm:inline">상담 현황</span>
                    <span className="sm:hidden">현황</span>
                  </Link>
                  <Link href="/client/intake" className="flex items-center gap-1.5 text-xs sm:text-[14px] font-bold text-zinc-600 hover:text-primary transition-all group">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all">
                      <PlusCircle size={14} className="text-zinc-500 group-hover:text-primary" />
                    </div>
                    <span className="hidden sm:inline">신청하기</span>
                    <span className="sm:hidden">신청</span>
                  </Link>
                </div>
              )}
              
              <div className="h-4 w-px bg-zinc-200 mx-1 sm:mx-2 shrink-0" />
              
              <div className="flex items-center gap-2 sm:gap-4 text-zinc-600 font-bold">
                <Link href="/profile" className="text-xs sm:text-[14px] flex items-center gap-1 hover:text-primary transition-colors max-w-[90px] sm:max-w-[140px] truncate">
                  <User size={14} className="text-zinc-400 shrink-0" /> <span className="truncate">{user?.email?.split("@")[0] || ""}</span>
                </Link>
                <button 
                  onClick={async () => {
                    await logout();
                    window.location.href = "/";
                  }}
                  className="p-1 sm:p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-red-500 shrink-0"
                  title="로그아웃"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs sm:text-[14px] font-bold text-zinc-500 hover:text-primary transition-colors">
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="text-xs sm:text-[14px] font-bold bg-primary text-white px-3 sm:px-6 py-1.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-primary/90 transition-all shadow-md shadow-blue-100"
              >
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
