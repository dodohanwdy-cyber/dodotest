import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Edge Runtime: 빠르고 스트리밍에 최적화됨
export const runtime = 'edge';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// 재시도 횟수 설정 (유료 플랜이라도 순간적인 429 방지용)
const MAX_RETRIES = 3;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // [요청하신 상세 프롬프트 복구 완료]
    const systemInstruction = `
      당신은 청년 정책 전문 AI 상담사입니다. 내담자가 자신의 고민을 편하게 털어놓을 수 있도록 **따뜻하고 친절하며 공감적인 말투**를 유지하세요.

      [내담자 정보] 이름: ${userProfile.name}, 나이: ${userProfile.age}세, 직업: ${userProfile.job_status}

      [상담 원칙]
      1. 질문 제한: 전체 대화에서 당신은 **단 3개의 질문**만 합니다.
      2. 답변 스타일: 내담자의 말에 깊이 공감하는 문장을 앞에 두고, 이어서 질문을 던지세요.
      3. 간결성: 답변은 공백 포함 150자 내외로 유지하세요.

      [대화 흐름]
      - 1단계(첫 답변): "가장 시급하게 해결하고 싶은 구체적인 어려움" 질문
      - 2단계: "그동안 상황을 어떻게 버텨오셨는지, 혹은 스스로 시도해본 현실적인 방법" 질문
      - 3단계: "이번 상담을 통해 내일 당장 어떤 작은 부분이라도 달라지기를 원하는지" 질문
      - 4단계(최종): 3번의 질문이 끝나면 공감의 인사를 전한 뒤, "전문 상담사가 최적의 정책을 찾아드리기 위해 준비 중이니, 아래 '상담 신청 완료하기' 버튼을 눌러달라"고 정중히 안내하며 마무리. (이후 추가 질문 금지)
    `;

    // Gemini 2.0 Flash 모델 사용
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemInstruction 
    });

    // 히스토리 정제
    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === "model") sanitizedHistory.shift();

    // ---------------------------------------------------------
    // [재시도 로직] 429(Too Many Requests) 에러 자동 복구
    // ---------------------------------------------------------
    let result;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await model.generateContentStream({
          contents: [...sanitizedHistory, { role: "user", parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        });
        break; // 성공 시 탈출
      } catch (error: any) {
        lastError = error;
        // 429 에러인 경우만 재시도
        if (error.response?.status === 429 || error.status === 429 || error.message?.includes('429')) {
          console.warn(`⚠️ 과부하(429) 감지. 재시도 중... (${attempt}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        } else {
          throw error; // 다른 에러는 중단
        }
      }
    }

    // 모든 재시도 실패 시 안내 메시지
    if (!result) {
      console.error("🚨 연결 실패:", lastError);
      const errorStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const msg = "죄송합니다. 현재 접속량이 폭주하여 연결이 지연되고 있습니다. 잠시 후 다시 시도 부탁드립니다. 😭";
          controller.enqueue(encoder.encode(msg));
          controller.close();
        }
      });
      return new Response(errorStream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    // 정상 스트림 처리 (파싱 에러 방지)
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
          console.error("Stream Error:", e);
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
    console.error("Server Error:", error);
    return NextResponse.json({ error: "상담 준비 중..." }, { status: 500 });
  }
}
