import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_API_KEY environment variable is missing");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "오디오 파일이 필요합니다." }, { status: 400 });
    }

    console.log(`[STT API] 오디오 수신 완료: ${audioFile.size} bytes, type: ${audioFile.type}`);

    // File 버퍼를 Base64로 변환
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    const systemInstruction = `
      당신은 상담 녹음 파일을 분석하고 정확하게 전사(STT)하며 화자를 분리하는 전문 AI입니다.
      
      [요구사항]
      1. 제공된 오디오를 듣고 한국어로 정확하게 전사하세요.
      2. 대화의 흐름과 목소리를 분석하여 화자를 완벽하게 두 명으로 분리(Diarization)하세요.
      3. 화자 라벨은 반드시 [상담사]와 [내담자]로 표기하세요.
      4. 발화 내용에 오타나 문맥상 어색한 부분이 있다면 자연스러운 한국어로 교정하여 작성하세요.
      5. 화자가 변경될 때마다 줄바꿈을 하여 가독성 좋게 출력해 주세요.
      6. 다음과 같은 형식으로 정확히 출력해야 합니다:
      [상담사] 안녕하세요. 오늘 어떤 고민으로 찾아오셨나요?
      [내담자] 네, 요즘 취업 준비 때문에 너무 스트레스를 받아서요.
    `;

    // Gemini 2.0 Flash 모델 사용: 최신 멀티모달 모델로 오디오/비디오(Native Audio) 인식과 
    // 한국어 문맥 기반 화자 분리(Diarization)에 1.5 시리즈보다 훨씬 강력하고 빠릅니다.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction 
    });

    const audioPart = {
      inlineData: {
        data: base64Audio,
        mimeType: audioFile.type || "audio/webm",
      },
    };

    const prompt = "첨부된 오디오 파일을 분석해서 전사 및 화자 분리를 시작해 줘.";

    console.log("[STT API] Gemini 모델 분석 시작...");
    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const text = response.text();

    console.log("[STT API] Gemini 분석 완료");

    return NextResponse.json({ transcript: text });

  } catch (error: any) {
    console.error("🚨 [STT API 상세 에러]", {
      message: error?.message,
      stack: error?.stack,
    });
    
    return NextResponse.json(
      { error: `STT 분석 도중 문제가 발생했습니다. (${error?.message || '알 수 없는 오류'})` },
      { status: 500 }
    );
  }
}
