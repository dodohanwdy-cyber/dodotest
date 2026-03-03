import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// 429 에러 발생 시 재시도할 최대 횟수
const MAX_RETRIES = 3;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    const systemInstruction = `
      당신은 청년 정책 전문 AI 상담사입니다. 내담자에게 따뜻하게 공감하세요.
      [내담자 정보] 이름: ${userProfile.name}, 나이: ${userProfile.age}세
      [상담 원칙]
      1. 질문은 전체 대화에서 **단 3개**만 합니다.
      2. 답변은 150자 내외로 유지하세요.
      3. 대화 단계: 공감 후 상황 파악(질문1) -> 대처 파악(질문2) -> 목표 설정(질문3) -> 종료 안내.
    `;

    // 요청하신 2.0 모델 유지
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemInstruction 
    });

    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") sanitizedHistory.shift();

    // ---------------------------------------------------------
    // [핵심] 재시도(Retry) 로직: 429 에러가 나면 뚫릴 때까지 다시 시도
    // ---------------------------------------------------------
    let result;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await model.generateContentStream({
          contents: [...sanitizedHistory, { role: "user", parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        });
        // 성공하면 반복문 탈출
        break; 
      } catch (error: any) {
        lastError = error;
        // 429(Too Many Requests) 또는 503(Server Unavailable)인 경우만 재시도
        if (error.response?.status === 429 || error.status === 429 || error.message?.includes('429')) {
          console.warn(`⚠️ 429 에러 감지. 재시도 중... (${attempt}/${MAX_RETRIES})`);
          // 지수 백오프: 1차 2초, 2차 4초, 3차 8초 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
        } else {
          // 다른 에러라면 즉시 중단
          throw error;
        }
      }
    }

    // 3번 다 시도했는데도 실패했다면, 사용자에게 안내 메시지 전송
    if (!result) {
      console.error("🚨 모든 재시도 실패:", lastError);
      const errorStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("죄송합니다. 현재 접속량이 많아 연결이 지연되고 있습니다. 잠시 후 다시 말씀해 주시겠어요? 😭"));
          controller.close();
        }
      });
      return new Response(errorStream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // 정상 스트림 처리
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) controller.enqueue(encoder.encode(chunkText));
          }
        } catch (e) {
          console.error("Stream Error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "상담 준비 중..." }, { status: 500 });
  }
}
