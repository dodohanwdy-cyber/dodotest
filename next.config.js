/** @type {import('next').NextConfig} */

// CSP 정책 구성
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  img-src 'self' data: blob: https://www.transparenttextures.com https://*.supabase.co;
  font-src 'self' https://cdn.jsdelivr.net data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://primary-production-1f39e.up.railway.app https://*.vercel.app;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig = {
  // 운영 환경에서 브라우저용 소스맵(source map) 생성 비활성화 방지
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        // 모든 경로에 보안 헤더 적용
        source: '/(.*)',
        headers: [
          // CSP: XSS 및 데이터 인젝션 공격 방지
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
          },
          // HSTS: HTTPS 강제, 다운그레이드 공격(MITM) 방지
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // MIME 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS 필터 활성화
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // 리퍼러 정보 유출 방지
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 브라우저 기능 권한 제한
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
