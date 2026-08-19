"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, LayoutDashboard, FileText, PlusCircle, Tag } from "lucide-react";
import { useUITag } from "@/context/UITagContext";
import OpclLogoSymbol from "@/components/common/OpclLogoSymbol";
import RotatingBrandText from "@/components/common/RotatingBrandText";

export default function Navbar() {
  const { user, userRole, logout, isLoading } = useAuth();
  const { showTags, toggleTags } = useUITag();
  const pathname = usePathname();

  return (
    <nav className="global-navbar sticky top-0 z-50 w-full glass border-b border-slate-200/60 px-3 sm:px-6 py-1.5 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* 1. 좌측 로고: ㅇㄱㄷㄱ 4방향 심볼 + '열고닫기' 5단계 롤링 워드마크 */}
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0">
          <OpclLogoSymbol size={30} variant="grid" className="sm:w-[32px] sm:h-[32px]" />
          <span className="text-sm sm:text-[15px] font-black tracking-[-0.04em] leading-none select-none flex items-center gap-1">
            <span className="text-slate-900 group-hover:text-blue-950 transition-colors">열고닫기</span>
            <RotatingBrandText />
          </span>
        </Link>

        {/* 2. 우측 메뉴 & 계정 컨트롤 */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isLoading ? (
            <div className="w-16 sm:w-24 h-7 sm:h-8 bg-zinc-100 animate-pulse rounded-lg sm:rounded-xl" />
          ) : user ? (
            <>
              {/* 메뉴 캡슐 탭 (Pill Tabs) */}
              {userRole === "manager" ? (
                <div className="bg-slate-100/80 p-0.5 rounded-lg sm:rounded-xl flex items-center gap-0.5 border border-slate-200/50">
                  <Link 
                    href="/manager/dashboard" 
                    className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs transition-all ${
                      pathname === "/manager/dashboard"
                        ? "bg-white text-primary font-black shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 font-bold"
                    }`}
                  >
                    <LayoutDashboard size={12} className="shrink-0" />
                    <span className="hidden sm:inline">접수 관리</span>
                    <span className="sm:hidden">접수</span>
                  </Link>
                  <Link 
                    href="/manager/completed" 
                    className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs transition-all ${
                      pathname === "/manager/completed"
                        ? "bg-white text-primary font-black shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 font-bold"
                    }`}
                  >
                    <FileText size={12} className="shrink-0" />
                    <span className="hidden sm:inline">완료 내역</span>
                    <span className="sm:hidden">완료</span>
                  </Link>
                </div>
              ) : (
                <div className="bg-slate-100/80 p-0.5 rounded-lg sm:rounded-xl flex items-center gap-0.5 border border-slate-200/50">
                  <Link 
                    href="/client/dashboard" 
                    className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs transition-all ${
                      pathname === "/client/dashboard"
                        ? "bg-white text-primary font-black shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 font-bold"
                    }`}
                  >
                    <LayoutDashboard size={12} className="shrink-0" />
                    <span className="hidden sm:inline">상담 현황</span>
                    <span className="sm:hidden">현황</span>
                  </Link>
                  <Link 
                    href="/client/intake" 
                    className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs transition-all ${
                      pathname === "/client/intake"
                        ? "bg-white text-primary font-black shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 font-bold"
                    }`}
                  >
                    <PlusCircle size={12} className="shrink-0" />
                    <span className="hidden sm:inline">새 상담 신청</span>
                    <span className="sm:hidden">신청</span>
                  </Link>
                </div>
              )}

              {/* UI 식별 태그 토글 (슬림 뱃지) */}
              <button
                onClick={toggleTags}
                title="피드백용 UI 식별 태그 온/오프"
                className={`flex items-center gap-1 px-1.5 py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black transition-all border shrink-0 ${
                  showTags 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                    : "bg-zinc-50 border-zinc-200/80 text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Tag size={10} className={showTags ? "text-indigo-600" : "text-zinc-400"} />
                <span>{showTags ? "ID ON" : "ID OFF"}</span>
              </button>
              
              <div className="h-3 w-px bg-zinc-200 shrink-0 mx-0.5" />
              
              {/* 일체형 프로필 & 로그아웃 버튼 */}
              <div className="flex items-center gap-1 font-bold shrink-0">
                <Link 
                  href="/profile" 
                  title={user?.email || "내 프로필"}
                  className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 text-[11px] sm:text-xs text-zinc-700 hover:text-primary hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <User size={11} className="sm:w-3 sm:h-3" />
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate text-[11px]">{user?.email?.split("@")[0] || ""}</span>
                </Link>
                <button 
                  onClick={async () => {
                    await logout();
                    window.location.href = "/";
                  }}
                  className="p-1 sm:p-1.5 hover:bg-red-50 rounded-md sm:rounded-lg transition-colors text-zinc-400 hover:text-red-500 shrink-0"
                  title="로그아웃"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/login" className="text-xs sm:text-sm font-bold text-zinc-600 hover:text-primary px-2 py-1">
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="text-xs sm:text-sm font-bold bg-primary text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl hover:bg-primary/90 transition-all shadow-xs"
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
