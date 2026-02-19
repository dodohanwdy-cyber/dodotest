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
  // 초기 인사말 설정 (따뜻하고 신뢰감 있는 톤)
  const [messages, setMessages] = useState<Message[]>(intakeData.chat_history || [
    { role: "ai", content: `안녕하세요, ${intakeData.name}님! 찾아주셔서 감사합니다. 😊\n\n선택해주신 고민에 대해 조금 더 편하게 이야기 나누고 싶어요. 현재 가장 마음이 쓰이는 부분이나, 해결하고 싶은 구체적인 상황이 있다면 편하게 말씀해 주세요. 제가 경청하고 도움 드릴 수 있는 방법을 함께 찾아볼게요.` }
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
      // Google Gemini API 호출 (Next.js API Route)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(m => ({ role: m.role, content: m.content })), // 이전 대화 기록 전달
          userProfile: intakeData, // 사용자 컨텍스트 전달
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

  // 메시지 변경 시 부모 상태 업데이트 (저장용)
  useEffect(() => {
    if (onUpdate) {
      onUpdate({ chat_history: messages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    const kstTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);
    
    // user 객체가 있더라도 password_hash가 비어있다면 sessionStorage를 다시 확인
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
      // 대화 내역을 [ { "role": "user", "content": "내용" }, { "role": "assistant", "content": "내용" } ] 형식으로 변환
      const formattedHistory = messages.map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.content
      }));

      // 대화 전체 내용을 분석 웹후크로 전달
      const res = await postToWebhook(WEBHOOK_URLS.AI_CHAT_ANALYZE, {
        ...intakeData,
        conversation_scrips: formattedHistory, // 필드명 변경 및 포맷팅 적용
        completed_at: kstTime,
        user_id: storedUser?.id || "",
        email: storedUser?.email || "",
        role: storedUser?.role || "",
        password_hash: storedUser?.password_hash || "",
        time: kstTime,
      });

      const resData = Array.isArray(res) ? res[0] : res;

      // 성공 판단 조건 확장: status === "success" 또는 특정 성공 코드
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
      {/* 채팅 메시지 영역 */}
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

      {/* 입력 영역 */}
      <div className="p-4 bg-white border-t border-zinc-100 flex items-center gap-3">
          <div className="flex gap-3 items-end">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isChatFinished && handleSend()}
              placeholder={isChatFinished ? "AI 상담이 완료되었습니다" : "편하게 말씀해 주세요..."}
              disabled={isChatFinished}
              className="flex-1 px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-sm placeholder:text-slate-300 shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || isChatFinished}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-primary text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-sm shadow-md"
            >
              {isTyping ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              <span>{isTyping ? "생각 중..." : "전송"}</span>
            </button>
          </div>
      </div>

      {/* 최종 완료 버튼 */}
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
