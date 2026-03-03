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
  
  // 1. 첫인사: 따뜻하고 신뢰감 있는 톤으로 설정
  const [messages, setMessages] = useState<Message[]>(intakeData.chat_history || [
    { role: "ai", content: `안녕하세요, ${intakeData.name}님! 마음 편히 이야기하실 수 있도록 제가 곁에서 도와드릴게요. 😊\n\n본격적인 상담에 앞서 제가 3가지 정도 짧은 질문을 드릴 예정입니다. 혹시 지금 가장 마음이 쓰이거나 해결하고 싶은 상황은 어떤 것인가요?` }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // AI 답변 횟수 체크 (첫인사 포함, AI 답변이 4번째가 되면 상담 가이드가 나간 상태임)
  const aiResponseCount = messages.filter(m => m.role === "ai").length;
  const isFinalGuideGiven = aiResponseCount >= 4;

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

    // [중요] 4단계 안내가 이미 나갔다면 백엔드로 보내지 않고 즉시 응답
    if (isFinalGuideGiven) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: "작성해주신 내용을 바탕으로 상담 준비를 거의 마쳤습니다! 아래 '상담 신청 완료하기' 버튼을 눌러주시면 바로 예약을 도와드릴게요. 😊" 
        }]);
        setIsTyping(false);
      }, 600); // 0.6초 뒤에 즉시 답변 (자연스러움을 위해)
      return;
    }

    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
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

  useEffect(() => {
    if (onUpdate) onUpdate({ chat_history: messages });
  }, [messages]);

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    const kstTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);
    
    let storedUser = user;
    if (!storedUser || !storedUser.password_hash) {
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(sessionStorage.getItem("user") || 'null');
        if (sessionUser) storedUser = { ...storedUser, ...sessionUser };
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
      if (resData && (resData.status === "success" || resData.code)) {
        onComplete();
      } else {
        alert(resData?.message || "상담 완료 처리에 실패했습니다.");
      }
    } catch (err) {
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-zinc-100 rounded-3xl bg-zinc-50 overflow-hidden shadow-inner">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" ? "bg-primary text-white rounded-br-none" : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-none"
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
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isFinalGuideGiven ? "상담 준비가 완료되었습니다." : "편하게 말씀해 주세요..."}
            className="flex-1 px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary text-sm shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-primary text-white rounded-2xl font-bold text-sm shadow-md"
          >
            {isTyping ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            <span>전송</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-zinc-100 flex justify-between items-center px-6">
        <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
          <AlertCircle size={12}/> 대화가 충분하다면 신청을 완료해 주세요.
        </p>
        <button 
          onClick={handleFinalSubmit}
          disabled={isSaving}
          className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14}/> 상담 신청 완료하기</>}
        </button>
      </div>
    </div>
  );
}
