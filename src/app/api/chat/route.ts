import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Edge Runtime: 빠르고 스트리밍에 최적화됨
// export const runtime = 'edge'; // 504 방지를 위해 Node.js 런타임 사용 고려 (주석 처리 시 기본 Node.js)
const apiKey = process.env.GOOGLE_API_KEY;
const MAX_RETRIES = 3; // 7회 -> 3회로 축소 (Vercel 타임아웃 방지)
const LOCAL_TIMEOUT = 10000; // 로컬 AI 응답 대기 최대 10초

export async function POST(req: Request) {
  if (!apiKey) {
    return new Response("API 키 설정이 누락되었습니다. 관리자에게 문의해 주세요.", { status: 200 });
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
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

      [중요!] 절대 한 번에 2개 이상의 질문을 하지 마세요. 반드시 내담자의 답변을 듣고 나서 다음 단계의 질문 하나만 던지세요.
    `;

    // [로컬 전용 프롬프트] EXAONE 등 로컬 모델용 (극도의 간결함과 강제성)
    const localSystemInstruction = `
      당신은 청년 정책 상담사입니다. 아래 규칙을 반드시 지키세요.
      1. 한 번에 딱 **하나의 질문**만 하세요. 절대 질문 두 개를 합치지 마세요.
      2. 답변은 아주 짧게 하세요. 공감을 먼저 하고 질문하세요.
      3. 대화 단계:
         - 1단계: "가장 시급한 구체적인 어려움" 질문.
         - 2단계: "그동안 시도해본 방법" 질문.
         - 3단계: "당장 달라지길 원하는 작은 변화" 질문.
         - 4단계: 마무리 인사와 "상담 신청 완료하기" 안내.
      현재 내담자(${userProfile.name})의 답변을 듣고, 다음 단계 질문 **하나**만 하세요.
    `;

    // [기존 합의 모델 복구] Gemini 2.x 버전 사용
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
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

    // 시스템 프롬프트를 대화의 가장 처음에 명시적으로 주입 (호환성 최우선)
    const finalContents = [
      { role: "user", parts: [{ text: `시스템 지침: ${systemInstruction}\n\n이 지침을 반드시 숙지하고 대화를 시작하세요.` }] },
      { role: "model", parts: [{ text: "네, 숙지했습니다. 청년 정책 전문 AI 상담사로서 따뜻하고 친절하게 대화를 시작하겠습니다." }] },
      ...sanitizedHistory, 
      { role: "user", parts: [{ text: message }] }
    ];

    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          result = await model.generateContentStream({
            contents: finalContents,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
          });
          break; // 성공 시 탈출
        } catch (error: any) {
          lastError = error;
          const status = error.response?.status || error.status;
          const isRetryableError = status === 429 || status === 503 || status === 500 || (error.message && (error.message.includes('429') || error.message.includes('503')));
          
          if (isRetryableError && attempt < MAX_RETRIES) {
            console.warn(`⚠️ Gemini API 과부하/오류(${status}) 감지. 재시도 중... (${attempt}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1500 * Math.pow(2, attempt - 1)));
          } else {
            // 재시도 불가능하거나 횟수 초과 시 Gemini 시도 종료 (상위 try-catch에서 페일오버로 넘김)
            throw error;
          }
        }
      }
    } catch (geminiError: any) {
      console.error("🚨 Gemini API 최종 실패:", geminiError.message);
      // 여기서 result는 undefined 상태로 유지되어 아래의 페일오버 로직으로 진입하게 됨
    }

    // ---------------------------------------------------------
    // [최종 실패 시 페일오버] Gemini 실패 시 로컬 AI로 전환
    // ---------------------------------------------------------
    if (!result) {
      console.warn("🚨 Gemini API 최종 실패. 로컬 AI(EXAONE)로 전환을 시도합니다...");
      
      // 사용자 제공 기본값 적용 (Vercel 환경변수 미설정 시에도 작동)
      const localUrl = process.env.LOCAL_LLM_URL || "https://gastritic-debbi-unbeneficently.ngrok-free.dev/v1";
      const localModel = process.env.LOCAL_LLM_MODEL || "exaone3.5";

      if (!localUrl) {
        console.error("🚨 로컬 AI URL이 설정되지 않아 페일오버가 불가능합니다.");
        const errorStream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode("죄송합니다. 현재 서비스 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요. 😭"));
            controller.close();
          }
        });
        return new Response(errorStream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

        // EXAONE 3.5 7.8B 최적화: 구조화된 지시와 예시(Few-shot) 제공
        let phaseGoal = "";
        let phaseExample = "";
        
        if (userMessageCount === 1) {
          phaseGoal = "내담자의 첫 인사를 듣고 따뜻하게 공감한 뒤, '현재 가장 시급하게 해결하고 싶은 구체적인 어려움'이 무엇인지 '딱 하나'만 물어보세요.";
          phaseExample = "예시: '그동안 혼자 고민하시느라 정말 고생 많으셨어요. ${userProfile.name}님, 지금 가장 시급하게 해결하고 싶은 구체적인 상황은 무엇인가요?'";
        } else if (userMessageCount === 2) {
          phaseGoal = "내담자의 고민에 깊이 공감하고, '이 상황을 해결하기 위해 그동안 스스로 시도해본 현실적인 방법'이 있는지 '딱 하나'만 물어보세요.";
          phaseExample = "예시: '정말 답답한 상황이셨겠네요... 혹시 이 문제를 해결하기 위해 ${userProfile.name}님께서 그동안 스스로 시도해 보신 방법이 있을까요?'";
        } else if (userMessageCount === 3) {
          phaseGoal = "내담자의 시도를 격려하고, '이번 상담을 통해 내일 당장 어떤 작은 부분이라도 구체적으로 달라지길 원하는지' '딱 하나'만 물어보세요.";
          phaseExample = "예시: '그렇게 노력해 오셨다니 정말 대단하세요. 그러면 이번 상담을 통해 내일 당장 아주 작은 부분이라도 어떤 점이 달라지기를 바라시나요?'";
        } else {
          phaseGoal = "공감의 인사와 함께 전문 상담사가 준비 중임을 알리고 대화를 정중히 마무리하세요. 더 이상의 질문은 절대 금지입니다.";
          phaseExample = "예시: '네, 말씀해 주신 내용 잘 알겠습니다. 전문 상담사가 최적의 정책을 찾기 위해 대기 중이니, 아래 버튼을 눌러 신청을 완료해 주세요!'";
        }

        const localDynamicInstruction = `
### 당신의 역할
- 당신은 '열고닫기(OPCL)'의 청년 정책 전문 AI 상담사입니다.
- 내담자의 이름은 ${userProfile.name}이며, 직업은 ${userProfile.job_status}입니다.

### 행동 규칙
1. **[공감 우선]**: 모든 답변의 시작은 내담자의 상황에 대한 진심 어린 공감이어야 합니다.
2. **[단일 질문]**: 반드시 '딱 하나'의 질문만 하세요. 질문 두 개를 절대 합치지 마세요.
3. **[단계 준수]**: 현재 당신은 ${userMessageCount}단계에 있습니다. 이전 단계나 다음 단계의 질문을 미리 하지 마세요.
4. **[간결함]**: 답변은 150자 이내로 친절하면서도 명확하게 작성하세요.

### 현재 목표
- ${phaseGoal}

### 답변 가이드 (형식을 참고하되 내용은 상황에 맞게 변형하세요)
- ${phaseExample}
        `.trim();

        // 로컬 AI 호출 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT);

        // 로컬 LLM (Ollama/LM Studio 등) 호출
        const localResponse = await fetch(`${localUrl}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify({
            model: localModel,
            messages: [
              { role: "system", content: localDynamicInstruction }, // EXAONE 3.5 최적화 동적 프롬프트
              ...sanitizedHistory.map((m: any) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text })),
              { role: "user", content: message }
            ],
            stream: true,
            temperature: 0.7,
          }),
        });

        clearTimeout(timeoutId);
        if (!localResponse.ok) throw new Error(`Local AI error: ${localResponse.status}`);

        // 로컬 AI 스트림 처리 (SSE 규격 파싱)
        const localStream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const reader = localResponse.body?.getReader();
            if (!reader) return controller.close();

            const decoder = new TextDecoder();
            let buffer = "";

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed === "data: [DONE]") continue;
                  if (trimmed.startsWith("data: ")) {
                    try {
                      const json = JSON.parse(trimmed.slice(6));
                      const content = json.choices[0]?.delta?.content || "";
                      if (content) controller.enqueue(encoder.encode(content));
                    } catch (e) {}
                  }
                }
              }
            } finally {
              controller.close();
            }
          }
        });

        return new Response(localStream, { 
          headers: { 
            "Content-Type": "text/plain; charset=utf-8",
            "X-AI-Source": "Local-EXAONE" // 로컬 AI 작동 시 헤더 표시
          } 
        });

      } catch (localErr) {
        console.error("🚨 로컬 AI 페일오버 마저 실패:", localErr);
        const finalErrorStream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode("죄송합니다. 모든 AI 연결이 지연되고 있습니다. 잠시 후 다시 시도 부탁드립니다."));
            controller.close();
          }
        });
        return new Response(finalErrorStream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
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
        "X-AI-Source": "Google-Gemini" // Gemini 작동 시 헤더 표시
      },
    });

  } catch (error: any) {
    console.error("🚨 Server Error:", error);
    // 에러 발생 시 스트림으로 에러 메시지 전달 (프론트엔드 파싱 에러 방지)
    const errorMsg = `시스템 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}. 잠시 후 다시 시도해 주세요.`;
    return new Response(errorMsg, { 
      status: 200, // 500 대신 200으로 보내서 프론트엔드가 메시지를 읽게 함
      headers: { "Content-Type": "text/plain; charset=utf-8" } 
    });
  }
}
