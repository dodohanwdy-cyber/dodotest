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
      const userMessageCount = (history?.filter((m: any) => m.role === "user").length || 0) + 1;
      
      // EXAONE 3.5 7.8B 최적화: 구조화된 지시와 예시(Few-shot) 제공
      let phaseGoal = "";
      let phaseExample = "";
      if (userMessageCount === 1) {
        phaseGoal = "내담자의 첫 인사를 듣고 따뜻하게 공감한 뒤, '현재 가장 시급하게 해결하고 싶은 구체적인 어려움'이 무엇인지 '딱 하나'만 물어보세요.";
        phaseExample = "예시: '그동안 혼자 고민하시느라 정말 고생 많으셨어요. ${userProfile.name}님, 지금 가장 시급하게 해결하고 싶은 구체적인 상황은 무엇인가요?'";
      } else if (userMessageCount === 2) {
        phaseGoal = "내담자의 고민에 깊이 공감하고, '이 상황을 해결하기 위해 그동안 스스로 시도해본 현실적인 방법'이 있는지 '딱 하나'만 물어보세요.";
        phaseExample = "예시: '정말 답답한 상황이셨겠네요... 혹시 이 문제를 해결하기 위해 ${userProfile.name}님께서 그동안 스스로 시도해 보신 방법이 있을까요?'";
      } else if (userMessageCount === 3) {
        phaseGoal = "내담자의 시도를 격려하고, '이번 상담을 통해 내일 당장 어떤 작은 부분이라도 구체적으로 달라지길 원하는지' '딱 하나'만 물어보세요.";
        phaseExample = "예시: '그렇게 노력해 오셨다니 정말 대단하세요. 그러면 이번 상담을 통해 내일 당장 아주 작은 부분이라도 어떤 점이 달라지기를 바라시나요?'";
      } else {
        phaseGoal = "공감의 인사와 함께 전문 상담사가 준비 중임을 알리고 대화를 정중히 마무리하세요. 더 이상의 질문은 절대 금지입니다.";
        phaseExample = "예시: '네, 말씀해 주신 내용 잘 알겠습니다. 전문 상담사가 최적의 정책을 찾기 위해 대기 중이니, 아래 버튼을 눌러 신청을 완료해 주세요!'";
      }

      const localDynamicInstruction = `### 당신의 역할\n- 당신은 '열고닫기(OPCL)'의 청년 정책 전문 AI 상담사입니다.\n- 내담자: ${userProfile.name}\n\n### 행동 규칙\n1. [공감 우선] 2. [단일 질문] 3. [단계 준수] (현재 ${userMessageCount}단계)\n\n### 현재 목표\n- ${phaseGoal}\n\n### 답변 가이드\n- ${phaseExample}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT);

      const localResponse = await fetch(`${localUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
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
      if (!localResponse.ok) throw new Error(`Local AI error: ${localResponse.status}`);

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

    } catch (localErr: any) {
      console.warn("⚠️ 로컬 AI 연결 실패. Fallback으로 Google Gemini 전환...", localErr.message);
      
      if (!apiKey) return new Response("AI 연결 실패", { status: 500 });
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
      
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

  } catch (error: any) {
    console.error("🚨 Critical Error:", error);
    const errorMsg = `서비스 연결이 원활하지 않습니다. (원인: ${error.message || "알 수 없는 에러"})`;
    return new Response(errorMsg, { 
      status: 200, 
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Error": "True" }
    });
  }
}
