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
    const realtimeTranscript = formData.get("realtime_transcript") as string || "";
    
    if (!audioFile) {
      return NextResponse.json({ error: "오디오 파일이 필요합니다." }, { status: 400 });
    }

    console.log(`[STT API] 오디오 수신 완료: ${audioFile.size} bytes, 실시간 텍스트 글자수: ${realtimeTranscript.length}자`);

    // File 버퍼를 Base64로 변환
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    // [축약/의역 절대 금지 & Verbatim 원문 전사 지침 적용]
    const systemInstruction = `
      당신은 상담 녹음 파일을 분석하여 단 한 단어도 생략하거나 요약하지 않고 100% 원문 그대로(Verbatim) 전사 및 화자를 분리하는 정밀 STT AI입니다.
      
      [절대 준수 규칙]
      1. 절대로 전사 내용을 축약, 요약, 문장 임의 생략, 의역하지 마십시오. 오디오에서 청취된 모든 발화, 감탄사, 추임새를 있는 그대로 전사해야 합니다.
      2. 제공된 오디오와 실시간 수집 텍스트를 대조하여, 대화의 흐름과 목소리 톤을 기반으로 화자를 두 명([상담사], [내담자])으로 완벽하게 분리(Diarization)하십시오.
      3. 화자 라벨은 반드시 [상담사]와 [내담자]로만 표기하고 화자가 바뀔 때마다 줄바꿈을 적용하세요.
      4. 텍스트를 임의로 재구성하거나 줄이지 말고, 실제 말한 순서와 원문의 어휘를 100% 보존하여 출력하세요.
      
      [출력 포맷 예시]
      [상담사] 안녕하세요. 오늘 어떤 고민으로 찾아오셨나요?
      [내담자] 네, 요즘 취업 준비 때문에 너무 스트레스를 받아서요.
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.1, // 무작위성과 축약/환각을 최대로 억제
        topP: 0.8
      }
    });

    const audioPart = {
      inlineData: {
        data: base64Audio,
        mimeType: audioFile.type || "audio/webm",
      },
    };

    let prompt = "첨부된 오디오 파일을 분석해서 원문 축약 없이 100% 그대로 전사 및 화자 분리를 실행해 줘.";
    if (realtimeTranscript.trim()) {
      prompt += `\n\n[참고: 실시간으로 직접 수집된 100% 원본 대화 텍스트]\n${realtimeTranscript}\n\n위 원본 대화 텍스트의 내용을 생략하거나 바꾸지 말고, 오디오 목소리와 매칭하여 [상담사]와 [내담자] 라벨을 붙여 정확히 화자 분리해 줘.`;
    }

    console.log("[STT API] Gemini 2.5 Flash Verbatim 화자 분리 분석 시작...");
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
