"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { login } = useAuth();

  // 회원가입에서 넘어온 이메일 자동 입력
  useEffect(() => {
    const signupEmail = sessionStorage.getItem('signup_email');
    if (signupEmail) {
      setEmail(signupEmail);
      sessionStorage.removeItem('signup_email');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.group(`🌐 Login: ${email}`);
      const response = await postToWebhook(WEBHOOK_URLS.LOGIN, {
        email,
        password,
      });

      const resData = Array.isArray(response) ? response[0] : response;
      console.groupEnd();

      // 성공 케이스
      if (resData && (resData.status === "success" || resData.success)) {
        // 비밀번호 해시 생성 (n8n이 반환하지 않을 경우 대비)
        const hashPassword = async (pwd: string) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(pwd);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        const passwordHash = resData.password_hash || await hashPassword(password);

        const userData: any = {
          id: resData.user_id || resData.id,
          email: resData.email,
          role: resData.role,
          password_hash: passwordHash,
        };
        
        login(userData);
        
        // 커스텀 토스트 노출
        setShowToast(true);

        // 2초 지연 후 페이지 전환
        setTimeout(() => {
          if (userData.role === "manager" || userData.role === "admin") {
            window.location.href = "/manager/dashboard";
          } else {
            window.location.href = "/client/dashboard";
          }
        }, 2000);
        
        return; // 성공 시 여기서 중단
      } 
      
      // 실패 케이스 (400: 사용자 없음, 401: 비번 틀림)
      if (resData.status === 400 || resData.code === "USER_NOT_FOUND") {
        setError(resData.message || "등록되지 않은 이메일입니다.");
      } else if (resData.status === 401 || resData.code === "INVALID_PASSWORD") {
        setError(resData.message || "비밀번호가 일치하지 않습니다.");
      } else {
        setError(resData?.message || "로그인에 실패했습니다. 정보를 확인해 주세요.");
      }

    } catch (err) {
      setError("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6 bg-zinc-50/50">
      {/* 커스텀 토스트 알림 */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-50 border border-blue-100 px-8 py-4 rounded-[2rem] shadow-xl shadow-blue-900/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <p className="text-blue-700 font-bold text-sm whitespace-nowrap">
              반가워요! 로그인이 완료되었습니다.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white border border-zinc-100 p-10 rounded-[2.5rem] shadow-2xl shadow-zinc-200/50 space-y-8">
          <div className="flex justify-center flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-primary shadow-inner">
              <Zap size={32} />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">열고닫기</h1>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Welcome Back</p>
            </div>
          </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 ml-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 ml-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 btn-interactive shadow-lg shadow-indigo-100"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "로그인"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-zinc-500">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
