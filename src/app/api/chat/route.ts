import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// export const runtime = 'edge';
const apiKey = process.env.GOOGLE_API_KEY;
const MAX_RETRIES = 3; 
const LOCAL_TIMEOUT = 10000; 

export async function POST(req: Request) {
  let localErrorMessage = ""; // 로컬 AI 에러 저장용

  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    const systemInstruction = `당신은 청년 정책 전문 AI 상담사입니다... (중략)`;

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
      const localDynamicInstruction = `당신은 상담사입니다. 한 번에 하나만 질문하세요. 현재 ${userMessageCount}단계입니다.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT);

      const localResponse = await fetch(`${localUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: "system", content: localDynamicInstruction }, ...sanitizedHistory, { role: "user", content: message }],
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

    } catch (localErr: any) {
      localErrorMessage = localErr.message;
      console.warn("⚠️ 로컬 AI 실패:", localErrorMessage);
      
      // ---------------------------------------------------------
      // [우선순위 2] Google Gemini (Fallback)
      // ---------------------------------------------------------
      if (!apiKey) throw new Error(`Local 실패(${localErrorMessage}) 및 API 키 누락`);
      
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
    }

  } catch (error: any) {
    // 로컬 에러와 최종 에러를 동시에 리포팅
    const finalErrorMsg = `로컬 실패(${localErrorMessage || "연결안됨"}) / 최종 실패(${error.message})`;
    return new Response(`서비스 연결이 원활하지 않습니다. (진단: ${finalErrorMsg})`, { 
      status: 200, 
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Error": "True" }
    });
  }
}
