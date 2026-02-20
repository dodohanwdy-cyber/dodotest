"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Calendar, Clock, Save, X, Info, Loader2 } from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

function ScheduleAdjustContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error" | "no-date">("idle");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("오전 10:00");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!date) {
      setStatus("no-date");
      return;
    }
    setStatus("saving");
    try {
      const response = await postToWebhook(WEBHOOK_URLS.ADJUST_SCHEDULE, {
        requestId,
        adjusted_date: date,
        adjusted_time: time,
        manager_notes: notes,
      });
      if (response) {
        setStatus("success");
        setTimeout(() => window.close(), 1000);
      }
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Step 7. Schedule Adjustment</span>
            <h1 className="text-2xl font-bold text-zinc-900 mt-1">상담 일정 조율</h1>
          </div>
          <button onClick={() => window.close()} className="p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-100 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="card-premium p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                <Calendar size={16} className="text-primary" /> 날짜 변경
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                <Clock size={16} className="text-primary" /> 시간 변경
              </label>
              <select 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              >
                <option>오전 10:00</option>
                <option>오전 11:00</option>
                <option>오후 13:00</option>
                <option>오후 14:00</option>
                <option>오후 15:00</option>
                <option>오후 16:00</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-zinc-700">관리자 코멘트 (내담자에게 전달됨)</label>
            <textarea 
              rows={4} 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="일정 변경 사유나 안내 사항을 적어주세요."
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm leading-relaxed"
            />
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-3">
            <span className="text-blue-500 mt-0.5 flex-shrink-0"><Info size={16} /></span>
            <p className="text-xs text-blue-600 leading-relaxed">
              본 요청 ID: <strong>{requestId}</strong>에 대한 일정을 수정합니다. 저장 시 내담자에게 즉시 알림이 발송되며 구글 시트 데이터가 업데이트됩니다.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={() => window.close()}
            className="px-8 py-3.5 bg-white text-zinc-500 border border-zinc-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-100 transition-all"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            disabled={status === "saving" || status === "success"}
            className="px-10 py-3.5 bg-zinc-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {status === "saving" ? "저장 중..."
              : status === "success" ? "저장 완료!"
              : status === "no-date" ? "⚠ 날짜를 선택해 주세요"
              : status === "error" ? "저장 실패 - 다시 시도"
              : <><Save size={18} /> 설정 저장</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleAdjustPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    }>
      <ScheduleAdjustContent />
    </Suspense>
  );
}
