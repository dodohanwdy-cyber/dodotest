import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 여기서 모델명이 "gemini-2.0-flash"인지 반드시 확인하세요!
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: `
        당신은 청년 정책 전문 AI 상담사입니다. 내담자의 상황에 따뜻하게 공감하세요.
        - 질문은 전체 대화에서 **딱 3개**만 합니다.
        - 답변은 150자 내외로 아주 짧게 하세요.
        - 내담자: ${userProfile.name}(${userProfile.age}세)
      `
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

    const result = await model.generateContentStream({
      contents: [...sanitizedHistory, { role: "user", parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    });

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
    return NextResponse.json({ error: "상담 준비 중..." }, { status: 500 });
  }
}
