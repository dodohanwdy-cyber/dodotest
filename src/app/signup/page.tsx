"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import { 
  Loader2, 
  UserPlus, 
  CheckCircle2, 
  User, 
  Building2, 
  ArrowRight, 
  Mail, 
  Lock, 
  AlertCircle,
  PartyPopper,
  Sparkles
} from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await postToWebhook(WEBHOOK_URLS.SIGNUP, {
        email,
        password,
        role: "client",
        created_at: new Date().toISOString(),
      });

      if (response && response.success) {
        setIsSuccess(true);
        // 로그인 페이지에서 사용할 이메일 저장
        sessionStorage.setItem('signup_email', email);
        setTimeout(() => router.push("/login"), 2500); // 사용자 경험을 위해 노출 시간 소폭 연장
      } else {
        setError(response?.message || "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      setError("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6 relative overflow-hidden bg-white">
        {/* 축하 배경 효과 */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="max-w-md w-full relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-emerald-400 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 animate-bounce-subtle">
              <PartyPopper size={40} />
            </div>
            <div className="absolute -top-2 -right-2 text-amber-400 animate-pulse">
              <Sparkles size={24} />
            </div>
            <div className="absolute -bottom-2 -left-2 text-blue-400 animate-pulse delay-500">
              <Sparkles size={20} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">회원가입이 완료되었습니다!</h1>
            <p className="text-lg text-slate-500 font-bold leading-relaxed break-keep">
              열고닫기의 가족이 되신 것을<br/>
              진심으로 환영합니다.
            </p>
          </div>

          <div className="pt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">로그인 페이지로 안내해 드릴게요...</span>
            </div>
            <div className="h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
              <div className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full animate-stripe" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-md w-full bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-50 rounded-[2rem] mx-auto flex items-center justify-center text-primary shadow-inner mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">열고닫기 회원가입</h1>
          <p className="text-sm text-slate-500 font-medium">새로운 시작을 위한 계정을 만들어 보세요.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 btn-interactive shadow-lg shadow-blue-100"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "회원가입 완료"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

