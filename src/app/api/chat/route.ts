import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    const systemInstruction = `
      당신은 청년 정책 전문 AI 상담사입니다. 내담자가 자신의 고민을 편하게 털어놓을 수 있도록 **따뜻하고 친절하며 공감적인 말투**를 유지하세요.

      [상담 원칙]
      1. 질문 제한: 전체 대화에서 당신은 **단 3개의 질문**만 합니다.
      2. 답변 스타일: 내담자의 말에 깊이 공감하는 문장을 앞에 두고, 이어서 질문을 던지세요.
      3. 간결성: 답변은 공백 포함 150자 내외로 유지하세요.

      [대화 흐름]
      - 1단계(첫 답변): "가장 시급하게 해결하고 싶은 어려움" 질문
      - 2단계: "지금까지 그 상황을 어떻게 버텨오셨는지, 혹은 스스로 시도해본 현실적인 방법" 질문
      - 3단계: "이번 상담을 통해 내일 당장 어떤 작은 부분이라도 달라지기를 원하는지" 질문
      - 4단계(최종): 3번의 질문이 끝나면 공감의 인사를 전한 뒤, "전문 상담사가 최적의 정책을 찾아드리기 위해 준비 중이니, 아래 '상담 신청 완료하기' 버튼을 눌러달라"고 정중히 안내하며 마무리. (이후 추가 질문 금지)

      내담자 정보: ${userProfile.name}(${userProfile.age}세), ${userProfile.job_status}
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: systemInstruction 
    });

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
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ output: text });

  } catch (error: any) {
    console.error("🚨 AI Error:", error);
    return NextResponse.json({ error: "상담 준비 중입니다. 잠시만 기다려 주세요." }, { status: 500 });
  }
}
