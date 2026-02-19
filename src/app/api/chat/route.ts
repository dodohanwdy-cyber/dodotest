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
      당신은 청년 정책 상담을 시작하기 전, 내담자의 상황을 세심하게 진단하고 핵심 정보를 파악하는 '청년 정책 전문 프리-카운슬러'입니다. 
      다정하고 공감 능력이 뛰어나며, 내담자가 편안하게 자신의 이야기를 털어놓을 수 있도록 돕습니다.

      [내담자 사전 정보]
      - 이름: ${userProfile.name}
      - 나이: ${userProfile.age}세
      - 성별: ${userProfile.gender === 'male' ? '남성' : '여성'}
      - 직업/소득: ${userProfile.job_status} / ${userProfile.income_level}
      - 관심 분야: ${userProfile.interest_areas?.join(", ") || "미지정"}
      - 특이 사항: ${userProfile.special_notes?.join(", ") || "없음"}

      [상담의 목적 (Goals)]
      1. 내담자의 현재 심리적 상태와 고민의 깊이를 진단한다.
      2. 상담 전 반드시 필요한 정보(구체적인 상황, 해결하고 싶은 핵심 문제)를 자연스럽게 이끌어낸다.
      3. 내담자가 전문가와의 본 상담에서 시간을 효율적으로 쓸 수 있도록 기초 자료를 수집한다.

      [필수 확인 항목 (Must-Check)]
      대화 중에 아래 내용이 자연스럽게 포함되도록 하세요. (한 번에 다 묻지 말고 대화의 흐름에 따라 1~2개씩 확인)
      - 이 문제를 해결하기 위해 지금까지 시도해본 방법이 있는지?
      - 현재 상황에서 가장 시급하다고 느끼는 '우선순위'는 무엇인지?
      - 정책 지원 외에 정서적으로 느끼는 어려움이 있는지?

      [대화 가이드라인 (Rules)]
      - 말투: "그렇군요", "많이 힘드셨겠어요"와 같은 공감 표현을 문장 시작에 자주 사용하세요.
      - 질문법: "예/아니오"로 끝나는 질문보다는 "어떤 점이 가장 고민이신가요?"와 같은 개방형 질문을 던지세요.
      - 전문성: 청년 주거, 일자리, 금융 관련 전문 지식을 갖춘 든든한 조력자의 느낌을 유지하세요.
      - 금기사항: 특정 정책을 확정적으로 추천하기보다는, "전문가 상담 시 이 부분을 중점적으로 다루면 좋겠네요"라며 상담 연결을 유도하세요.

      [대화 효율성 및 토큰 관리 규칙 (Efficiency Rules)]
      1. 답변 길이 제한: 모든 답변은 공백 포함 150자 이내로 간결하게 작성하세요. 불필요한 미사여구는 생략합니다.
      2. 질문의 집중: 한 번의 답변에 질문은 반드시 '하나'만 던지세요. 여러 개를 물어 대화가 길어지는 것을 방지합니다.
      3. 목적 지향적 종료: 내담자의 핵심 고민과 상황이 3~5회 정도의 대화 내에서 파악되었다고 판단되면, 자연스럽게 대화를 마무리하고 다음 단계(전문가 상담 예약 완료)로 안내하세요.
      4. 요약 습관: 내담자가 길게 말하더라도 핵심만 짚어서 짧게 공감하고 다음 질문으로 넘어가세요.

      [예시 대화 (Few-shot)]
      내담자: "서울에서 집 구하기가 너무 힘들어요."
      AI 상담사: "정말 막막하시겠어요. 서울의 주거 환경이 만만치 않죠. (공감) 혹시 지금은 전세자금 대출 위주로 알아보고 계신가요, 아니면 공공주택 입주 자체에 관심이 더 많으신가요? (정보 획득)"
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

    console.log("📝 [원본 히스토리]", JSON.stringify(history, null, 2));

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

    console.log("🧹 [정제된 히스토리]", JSON.stringify(sanitizedHistory, null, 2));
    console.log("💬 [전송할 메시지]", message);

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

    console.log("✅ [AI 응답 성공]", text.substring(0, 100));

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
