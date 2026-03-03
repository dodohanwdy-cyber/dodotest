"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function AIChatForm({ intakeData, onComplete, onUpdate, isChatFinished }: { intakeData: any, onComplete: () => void, onUpdate?: (data: any) => void, isChatFinished?: boolean }) {
  const { user } = useAuth();
  // 초기 인사말 설정
  const [messages, setMessages] = useState<Message[]>(intakeData.chat_history || [
    { role: "ai", content: `안녕하세요, ${intakeData.name}님! 원활한 맞춤 상담을 위해 제가 3가지 정도 간단한 질문을 드릴 예정입니다. 😊\n\n현재 가장 마음이 쓰이는 부분이나, 해결하고 싶은 구체적인 상황을 먼저 편하게 말씀해 주시겠어요?` }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isChatFinished) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      // Google Gemini API 호출
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg,
          // Gemini 규격에 맞게 'ai'를 'model'로 변경하여 전송 (수정된 부분)
          history: messages.map(m => ({ 
            role: m.role === "ai" ? "model" : "user", 
            content: m.content 
          })), 
          userProfile: intakeData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.output) {
        setMessages(prev => [...prev, { role: "ai", content: data.output }]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "ai", content: "죄송합니다, 잠시 연결이 원활하지 않네요. 😥 잠시 후 다시 말씀해 주시겠어요?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 메시지 변경 시 부모 상태 업데이트
  useEffect(() => {
    if (onUpdate) {
      onUpdate({ chat_history: messages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    const kstTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);
    
    let storedUser = user;
    if (!storedUser || !storedUser.password_hash) {
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(sessionStorage.getItem("user") || 'null');
        if (sessionUser) {
          storedUser = { ...storedUser, ...sessionUser };
        }
      }
    }

    try {
      const formattedHistory = messages.map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.content
      }));

      const res = await postToWebhook(WEBHOOK_URLS.AI_CHAT_ANALYZE, {
        ...intakeData,
        conversation_scrips: formattedHistory,
        completed_at: kstTime,
        user_id: storedUser?.id || "",
        email: storedUser?.email || "",
        role: storedUser?.role || "",
        password_hash: storedUser?.password_hash || "",
        time: kstTime,
      });

      const resData = Array.isArray(res) ? res[0] : res;
      const isSuccess = resData && (resData.status === "success" || resData.code);

      if (isSuccess) {
        onComplete();
      } else {
        alert(resData?.message || "상담 완료 처리에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error("Final save failed:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-zinc-100 rounded-3xl bg-zinc-50 overflow-hidden shadow-inner">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-primary text-white rounded-br-none shadow-md"
                : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-none shadow-sm"
            }`}>
              {msg.role === "ai" && <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center gap-1"><Sparkles size={10}/> AI Counselor</div>}
              {msg.content}
            </div>
          </div>
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
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isChatFinished && handleSend()}
              placeholder={isChatFinished ? "AI 상담이 완료되었습니다" : "편하게 말씀해 주세요..."}
              disabled={isChatFinished}
              className="flex-1 px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-sm placeholder:text-slate-300 shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed w-full"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || isChatFinished}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-primary text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-80 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-sm shadow-md whitespace-nowrap"
            >
              {isTyping ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              <span>{isTyping ? "생각 중..." : "전송"}</span>
            </button>
          </div>
      </div>

      <div className="p-4 bg-white border-t border-zinc-100 flex justify-between items-center px-6">
        <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
          <AlertCircle size={12}/> 대화가 충분하다면 상담 신청을 완료해 주세요. (채팅 없이도 진행 가능)
        </p>
        <button 
          onClick={handleFinalSubmit}
          disabled={isSaving}
          className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-30"
        >
          {isSaving ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14}/> 채팅 끝내고 상담 신청 완료하기</>}
        </button>
      </div>
    </div>
  );
}
