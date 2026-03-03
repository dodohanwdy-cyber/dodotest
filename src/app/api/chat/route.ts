import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Edge Runtime은 스트리밍에 최적화되어 있습니다.
export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 1. 모델 설정: 사용자가 말씀하신 최신 모델(2.0 Flash)로 변경
    // 2.5를 말씀하셨으나, 현재 구글 API 표준 명칭인 2.0-flash를 사용합니다.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: `
        당신은 청년 정책 전문 AI 상담사입니다. 내담자의 상황에 따뜻하게 공감하세요.
        - 질문은 전체 대화에서 **딱 3개**만 합니다.
        - 답변은 150자 내외로 아주 짧게 하세요.
        - 3번째 질문 답변을 들으면 "상담 신청 완료" 버튼 안내와 함께 마무리하세요.
        - 내담자: ${userProfile.name}(${userProfile.age}세)
      `
    });

    // 2. 히스토리 정제
    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // 첫 메시지는 반드시 'user'여야 함
    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") {
      sanitizedHistory.shift();
    }

    // 3. 스트리밍 시작
    const result = await model.generateContentStream({
      contents: [...sanitizedHistory, { role: "user", parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    });

    // 4. 데이터를 브라우저로 흘려보내기
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
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      },
    });

  } catch (error: any) {
    console.error("🚨 AI Error:", error);
    return NextResponse.json(
      { error: `상담사 연결 실패: ${error.message}` },
      { status: 500 }
    );
  }
}
