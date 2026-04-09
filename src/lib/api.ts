import { WEBHOOK_URLS } from "@/config/webhooks";

export async function postToWebhook(url: string, data: any) {
  if (!url) {
    console.error("Webhook URL is not defined.");
    return { success: false, error: "Configuration missing" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const resBody = isJson ? await response.json() : null;

    console.group(`🌐 API Request: ${url}`);
    console.log("Payload:", data);
    console.log("Status:", response.status);
    console.log("Response Body:", resBody);
    console.groupEnd();

    if (!response.ok) {
      // 응답 본문에 성공 표시가 있는지 확인 (n8n이 500 상태로 성공 응답을 보낼 수 있음)
      const isBodySuccess = resBody && (resBody.status === "success" || resBody.code);
      
      if (response.status === 500 && !isBodySuccess) {
        // 진짜 서버 오류인 경우에만 로그 출력 (alert 제거)
        console.error("🚨 [n8n 서버 오류] n8n 워크플로우 내부에서 에러가 발생했습니다.");
      }
      
      // 400, 401 등의 클라이언트 에러는 본문과 함께 반환하여 페이지에서 처리할 수 있게 함
      return {
        success: false,
        status: response.status,
        ...resBody
      };
    }

    return resBody;
  } catch (error) {
    console.error("Webhook call failed:", error);
    
    // 개발/테스트 편의를 위해 통신 실패 시 알림
    console.warn("연동실패: n8n 서버가 응답하지 않거나 워크플로우가 비활성화 상태일 수 있습니다.");
    
    return { 
      success: false, 
      error: "Network or Server error",
      message: "서버와 연결할 수 없습니다. n8n 설정을 확인해 주세요."
    };
  }
}
