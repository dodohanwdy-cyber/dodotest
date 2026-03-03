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
  const [messages, setMessages] = useState<Message[]>(intakeData.chat_history || [
    { role: "ai", content: `안녕하세요, ${intakeData.name}님! 원활한 맞춤 상담을 위해 제가 3가지 정도 간단한 질문을 드릴 예정입니다. 😊\n\n현재 가장 마음이 쓰이는 부분이나, 해결하고 싶은 구체적인 상황을 먼저 편하게 말씀해 주시겠어요?` }
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
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
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

      if (!response.ok) throw new Error("Network error");

      // [스트리밍 수신 로직]
      const reader = response.body?.getReader();
      const decoder = new TextEncoder().encode("").constructor === Uint8Array ? new TextDecoder() : null;
      let aiContent = "";

      // AI 메시지 자리를 미리 하나 만듭니다.
      setMessages(prev => [...prev, { role: "ai", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        aiContent += chunk;

        // 실시간으로 마지막 AI 메시지만 업데이트합니다.
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiContent;
          return updated;
        });
      }

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "ai", content: "연결이 원활하지 않습니다. 버튼을 눌러 상담을 완료해주시거나 잠시 후 다시 시도해주세요." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => { if (onUpdate) onUpdate({ chat_history: messages }); }, [messages]);

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
      const formattedHistory = messages.map(msg => ({ role: msg.role === "ai" ? "assistant" : "user", content: msg.content }));
      const res = await postToWebhook(WEBHOOK_URLS.AI_CHAT_ANALYZE, {
        ...intakeData, conversation_scrips: formattedHistory, completed_at: kstTime,
        user_id: storedUser?.id || "", email: storedUser?.email || "",
        role: storedUser?.role || "", password_hash: storedUser?.password_hash || "", time: kstTime,
      });
      if (res && (res.status === "success" || res.code)) { onComplete(); }
      else { alert("상담 완료 처리에 실패했습니다."); }
    } catch (err) { alert("오류가 발생했습니다."); } finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col h-[500px] border border-zinc-100 rounded-3xl bg-zinc-50 overflow-hidden shadow-inner">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          msg.content && (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" ? "bg-primary text-white rounded-br-none" : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-none shadow-sm"
              }`}>
                {msg.role === "ai" && <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center gap-1"><Sparkles size={10}/> AI Counselor</div>}
                <div className="whitespace-pre-wrap">{msg.content}</div>
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
        <p className="text-[11px] text-zinc-400 font-medium"><AlertCircle size={12} className="inline mr-1"/> 대화 후 상담 신청을 완료해 주세요.</p>
        <button onClick={handleFinalSubmit} disabled={isSaving} className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold">
          {isSaving ? <Loader2 className="animate-spin" size={14} /> : "상담 신청 완료"}
        </button>
      </div>
    </div>
  );
}
