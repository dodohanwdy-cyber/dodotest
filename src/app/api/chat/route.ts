import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;
const MAX_RETRIES = 3; 
const LOCAL_TIMEOUT = 10000; 

export async function POST(req: Request) {
  let geminiErrorMessage = ""; 

  try {
    const body = await req.json();
    const { message, history, userProfile } = body;

    // 1. 사용자 메세지 카운트 계산 (복원)
    const userMessageCount = (history?.filter((m: any) => m.role === "user").length || 0) + 1;

    // 2. SFBT (해결중심 단기치료) 기반 단계별 동적 상담 지침
    let phaseGoal = "";
    let phaseExample = "";
    const userName = userProfile?.name || "내담자";

    if (userMessageCount === 1) {
      phaseGoal = "내담자의 첫 인사를 듣고 따뜻하게 공감한 뒤, '현재 가장 시급하게 해결하고 싶은 구체적인 어려움'이 무엇인지 딱 하나만 질문하세요.";
      phaseExample = `예시: '그동안 혼자 고민하시느라 정말 고생 많으셨어요. ${userName}님, 지금 가장 시급하게 해결하고 싶은 구체적인 상황은 무엇인가요?'`;
    } else if (userMessageCount === 2) {
      phaseGoal = "내담자의 고민에 깊이 공감하고, '이 상황을 해결하기 위해 그동안 스스로 시도해본 현실적인 방법'이 있는지 딱 하나만 질문하세요.";
      phaseExample = `예시: '정말 답답한 상황이셨겠네요... 혹시 이 문제를 해결하기 위해 ${userName}님께서 그동안 스스로 시도해 보신 방법이 있을까요?'`;
    } else if (userMessageCount === 3) {
      phaseGoal = "내담자의 시도를 격려하고, '이번 상담을 통해 내일 당장 아주 작은 부분이라도 구체적으로 달라지길 원하는 점'이 무엇인지 딱 하나만 질문하세요.";
      phaseExample = `예시: '그렇게 노력해 오셨다니 정말 대단하세요. 그러면 이번 상담을 통해 내일 당장 아주 작은 부분이라도 어떤 점이 달라지기를 바라시나요?'`;
    } else {
      phaseGoal = "공감의 인사와 함께 전문 상담사가 최적의 청년 정책을 찾기 위해 대기 중임을 안내하고 정중히 대화를 마무리하세요. 더 이상의 질문은 절대 금지입니다.";
      phaseExample = `예시: '네, 말씀해 주신 내용 잘 알겠습니다. 전문 상담사가 최적의 정책을 찾기 위해 준비 중이니, 아래 버튼을 눌러 상담 신청을 완료해 주세요!'`;
    }

    const dynamicInstruction = `### 당신의 역할
- 당신은 '열고닫기(OPCL)'의 청년 정책 전문 AI 상담사입니다.
- SFBT(해결중심 단기치료) 기법을 활용해 청년 내담자의 문제를 3단계로 명확하고 신속하게 파악합니다.
- 내담자 이름: ${userName}

### 행동 규칙
1. [공감 우선]: 내담자의 상황과 감정에 먼저 깊이 공감합니다.
2. [단일 질문]: 매 단계마다 반드시 '단 하나'의 질문만 수행하세요.
3. [단계 준수]: 현재 ${userMessageCount}단계 상담 진행 중입니다.

### 현재 목표 (${userMessageCount}단계)
- ${phaseGoal}

### 답변 가이드
- ${phaseExample}
- 친절하고 격려하는 어조의 표준 한국어를 사용하세요.`;

    const sanitizedHistory = (history || [])
      .filter((msg: any) => msg.content && msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content,
      }));

    // ---------------------------------------------------------
    // [우선순위 1] Google Gemini 시도
    // ---------------------------------------------------------
    try {
      if (!apiKey) throw new Error("API 키 누락");
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: dynamicInstruction // 복원된 동적 지침 적용
      });
      
      const geminiHistory = sanitizedHistory.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const finalContents = [
        ...geminiHistory, 
        { role: "user", parts: [{ text: message }] }
      ];

      let result: any;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          result = await model.generateContentStream({
            contents: finalContents,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
          });
          break;
        } catch (err: any) {
          const status = err.response?.status || err.status;
          if ((status === 429 || status === 503) && attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); 
            continue;
          }
          throw err; 
        }
      }

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
          } finally { controller.close(); }
        },
      });

      return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "Google-Gemini" } });

    } catch (geminiErr: any) {
      geminiErrorMessage = geminiErr.message;
      console.warn("⚠️ Google Gemini 실패:", geminiErrorMessage);
      
      // ---------------------------------------------------------
      // [우선순위 2] 로컬 AI (EXAONE) (Fallback)
      // ---------------------------------------------------------
      const localUrl = process.env.LOCAL_LLM_URL || "https://gastritic-debbi-unbeneficently.ngrok-free.dev/v1";
      const localModel = process.env.LOCAL_LLM_MODEL || "exaone3.5";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOCAL_TIMEOUT);

      const localResponse = await fetch(`${localUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: "system", content: dynamicInstruction }, ...sanitizedHistory, { role: "user", content: message }],
          stream: true,
          temperature: 0.7,
        }),
      });

      clearTimeout(timeoutId);
      if (!localResponse.ok) throw new Error(`Local Server Status: ${localResponse.status}`);

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
                if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
                  try {
                    const json = JSON.parse(trimmed.slice(6));
                    const content = json.choices[0]?.delta?.content || "";
                    if (content) controller.enqueue(encoder.encode(content));
                  } catch (e) {}
                }
              }
            }
          } finally { controller.close(); }
        }
      });

      return new Response(localStream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Source": "Local-EXAONE" } });
    }

  } catch (error: any) {
    const finalErrorMsg = `Gemini 실패(${geminiErrorMessage || "연결안됨"}) / Local 최종 실패(${error.message})`;
    return new Response(`서비스 연결이 원활하지 않습니다. (진단: ${finalErrorMsg})`, { 
      status: 200, 
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Error": "True" }
    });
  }
}
