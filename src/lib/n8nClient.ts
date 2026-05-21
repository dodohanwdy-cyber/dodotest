// src/lib/n8nClient.ts

const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || process.env.N8N_BASE_URL || '';
const N8N_API_KEY = process.env.NEXT_PUBLIC_N8N_API_KEY || process.env.N8N_API_KEY || '';

/**
 * n8n 웹훅 API 호출을 위한 전용 fetch 클라이언트
 * 
 * - 기본 baseURL을 지원하며, 전체 URL이 들어올 경우 그대로 사용합니다.
 * - 지정된 보안 도메인(railway.app 포함 또는 N8N_BASE_URL)으로 요청 시 
 *   자동으로 'X-Api-Key' 헤더에 환경 변수 값을 추가합니다.
 */
export async function n8nFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // endpoint가 http로 시작하면 그대로 사용, 아니면 BASE_URL과 결합
  const url = endpoint.startsWith('http') ? endpoint : `${N8N_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  // 보안 도메인 제한 (Whitelisting) 검사
  // 오직 https://primary-production-1f39e.up.railway.app/ 로 시작하는 목적지에만 보안 헤더 포함
  const ALLOWED_DOMAIN = 'https://primary-production-1f39e.up.railway.app/';
  const isSecureDomain = url.startsWith(ALLOWED_DOMAIN) || (N8N_BASE_URL && url.startsWith(N8N_BASE_URL));

  const headers = new Headers(options.headers || {});
  
  // JSON 기본 처리 (필요시 options에서 덮어쓸 수 있도록 처리 가능하지만 기본값으로 셋팅)
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  
  // 보안 도메인에 해당할 경우에만 API Key 헤더 추가
  if (isSecureDomain && N8N_API_KEY) {
    headers.set('X-Api-Key', N8N_API_KEY);
  }

  // fetch 요청 실행
  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
