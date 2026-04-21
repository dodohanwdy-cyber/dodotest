"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import React from "react";

interface Message {
  role: "user" | "ai";
  content: string;
}

// 간단한 마크다운 파서 (굵은 글씨 및 줄바꿈 지원)
const renderFormattedText = (text: string) => {
  if (!text) return null;

  // 1. 먼저 줄바꿈(\n)을 기준으로 배열로 쪼갭니다.
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // 2. 각 줄 내에서 **강조 텍스트** 패턴을 찾아 분리합니다.
    // 캡처 그룹을 써서 매칭된 텍스트와 일반 텍스트를 배열로 나눔
    const parts = line.split(/(\*\*.*?\*\*)/g);

    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // 별표 제거 후 강조 UI 적용
            const boldText = part.slice(2, -2);
            return (
              <strong 
                key={partIdx} 
                className="font-black text-indigo-700 bg-indigo-50/70 px-1.5 py-0.5 rounded-md mx-0.5 border border-indigo-100/50"
              >
                {boldText}
              </strong>
            );
          }
          // 일반 텍스트
          return <span key={partIdx}>{part}</span>;
        })}
        {/* 마지막 줄이 아니면 <br /> 추가 */}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export default function AIChatForm({ intakeData, onComplete, onUpdate, isChatFinished }: { intakeData: any, onComplete: () => void, onUpdate?: (data: any) => void, isChatFinished?: boolean }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(intakeData.chat_history || [
    { role: "ai", content: `안녕하세요, ${intakeData.name}님!\n원활한 맞춤 상담을 위해 제가 3가지 정도 간단한 질문을 드릴 예정입니다. 😊\n\n현재 가장 마음이 쓰이는 부분이나,\n해결하고 싶은 구체적인 상황을 먼저 편하게 말씀해 주시겠어요?` }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isChatFinished) return;

    const userMsg = input.trim();
    setInput("");
    
    // [TS 에러 방지] 타입을 확실하게 지정
    const newUserMsg: Message = { role: "user", content: userMsg };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(m => ({ role: m.role === "ai" ? "model" : "user", content: m.content })),
          userProfile: intakeData,
        }),
      });

      if (!response.ok) throw new Error("Server response error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      // AI 답변을 위한 공간 생성
      setMessages(prev => [...prev, { role: "ai", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // [핵심] 한글 조각이 잘리지 않도록 스트림 디코딩
          const chunk = decoder.decode(value, { stream: true });
          aiContent += chunk;

          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].content = aiContent;
            }
            return updated;
          });
        }
      }

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "ai", content: "통신이 불안정합니다. 잠시 후 다시 시도해 주세요." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => { if (onUpdate) onUpdate({ chat_history: messages }); }, [messages]);

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    const kstTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);
    let storedUser: any = user;
    if (!storedUser || !storedUser.password_hash) {
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(sessionStorage.getItem("user") || 'null');
        if (sessionUser) storedUser = { ...storedUser, ...sessionUser };
      }
    }
    try {
      const formattedHistory = messages.map(msg => ({ role: msg.role === "ai" ? "assistant" : "user", content: msg.content }));
      const res = await postToWebhook(WEBHOOK_URLS.AI_CHAT_ANALYZE, {
        ...intakeData, conversation_scrips: formattedHistory, completed_at: kstTime,
        user_id: storedUser?.id || "", email: storedUser?.email || "",
        role: storedUser?.role || "", password_hash: storedUser?.password_hash || "", time: kstTime,
        status: "sec3", // AI 상담 완료 상태 명시
      });
      if (res && (res.status === "success" || res.code)) onComplete();
      else alert("상담 완료 처리에 실패했습니다.");
    } catch (err) { alert("통신 중 오류가 발생했습니다."); } finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col h-[500px] border border-zinc-100 rounded-3xl bg-zinc-50 overflow-hidden shadow-inner">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          msg.content && (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] p-4 rounded-2xl text-[15px] leading-relaxed tracking-tight ${
                msg.role === "user" ? "bg-primary text-white rounded-br-none shadow-md" : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-none shadow-sm"
              }`}>
                {msg.role === "ai" && <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1.5 flex items-center gap-1 leading-none"><Sparkles size={11}/> AI Counselor</div>}
                <div className="whitespace-pre-wrap break-keep">{renderFormattedText(msg.content)}</div>
              </div>
            </div>
          )
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-zinc-100 shadow-sm">
              <Loader2 className="animate-spin text-primary" size={16} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-zinc-100">
        <div className="flex gap-3 items-end w-full">
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="편하게 말씀해 주세요..."
            className="flex-1 px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary text-sm shadow-sm w-full"
          />
          <button
            onClick={handleSend} disabled={!input.trim() || isTyping}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-primary text-white rounded-2xl font-bold text-sm shadow-md"
          >
            {isTyping ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-zinc-100 flex justify-between items-center px-6">
        <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1"><AlertCircle size={12}/> 대화가 충분하다면 상담 신청을 완료해 주세요.</p>
        <button onClick={handleFinalSubmit} disabled={isSaving} className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold">
          {isSaving ? <Loader2 className="animate-spin" size={14} /> : "상담 신청 완료"}
        </button>
      </div>
    </div>
  );
}
