import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// export const runtime = 'edge'; // 504 방지를 위해 Node.js 런타임 사용
const apiKey = process.env.GOOGLE_API_KEY;
const MAX_RETRIES = 3; 
const LOCAL_TIMEOUT = 10000; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 1. 공통 시스템 프롬프트 정의
    const systemInstruction = `
      당신은 청년 정책 전문 AI 상담사입니다. 내담자가 자신의 고민을 편하게 털어놓을 수 있도록 **따뜻하고 친절하며 공감적인 말투**를 유지하세요.
      [내담자 정보] 이름: ${userProfile.name}, 나이: ${userProfile.age}세, 직업: ${userProfile.job_status}
      [상담 원칙]
      1. 질문 제한: 전체 대화에서 당신은 **단 3개의 질문**만 합니다.
      2. 답변 스타일: 내담자의 말에 깊이 공감하는 문장을 앞에 두고, 이어서 질문을 던지세요.
      3. 간결성: 답변은 공백 포함 150자 내외로 유지하세요.
      [대화 흐름]
      - 1단계: "가장 시급하게 해결하고 싶은 구체적인 어려움" 질문
      - 2단계: "그동안 상황을 어떻게 버텨오셨는지, 혹은 스스로 시도해본 현실적인 방법" 질문
      - 3단계: "이번 상담을 통해 내일 당장 어떤 작은 부분이라도 달라지기를 원하는지" 질문
      - 4단계(최종): 공감의 인사를 전한 뒤, "상담 신청 완료하기" 버튼 안내 후 마무리.
      [중요!] 절대 한 번에 2개 이상의 질문을 하지 마세요.
    `;

    // 히스토리 정제 (공통)
    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content,
      }));

    // ---------------------------------------------------------
    // [우선순위 1] 로컬 AI (EXAONE) 시도
    // ---------------------------------------------------------
    const localUrl = process.env.LOCAL_LLM_URL || "https://gastritic-debbi-unbeneficently.ngrok-free.dev/v1";
    const localModel = process.env.LOCAL_LLM_MODEL || "exaone3.5";

    try {
      console.log("🚀 [Primary] 로컬 AI(EXAONE) 연결 시도...");
      
      const userMessageCount = (history?.filter((m: any) => m.role === "user").length || 0) + 1;
      let phaseGoal = "";
      if (userMessageCount === 1) phaseGoal = "내담자의 인사를 듣고 공감한 뒤, '시급한 어려움' 하나만 질문하세요.";
      else if (userMessageCount === 2) phaseGoal = "내담자의 고민에 공감하고, '그동안 시도해본 방법' 하나만 질문하세요.";
      else if (userMessageCount === 3) phaseGoal = "시도를 격려하고, '내일 당장 달라지길 원하는 작은 변화' 하나만 질문하세요.";
      else phaseGoal = "공감과 함께 '상담 신청 완료하기' 안내 후 마무리하세요.";

      const localDynamicInstruction = `당신은 청년 정책 상담사입니다. 규칙: 1.공감 2.질문은 딱 하나만 3.짧은 답변. 목표: ${phaseGoal}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT);

      const localResponse = await fetch(`${localUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          model: localModel,
          messages: [
            { role: "system", content: localDynamicInstruction },
            ...sanitizedHistory,
            { role: "user", content: message }
          ],
          stream: true,
          temperature: 0.7,
        }),
      });

      clearTimeout(timeoutId);
      if (!localResponse.ok) throw new Error("Local AI connection failed");

      // 로컬 AI 스트림 생성
      const localStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const reader = localResponse.body?.getReader();
          if (!reader) return controller.close();
          const decoder = new TextDecoder();
          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") continue;
                if (trimmed.startsWith("data: ")) {
                  try {
                    const json = JSON.parse(trimmed.slice(6));
                    const content = json.choices[0]?.delta?.content || "";
                    if (content) controller.enqueue(encoder.encode(content));
                  } catch (e) {}
                }
              }
            }
          } finally { controller.close(); }
        }
      });

      return new Response(localStream, { 
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "Local-EXAONE" } 
      });

    } catch (localErr) {
      console.warn("⚠️ 로컬 AI 연결 실패. Fallback으로 Google Gemini 전환...", localErr);
      
      // ---------------------------------------------------------
      // [우선순위 2] Google Gemini (Fallback)
      // ---------------------------------------------------------
      if (!apiKey) return new Response("AI 연결 실패", { status: 500 });
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" }); // models/ 접두사 추가
      
      const geminiHistory = sanitizedHistory.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const finalContents = [
        { role: "user", parts: [{ text: `시스템 지침: ${systemInstruction}` }] },
        { role: "model", parts: [{ text: "숙지했습니다." }] },
        ...geminiHistory, 
        { role: "user", parts: [{ text: message }] }
      ];

      let result: any;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          result = await model.generateContentStream({
            contents: finalContents,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
          });
          break;
        } catch (err) { if (attempt === MAX_RETRIES) throw err; }
      }

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
          } finally { controller.close(); }
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "Google-Gemini" },
      });
    }

    const errorMsg = `서비스 연결이 원활하지 않습니다. (원인: ${error.message || "알 수 없는 에러"})`;
    return new Response(errorMsg, { 
      status: 200, 
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Error": "True" }
    });
}
