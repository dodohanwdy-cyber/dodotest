import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 간단한 인메모리 방식 Rate Limiting 저장소 (Edge 함수 인스턴스별로 캐시됨)
// 완벽한 분산 락은 아니지만 단일 인스턴스 기준 브루트포스를 방어하는 효과가 있습니다.
const ipRequestCache = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS_PER_WINDOW = 60; // 1분당 최대 60회 요청

export function middleware(req: NextRequest) {
  // 로그인 및 API 경로만 Rate Limiting 대상
  if (req.nextUrl.pathname.startsWith('/api/') || req.nextUrl.pathname === '/login') {
    // Edge 환경에서 클라이언트 IP 추출
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    const requestData = ipRequestCache.get(ip);
    
    let currentCount = 0;

    if (requestData && requestData.timestamp > windowStart) {
      currentCount = requestData.count;
    }

    if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
      // 제한 횟수 초과 시 429 Too Many Requests 응답
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(now + RATE_LIMIT_WINDOW_MS).getTime().toString(),
            'Retry-After': '60',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 캐시 업데이트 로직 (Edge Isolate 한정)
    // 메모리 누수 방지를 위해 캐시가 너무 커지면 초기화
    if (ipRequestCache.size > 10000) {
      ipRequestCache.clear();
    }
    
    ipRequestCache.set(ip, {
      count: currentCount + 1,
      timestamp: requestData && requestData.timestamp > windowStart ? requestData.timestamp : now,
    });

    // 헤더 추가
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - currentCount - 1).toString());
    response.headers.set(
      'X-RateLimit-Reset', 
      new Date((requestData?.timestamp ?? now) + RATE_LIMIT_WINDOW_MS).getTime().toString()
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/login'],
};
