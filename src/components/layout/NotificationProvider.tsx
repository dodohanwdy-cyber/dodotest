"use client";

import React, { useEffect, useState } from "react";
import { Bell, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";

interface NotificationData {
  id: string;
  request_id: string;
  user_name: string;
  main_issue: string;
  risk_grade: string;
  timestamp: string;
}

export default function NotificationProvider() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const pathname = usePathname();

  // 매니저 관련 페이지 내부에서만 알림 동작하도록 제한
  const isManagerPage = pathname?.startsWith("/manager");

  useEffect(() => {
    if (!isManagerPage) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notify", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // 새로운 알림이 있다면 기존 목록에 추가
          if (data.notifications && data.notifications.length > 0) {
            setNotifications(prev => [...prev, ...data.notifications]);
          }
        }
      } catch (err) {
        // 백그라운드 무음 에러 무시
      }
    };

    // 10초마다 백엔드 상태를 가볍게 폴링
    const intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [isManagerPage]);

  // 알림 수동 닫기
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 일정 시간 후 알림 자동 닫기 (15초 유지)
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1)); // 가장 오래된 1개씩 순차 삭제
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!isManagerPage || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className="bg-white rounded-2xl shadow-2xl p-5 w-[360px] border border-zinc-100 flex gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 relative"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 relative mt-1">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </div>
          
          <div className="flex-1 pr-6">
            <h4 className="text-sm font-black text-zinc-900 leading-tight">
              {notif.user_name}님의 분석 대기 완료!
            </h4>
            
            <div className="mt-3 text-xs text-zinc-600 bg-zinc-50 border border-zinc-100 p-3 rounded-xl leading-relaxed space-y-2">
              <div>
                <span className="font-bold text-zinc-800 flex items-center gap-1 mb-0.5">
                  <CheckCircle2 size={12} className="text-primary" /> 주요 이슈
                </span> 
                {notif.main_issue}
              </div>
              <div>
                <span className="font-bold text-zinc-800 flex items-center gap-1 mb-0.5">
                  <AlertCircle size={12} className="text-rose-500" /> 위기도
                </span> 
                {notif.risk_grade}
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-400 mt-2 font-medium">완료 목록과 리포트를 확인해 보세요.</p>
          </div>
          
          <button 
            onClick={() => removeNotification(notif.id)} 
            className="absolute top-4 right-4 text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 p-1 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
