import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Vercel에서 최대 60초까지 기다리도록 설정 (하지만 무료플랜은 10초 내외임)
export const maxDuration = 60;

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
      2. 답변은 120자 내외로 아주 짧게 하세요.
      3. 대화 단계: 공감 후 상황 파악(질문1) -> 대처 파악(질문2) -> 목표 설정(질문3).
      
      내담자: ${userProfile.name}(${userProfile.age}세)
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // 속도가 가장 빠른 1.5-flash 권장 (2.5보다 안정적)
      systemInstruction: systemInstruction 
    });

    // 히스토리 간소화로 속도 향상
    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") sanitizedHistory.shift();
    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === "user") sanitizedHistory.pop();

    const chat = model.startChat({
      history: sanitizedHistory,
      generationConfig: { maxOutputTokens: 500, temperature: 0.5 },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return NextResponse.json({ output: response.text() });

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "상담 준비 중..." }, { status: 500 });
  }
}
