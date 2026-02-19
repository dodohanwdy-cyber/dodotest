"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, LayoutDashboard, FileText } from "lucide-react";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <nav className="global-navbar sticky top-0 z-50 w-full glass border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95">
            <img 
              src="/logo_opcl.png" 
              alt="열고닫기 OPCL" 
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="w-20 h-8 bg-zinc-100 animate-pulse rounded-xl" />
          ) : user ? (
            <>
              {user.role === "client" ? (
                <div className="flex items-center gap-6">
                  <Link href="/client/dashboard" className="text-[14px] font-bold text-zinc-500 hover:text-primary transition-colors">
                    상담 현황
                  </Link>
                  <Link href="/client/intake" className="text-[14px] font-bold text-zinc-500 hover:text-primary transition-colors">
                    신청하기
                  </Link>
                </div>
              ) : (
                <Link href="/manager/dashboard" className="text-[14px] font-bold text-zinc-500 hover:text-primary transition-colors">
                  관리자 데스크
                </Link>
              )}
              
              <div className="h-4 w-px bg-zinc-200 mx-2" />
              
              <div className="flex items-center gap-4 text-zinc-600 font-bold">
                <Link href="/profile" className="text-[14px] flex items-center gap-2 hover:text-primary transition-colors">
                  <User size={16} className="text-zinc-400" /> {user.email.split("@")[0]}
                </Link>
                <button 
                  onClick={logout}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-red-500"
                  title="로그아웃"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[14px] font-bold text-zinc-500 hover:text-primary transition-colors">
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="text-[14px] font-bold bg-primary text-white px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-blue-100"
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
