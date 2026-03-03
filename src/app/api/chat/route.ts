import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// [근본 해결 1] Edge Runtime 사용: 응답 제한 시간을 늘리고 속도를 최적화합니다.
export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    const systemInstruction = `
      당신은 청년 정책 전문 AI 상담사입니다. 내담자의 말에 따뜻하게 공감하고 짧게 답변하세요.
      [원칙]
      1. 질문은 전체 대화에서 **단 3개**만 합니다.
      2. 답변은 150자 내외로 유지하세요.
      3. 3번째 질문이 끝나면 추가 질문 없이 "상담 신청 완료" 버튼을 눌러달라고 안내하세요.
      내담자: ${userProfile.name}(${userProfile.age}세)
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: systemInstruction 
    });

    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") sanitizedHistory.shift();

    // [근본 해결 2] 스트리밍 방식으로 답변 생성 시작
    const result = await model.generateContentStream({
      contents: [...sanitizedHistory, { role: "user", parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    });

    // 스트림 데이터를 브라우저로 흘려보내기 위한 설정
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error: any) {
    console.error("🚨 AI Error:", error);
    return NextResponse.json({ error: "상담 준비 중입니다." }, { status: 500 });
  }
}
