# 🔒 보안 점검 및 조치 이력

**사이트**: [dodohan-ai-counsel.vercel.app](https://dodohan-ai-counsel.vercel.app)  
**최종 업데이트**: 2026-04-21

---

## 조치 이력 요약

| # | 항목 | 심각도 | 상태 | 조치일 |
|---|------|--------|------|--------|
| 1 | HSTS (Strict-Transport-Security) | ⚠️ 경고 | ✅ 조치 완료 | 2026-04-21 |
| 2 | CSP (Content-Security-Policy) | ⚠️ 경고 | ✅ 조치 완료 | 2026-04-21 |

---

## 1. HSTS (Strict-Transport-Security)

### 발견된 문제
- `Strict-Transport-Security` 헤더가 미설정
- CORS 제한으로 헤더 수집이 제한될 수 있음

### 위험성
- HSTS가 없으면 다운그레이드 공격(MITM)을 완전히 막기 어려움
- 사용자가 HTTP로 접속 시 암호화되지 않은 연결로 데이터가 노출될 수 있음

### 조치 내용
- **파일**: `next.config.js` (신규 생성)
- **방법**: Next.js `headers()` 설정을 통해 모든 경로에 보안 헤더 일괄 적용

#### 적용된 보안 헤더 목록

| 헤더 | 값 | 역할 |
|------|---|------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS 강제 (2년), 서브도메인 포함, 브라우저 preload 목록 등록 가능 |
| `X-Content-Type-Options` | `nosniff` | MIME 타입 스니핑 방지 |
| `X-Frame-Options` | `DENY` | iframe 삽입(클릭재킹) 차단 |
| `X-XSS-Protection` | `1; mode=block` | 브라우저 XSS 필터 활성화 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 외부 사이트로 리퍼러 정보 유출 방지 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | 불필요한 브라우저 기능 접근 차단 |

### 적용 코드

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // ... (기타 보안 헤더)
        ],
      },
    ];
  },
};
```

### 검증 방법
```bash
# 배포 후 헤더 확인
curl -I https://dodohan-ai-counsel.vercel.app/
```

---

## 2. CSP (Content-Security-Policy)

### 발견된 문제
- `Content-Security-Policy` 헤더가 미설정
- CORS 제한으로 헤더 수집이 제한될 수 있음

### 위험성
- CSP가 없으면 XSS(크로스 사이트 스크립팅) 공격의 피해를 크게 줄이기 어려움
- 악성 스크립트가 주입되어 사용자 데이터 탈취 가능

### 조치 내용
- **파일**: `next.config.js` (수정)
- **방법**: CSP 정책을 변수로 정의 후 헤더에 추가

#### CSP 정책 상세

| 지시어 | 값 | 역할 |
|--------|---|------|
| `default-src` | `'self'` | 기본적으로 같은 출처만 허용 |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | Next.js 내부 스크립트 실행 허용 |
| `style-src` | `'self' 'unsafe-inline' https://cdn.jsdelivr.net` | 스타일시트 + Pretendard 폰트 CDN 허용 |
| `img-src` | `'self' data: blob: https://www.transparenttextures.com https://*.supabase.co` | 이미지 소스 제한 |
| `font-src` | `'self' https://cdn.jsdelivr.net data:` | 폰트 소스 제한 |
| `connect-src` | `'self' https://*.supabase.co wss://*.supabase.co https://...railway.app https://*.vercel.app` | API 연결 허용 대상 |
| `frame-src` | `'none'` | iframe 내 콘텐츠 로드 차단 |
| `object-src` | `'none'` | Flash/Java 플러그인 차단 |
| `base-uri` | `'self'` | base 태그 제한 |
| `form-action` | `'self'` | 폼 제출 대상 제한 |
| `frame-ancestors` | `'none'` | 사이트가 iframe에 포함되는 것 차단 |
| `upgrade-insecure-requests` | - | HTTP 요청을 HTTPS로 자동 업그레이드 |

### 적용 코드

```javascript
// next.config.js
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
```

### 검증 방법
```bash
# 배포 후 CSP 헤더 확인
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i content-security
```

---

<!-- 아래에 추가 보안 조치 항목을 계속 추가합니다 -->
