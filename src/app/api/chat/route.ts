import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 상세 상담 프롬프트 복구
    const systemInstruction = `
      당신은 청년 정책 전문 AI 상담사입니다. 내담자에게 따뜻하게 공감하세요.
      [내담자 정보] 이름: ${userProfile.name}, 나이: ${userProfile.age}세, 직업: ${userProfile.job_status}

      [상담 원칙]
      1. 질문 제한: 전체 대화에서 당신은 **단 3개의 질문**만 합니다.
      2. 답변 스타일: 내담자의 말에 깊이 공감하는 문장을 앞에 두고, 이어서 질문을 던지세요.
      3. 간결성: 답변은 공백 포함 150자 내외로 유지하세요.

      [대화 흐름]
      - 1단계: 고민 공감 후 "가장 시급하게 해결하고 싶은 구체적인 어려움" 질문
      - 2단계: 공감 후 "그동안 상황을 어떻게 버텨오셨는지, 혹은 스스로 시도해본 현실적인 방법" 질문
      - 3단계: 답변 후 "내일 당장 어떤 작은 부분이라도 달라지기를 원하는지" 질문
      - 4단계: 3번의 질문 완료 후 "상담 신청 완료하기" 버튼을 눌러달라고 안내하며 마무리.
    `;

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

    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") {
      sanitizedHistory.shift();
    }

    // 스트리밍 호출
    const result = await model.generateContentStream({
      contents: [...sanitizedHistory, { role: "user", parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    });

    // [핵심 수정] 스트림 파싱 에러 방지를 위한 안정적인 스트림 생성
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
        } catch (e) {
          console.error("Stream stringify error:", e);
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
    console.error("🚨 AI Route Error:", error);
    return NextResponse.json({ error: "상담사 연결 실패" }, { status: 500 });
  }
}
