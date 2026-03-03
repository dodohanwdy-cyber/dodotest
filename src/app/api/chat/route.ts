import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// API 키 환경변수 확인
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_API_KEY environment variable is missing");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 1. 시스템 프롬프트 (안정적인 지시를 위해 구조화)
    const systemInstruction = `
      당신은 청년 정책 상담을 시작하기 전, 내담자의 상황을 빠르고 정확하게 진단하는 '청년 정책 전문 AI 상담사'입니다.
      긴 채팅은 내담자에게 피로감을 주므로, **최대 3개의 핵심 질문**만 던지고 대화를 신속하게 마무리해야 합니다.

      [내담자 사전 정보]
      - 이름: ${userProfile.name}
      - 나이: ${userProfile.age}세
      - 직업/소득: ${userProfile.job_status} / ${userProfile.income_level}
      - 관심 분야: ${userProfile.interest_areas?.join(", ") || "미지정"}

      [상담의 목적 및 원칙]
      1. 질문 개수 제한: 당신이 던지는 질문은 전체 대화에서 **단 3개**로 제한합니다.
      2. 해결 중심: 현재의 어려움과 원하는 변화에 집중하세요.
      3. 간결성: 답변은 공백 포함 150자 내외로 짧게, 한 번에 하나의 질문만 하세요.

      [대화 단계]
      - 1단계: 고민 공감 후 "가장 시급한 구체적 어려움" 질문
      - 2단계: 공감 후 "지금까지 버텨온 방법이나 시도해본 것" 질문
      - 3단계: 답변 후 "내일 당장 어떤 점이 달라지길 원하는지" 질문
      - 4단계: 3개 질문 완료 시 추가 질문 없이 "상담 완료 버튼을 눌러달라"고 정중히 마무리.
    `;

    // 2. 모델 설정 (안정성을 위해 1.5-flash 권장하나 기존 설정 유지)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // 2.5 버전 오류 발생 시 1.5-flash로 변경해 보세요.
      systemInstruction: systemInstruction 
    });

    // 3. 히스토리 정제 (Gemini 규격에 완벽하게 맞춤)
    // 프론트에서 넘어온 'ai' 또는 'model' 모두를 'model'로 통일합니다.
    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "") // 빈 메시지 제외
      .map((msg: any) => ({
        role: (msg.role === "ai" || msg.role === "model") ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // Gemini 제약: 히스토리는 반드시 'user'로 시작해야 하며, 'user'-'model'이 교대로 나와야 함
    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") {
      sanitizedHistory.shift(); // 첫 메시지가 모델이면 제거
    }

    // 4. 채팅 세션 시작
    const chat = model.startChat({
      history: sanitizedHistory,
      generationConfig: {
        maxOutputTokens: 1000, // 답변이 잘리지 않게 넉넉히 설정
        temperature: 0.7,
      },
    });

    // 5. 메시지 전송 및 응답 처리
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("AI가 빈 답변을 생성했습니다.");
    }

    return NextResponse.json({ output: text });

  } catch (error: any) {
    console.error("🚨 [Gemini API 에러]", error);
    
    return NextResponse.json(
      { error: `상담사 연결에 문제가 생겼습니다. 다시 시도해 주세요. (${error?.message})` },
      { status: 500 }
    );
  }
}
