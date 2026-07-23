import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;
const MAX_RETRIES = 3; 
const LOCAL_TIMEOUT = 10000; 

export async function POST(req: Request) {
  let geminiErrorMessage = ""; 

  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 1. 사용자 메세지 카운트 계산 (복원)
    const userMessageCount = (history?.filter((m: any) => m.role === "user").length || 0) + 1;

    // 2. 기본 지침 + 단계별 동적 지침 결합
    const baseSystemInstruction = `당신은 청년 정책 전문 AI 상담사입니다.`; // (기존 프롬프트 내용 유지)
    const dynamicInstruction = `${baseSystemInstruction}\n\n[상담 진행 지침]\n- 당신은 상담사입니다.\n- 한 번에 하나만 질문하세요.\n- 현재 ${userMessageCount}단계 상담 진행 중입니다.`;

    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content,
      }));

    // ---------------------------------------------------------
    // [우선순위 1] Google Gemini 시도
    // ---------------------------------------------------------
    try {
      if (!apiKey) throw new Error("API 키 누락");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: dynamicInstruction // 복원된 동적 지침 적용
      });
      
      const geminiHistory = sanitizedHistory.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const finalContents = [
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
        } catch (err: any) {
          const status = err.response?.status || err.status;
          if ((status === 429 || status === 503) && attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); 
            continue;
          }
          throw err; 
        }
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

      return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "Google-Gemini" } });

    } catch (geminiErr: any) {
      geminiErrorMessage = geminiErr.message;
      console.warn("⚠️ Google Gemini 실패:", geminiErrorMessage);
      
      // ---------------------------------------------------------
      // [우선순위 2] 로컬 AI (EXAONE) (Fallback)
      // ---------------------------------------------------------
      const localUrl = process.env.LOCAL_LLM_URL || "https://gastritic-debbi-unbeneficently.ngrok-free.dev/v1";
      const localModel = process.env.LOCAL_LLM_MODEL || "exaone3.5";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT);

      const localResponse = await fetch(`${localUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: "system", content: dynamicInstruction }, ...sanitizedHistory, { role: "user", content: message }],
          stream: true,
          temperature: 0.7,
        }),
      });

      clearTimeout(timeoutId);
      if (!localResponse.ok) throw new Error(`Local Server Status: ${localResponse.status}`);

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
                if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
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

      return new Response(localStream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "Local-EXAONE" } });
    }

  } catch (error: any) {
    const finalErrorMsg = `Gemini 실패(${geminiErrorMessage || "연결안됨"}) / Local 최종 실패(${error.message})`;
    return new Response(`서비스 연결이 원활하지 않습니다. (진단: ${finalErrorMsg})`, { 
      status: 200, 
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Error": "True" }
    });
  }
}
