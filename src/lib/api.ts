import { WEBHOOK_URLS } from "@/config/webhooks";

export async function postToWebhook(actionOrUrl: string, data: any) {
  if (!actionOrUrl) {
    console.error("Webhook action or URL is not defined.");
    return { success: false, error: "Configuration missing" };
  }

  // 브라우저에서 직접 외부 n8n URL로 슛하는 기존 로직이 남아있다면 프록시로 전달하도록 강제합니다.
  const isDirectUrl = actionOrUrl.startsWith("http");

  try {
    let fetchUrl = actionOrUrl;
    let fetchBody = JSON.stringify(data);

    // 액션 키(예: 'LOGIN')가 넘어오면 우리 Next.js API 프록시(`/api/webhook`)로 라우팅
    if (!isDirectUrl) {
      fetchUrl = '/api/webhook';
      fetchBody = JSON.stringify({ action: actionOrUrl, payload: data });
    }

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
      body: fetchBody,
      cache: "no-store",
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const resBody = isJson ? await response.json() : null;

    console.group(`🌐 API Request: ${actionOrUrl}`);
    console.log("Payload:", data);
    console.log("Status:", response.status);
    console.log("Response Body:", resBody);
    console.groupEnd();

    if (!response.ok) {
      // 서버에서 인증 오류 권한 없음(401) 등 반환 가능
      if (response.status === 401) {
        return { success: false, error: "Unauthorized", status: 401, message: "세션이 만료되었습니다. 다시 로그인해주세요." };
      }

      const isBodySuccess = resBody && (resBody.status === "success" || resBody.code);
      
      if (response.status === 500 && !isBodySuccess) {
        console.error("🚨 [n8n 서버 오류] n8n 워크플로우 내부 혹은 프록시에서 에러가 발생했습니다.");
      }
      
      return {
        success: false,
        status: response.status,
        ...resBody
      };
    }

    return resBody;
  } catch (error) {
    console.error("Webhook call failed:", error);
    
    console.warn("연동실패: n8n 서버가 응답하지 않거나 프록시 오류일 수 있습니다.");
    
    return { 
      success: false, 
      error: "Network or Server error",
      message: "서버와 연결할 수 없습니다. 설정을 확인해 주세요."
    };
  }
}
