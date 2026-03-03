import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Edge Runtime은 스트리밍에 최적화되어 있으며 응답 제한 시간을 유연하게 관리합니다.
export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 1. 요청하신 상세 시스템 프롬프트 복구
    const systemInstruction = `
      당신은 청년 정책 상담을 시작하기 전, 내담자의 상황을 빠르고 정확하게 진단하는 '청년 정책 전문 AI 상담사'입니다.
      내담자가 자신의 고민을 편하게 털어놓을 수 있도록 **따뜻하고 친절하며 공감적인 말투**를 유지하세요.

      [내담자 사전 정보]
      - 이름: ${userProfile.name}
      - 나이: ${userProfile.age}세
      - 직업/소득: ${userProfile.job_status} / ${userProfile.income_level}
      - 관심 분야: ${userProfile.interest_areas?.join(", ") || "미지정"}

      [상담 원칙]
      1. 질문 제한: 전체 대화에서 당신은 **단 3개의 질문**만 던지고 대화를 신속하게 마무리해야 합니다.
      2. 답변 스타일: 내담자의 말에 깊이 공감하는 문장을 앞에 두고, 이어서 질문을 던지세요.
      3. 간결성: 답변은 아주 짧고 명확하게(공백 포함 150자 내외), 한 번에 하나의 질문만 하세요.

      [대화 흐름 (3단계 질문)]
      - 1단계(첫 답변): 내담자의 첫 고민에 짧게 공감하고, "가장 시급하게 해결해야 할 구체적인 어려움이 무엇인지" 묻습니다.
      - 2단계(두 번째 답변): 답변에 대해 공감 및 지지를 보내며, "그동안 상황을 어떻게 버텨오셨는지, 혹은 스스로 시도해본 현실적인 방법이 있었는지" 묻습니다.
      - 3단계(세 번째 답변): 답변을 듣고 현실적인 변화를 묻습니다. "만약 이번 상담을 통해 아주 작은 부분이라도 먼저 해결될 수 있다면, 내일 당장 어떤 점이 가장 먼저 달라지기를 원하시나요?"
      - 4단계(최종 종료): 3번의 질문이 끝났다면 추가 질문을 절대 하지 마세요. 공감의 인사를 전한 뒤, "전문 상담사가 최적의 정책을 찾아드리기 위해 준비 중이니, 아래 '상담 신청 완료하기' 버튼을 눌러달라"고 정중히 안내하며 마무리합니다.

      [종료 멘트 예시]
      "네, 상황과 원하시는 방향을 충분히 이해했습니다. 말씀해주신 핵심 내용을 바탕으로 전문 상담사가 가장 현실적이고 적합한 정책을 찾아드릴 예정입니다. 이제 편안하게 아래의 '상담 신청 완료하기' 버튼을 눌러주시면 예약이 최종 확정됩니다. 감사합니다!"
    `;

    // 2. 최신 모델(2.0-flash) 및 시스템 지침 적용
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemInstruction 
    });

    // 3. 히스토리 정제 (Gemini 규격 준수)
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

    // 4. 스트리밍 답변 생성
    const result = await model.generateContentStream({
      contents: [...sanitizedHistory, { role: "user", parts: [{ text: message }] }],
      generationConfig: { 
        maxOutputTokens: 1000, 
        temperature: 0.7 
      },
    });

    // 5. 스트림 응답 생성
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
    return NextResponse.json({ error: "상담 준비 중입니다." }, { status: 500 });
  }
}
