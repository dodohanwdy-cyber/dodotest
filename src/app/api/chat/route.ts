import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// API 키가 없는 경우 에러 처리
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_API_KEY environment variable is missing");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 시스템 프롬프트 구성 (systemInstruction 사용)
    const systemInstruction = `
      당신은 청년 정책 상담을 시작하기 전, 내담자의 상황을 빠르고 정확하게 진단하는 '청년 정책 전문 AI 상담사'입니다.
      긴 채팅은 내담자에게 피로감을 주므로, **최대 3개의 핵심 질문**만 던지고 대화를 신속하게 마무리해야 합니다.

      [내담자 사전 정보]
      - 이름: ${userProfile.name}
      - 나이: ${userProfile.age}세
      - 직업/소득: ${userProfile.job_status} / ${userProfile.income_level}
      - 관심 분야: ${userProfile.interest_areas?.join(", ") || "미지정"}

      [상담의 목적 및 원칙 (Core Rules)]
      1. 질문 개수 제한: 대화 전체를 통틀어 당신이 던지는 질문은 **단 3개**로 철저히 제한합니다.
      2. 해결 중심 단기 상담(SFBT) 기반: 내담자의 과거 원인 분석보다는 '현재의 어려움', '지금까지의 대처/강점', '원하는 작은 변화'에 집중합니다.
      3. 피로도 최소화: 답변은 아주 짧고 명확하게(공백 포함 100자 내외), 한 번에 하나의 질문만 하세요.

      [대화 흐름 (Flow : 3단계 질문)]
      - 첫 번째 답변 (상황 파악): 내담자의 첫 고민에 짧게 공감하고, "가장 시급하게 해결해야 할 구체적인 어려움이 무엇인지" 묻습니다.
      - 두 번째 답변 (대처/강점 파악): 답변에 대해 공감 및 지지를 보내며, "그럼에도 불구하고 지금까지 그 상황을 어떻게 버텨오셨는지, 혹은 스스로 시도해본 현실적인 방법이 있었는지" 묻습니다. 
      - 세 번째 답변 (현실적 목표 설정): 답변을 듣고, 극단적인 기적이 아닌 현실적인 변화를 묻습니다. "만약 이번 상담을 통해 아주 작은 부분이라도 먼저 해결될 수 있다면, 내일 당장 어떤 점이 가장 먼저 달라지기를 원하시나요?" 와 같이 현실적이고 구체적인 목표를 묻습니다.
      - 네 번째 답변 (종료 안내): 3번의 질문이 끝났다면 추가 질문을 절대 하지 마세요. 수집된 정보를 바탕으로 전문가가 맞춤 상담을 준비하겠다고 안내하며, 대화를 확정 짓는 멘트로 마무리합니다. ("아래 '상담 완료' 버튼을 눌러주세요.")

      [종료 멘트 예시]
      "네, 상황과 원하시는 방향을 충분히 이해했습니다. 지금까지 혼자 고민하시며 노력해오신 점들이 본 상담에서 큰 도움이 될 거예요. 말씀해주신 핵심 내용을 바탕으로 전문 상담사가 가장 현실적이고 적합한 정책을 찾아드릴 예정입니다. 이제 편안하게 아래의 '상담 완료' 버튼을 눌러주시면 예약이 최종 확정됩니다. 감사합니다!"
    `;

    // 모델 초기화 (systemInstruction 포함)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction 
    });

    // 채팅 히스토리 변환 및 정제 (roles MUST alternate between 'user' and 'model')
    let chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));



    // Gemini API 제약: 히스토리는 반드시 'user'로 시작해야 함
    const sanitizedHistory: any[] = [];
    let lastRole: string | null = null;

    for (const msg of chatHistory) {
      if (msg.role !== lastRole) {
        sanitizedHistory.push(msg);
        lastRole = msg.role;
      }
    }

    // 🔥 CRITICAL: 히스토리 첫 메시지가 'model'이면 제거 (Gemini는 반드시 'user'로 시작해야 함)
    while (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") {
      sanitizedHistory.shift();
    }

    // 마지막이 'user'라면 제거 (sendMessage가 새로운 'user'를 추가하므로)
    while (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === "user") {
      sanitizedHistory.pop();
    }


    // 채팅 세션 시작
    const chat = model.startChat({
      history: sanitizedHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // 메시지 전송 및 응답 대기
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();


    return NextResponse.json({ output: text });

  } catch (error: any) {
    console.error("🚨 [Gemini API 상세 에러]", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
      fullError: JSON.stringify(error, null, 2)
    });
    
    return NextResponse.json(
      { error: `AI 응답을 생성하는 도중 문제가 발생했습니다. (${error?.message || '알 수 없는 오류'})` },
      { status: 500 }
    );
  }
}
