"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import { Loader2, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({ type: "error", text: "로그인이 필요합니다." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: "error", text: "비밀번호는 최소 4자 이상이어야 합니다." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await postToWebhook(WEBHOOK_URLS.UPDATE_USER, {
        user_id: user.id,
        email: user.email,
        current_password: currentPassword,
        new_password: newPassword,
      });

      const resData = Array.isArray(response) ? response[0] : response;

      if (resData && (resData.status === "success" || resData.success)) {
        setMessage({ type: "success", text: "비밀번호가 성공적으로 변경되었습니다." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: resData?.message || "비밀번호 변경에 실패했습니다." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "서버와 통신 중 오류가 발생했습니다." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <p className="text-zinc-500 font-medium">로그인이 필요한 페이지입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-160px)] bg-zinc-50/50 py-12 px-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-zinc-200 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 p-10 space-y-8">
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
              <KeyRound size={32} />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">비밀번호 변경</h1>
            <p className="text-sm text-zinc-500 font-medium break-keep">
              안전한 계정 관리를 위해 현재 비밀번호를 먼저 확인합니다.
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 mb-6 font-bold">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">로그인 계정</p>
            <p className="text-sm text-zinc-900">{user.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-900 ml-1 uppercase tracking-wider">현재 비밀번호</label>
              <input 
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 사용 중인 비밀번호"
                className="w-full bg-zinc-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
              />
            </div>

            <div className="h-px bg-zinc-100 w-full" />

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-900 ml-1 uppercase tracking-wider">새 비밀번호</label>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새로운 비밀번호 (4자 이상)"
                className="w-full bg-zinc-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-900 ml-1 uppercase tracking-wider">새 비밀번호 확인</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 한 번 더 입력"
                className="w-full bg-zinc-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
              />
            </div>

            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-primary/90 shadow-lg shadow-blue-100 disabled:opacity-50 btn-interactive"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "안전하게 변경하기"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
