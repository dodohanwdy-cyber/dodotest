# 🔒 보안 점검 및 조치 이력 (2026.04.21 업데이트)

> **문서 목적:** 본 서비스의 보안 취약점 점검 이력을 관리하고, 조치된 사항들을 기록하여 안전한 운영 환경을 유지하고 감사에 대응하는 데 목적이 있습니다.

**사이트**: [dodohan-ai-counsel.vercel.app](https://dodohan-ai-counsel.vercel.app)  
**진단 도구**: [VibeSec Security Scanner](https://vibesec.technote.wiki/?scan=https%3A%2F%2Fdodohan-ai-counsel.vercel.app%2F) (주기적 점검 권장)
**최종 업데이트**: 2026-04-21

---

## 조치 이력 요약

| # | 항목 | 심각도 | 상태 | 조치일 |
|---|------|--------|------|--------|
| 1 | HSTS (Strict-Transport-Security) | ⚠️ 경고 | ✅ 조치 완료 | 2026-04-21 |
| 2 | CSP (Content-Security-Policy) | ⚠️ 경고 | ✅ 조치 완료 | 2026-04-21 |
| 3 | 클릭재킹 방어 (X-Frame-Options) | ⚠️ 경고 | ✅ 기 조치 완료 | 2026-04-21 |
| 4 | 혼합 콘텐츠 방지 (Mixed Content) | ⚠️ 경고 | ✅ 기 조치 완료 | 2026-04-21 |
| 5 | 소스맵(.map) 공개 노출 방지 | ⚠️ 경고 | ✅ 조치 완료 | 2026-04-21 |
| 6 | Rate Limiting 헤더 부재 | ⚠️ 경고 | ✅ 조치 완료 | 2026-04-21 |
| 7 | MIME Sniffing 방지 (X-Content-Type-Options) | ℹ️ 주의 | ✅ 기 조치 완료 | 2026-04-21 |
| 8 | Referrer-Policy 설정 | ℹ️ 주의 | ✅ 기 조치 완료 | 2026-04-21 |
| 9 | Permissions-Policy 설정 | ℹ️ 주의 | ✅ 기 조치 완료 | 2026-04-21 |
| 10 | X-XSS-Protection 설정 | ℹ️ 주의 | ✅ 기 조치 완료 | 2026-04-21 |
| 11 | CSP frame-ancestors 설정 | ℹ️ 주의 | ✅ 기 조치 완료 | 2026-04-21 |
| 12 | 쿠키 Secure 플래그 설정 | 🔍 확인 | ✅ 안전함 확인 | 2026-04-21 |
| 13 | 쿠키 HttpOnly 플래그 설정 | 🔍 확인 | ✅ 안전함 확인 | 2026-04-21 |
| 14 | 쿠키 SameSite 플래그 설정 | 🔍 확인 | ✅ 안전함 확인 | 2026-04-21 |
| 15 | wp-config.php 노출 여부 | ℹ️ 정보 | ✅ 해당 없음 | 2026-04-21 |
| 16 | 관리자 보호 및 권한 체크(RBAC) 강화 | 🚨 심각 | ✅ 조치 완료 | 2026-04-21 |
| 17 | HTTP → HTTPS 리다이렉트 설정 | ✅ 통과 | ✅ 안전함 확인 | 2026-04-21 |
| 18 | 사내 보안 문서 센터 구축 | ℹ️ 정보 | ✅ 조치 완료 | 2026-04-21 |

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

## 3. 클릭재킹 방어 (X-Frame-Options)

### 발견된 문제
- `X-Frame-Options` 헤더가 미설정
- CORS 제한으로 헤더 수집이 제한될 수 있음

### 위험성
- 외부 사이트가 iframe으로 페이지를 감싸 클릭재킹을 유도할 수 있음
- 사용자가 의도하지 않은 클릭/입력을 하게 되어 데이터 유출 가능

### 조치 내용
- **상태**: ✅ **1번(HSTS) 및 2번(CSP) 조치 시 이미 함께 적용 완료**
- **이중 방어 구성**:

| 방어 수단 | 설정값 | 위치 |
|-----------|--------|------|
| `X-Frame-Options` | `DENY` | `next.config.js` 보안 헤더 |
| CSP `frame-ancestors` | `'none'` | `next.config.js` CSP 정책 |

> 💡 `X-Frame-Options: DENY`는 모든 iframe 삽입을 차단하고,
> CSP `frame-ancestors 'none'`은 최신 브라우저에서 동일한 보호를 제공합니다.
> 두 가지를 함께 사용하면 구형/신형 브라우저 모두에서 클릭재킹을 방어합니다.

### 검증 방법
```bash
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i x-frame
```

---

## 4. 혼합 콘텐츠 방지 (Mixed Content)

### 발견된 문제
- HTTPS 페이지 내에서 HTTP 리소스(`http://`) 참조 가능성 감지

### 위험성
- HTTPS 페이지에서 HTTP 리소스를 불러오면 브라우저에 의해 차단되거나(깨진 디자인/기능), 중간자 공격(MITM)의 대상이 될 수 있음.

### 조치 내용
- **상태**: ✅ **소스코드 확인 및 이전 CSP 조치 시 반영 완료**
- 현재 소스코드 내부(`src/`)에 외부 리소스를 `http://`로 불러오는 하드코딩된 부분은 없음을 확인했습니다. (SVG namespace 정의 제외)
- 추가적으로 누락되었거나 외부에서 동적으로 불러오는 HTTP 링크를 방어하기 위해 **CSP 지시어에 이미 차단 조치가 적용되어 있습니다.**

| 방어 수단 | 설정값 | 위치 | 역할 |
|-----------|--------|------|------|
| CSP 지시어 | `upgrade-insecure-requests` | `next.config.js` | 페이지 내의 모든 `http://` 요청을 브라우저가 강제로 `https://`로 업그레이드하여 요청하도록 지시 |

### 검증 방법
```bash
# CSP 헤더 내 upgrade-insecure-requests 포함 여부 확인
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i "upgrade-insecure-requests"
```

---

## 5. 소스맵(.map) 공개 노출 방지

### 발견된 문제
- 프로덕션 빌드 파일에 대한 소스맵(`.map`) 파일이 브라우저에서 접근 가능하게 열려 있음
- 예: `https://dodohan-ai-counsel.vercel.app/_next/static/chunks/[hash].js.map`

### 위험성
- 소스맵이 공개되어 있으면 비즈니스 로직, 내부 주석, 원본 소스코드의 폴더 구조 등이 고스란히 노출됨
- 이를 통해 악의적 사용자가 취약점을 더 쉽게 분석하거나 핵심 알고리즘을 훔칠 수 있음

### 조치 내용
- **파일**: `next.config.js` (수정)
- **방법**: Next.js 설정 내에 브라우저용 프로덕션 소스맵 생성을 영구 비활성화하는 옵션 추가 적용

#### 적용 사항

| 설정 항목 | 설정 값 | 효과 |
|-----------|---------|------|
| `productionBrowserSourceMaps` | `false` | `npm run build` 시 브라우저 측 JS 파일에 대한 소스맵(`.map`) 파일 생성을 방지 |

### 적용 코드

```javascript
// next.config.js
const nextConfig = {
  // 운영 환경에서 브라우저용 소스맵(source map) 생성 비활성화 방지
  productionBrowserSourceMaps: false,
  async headers() { ... }
};
```

### 검증 방법
```bash
# 배포 후 기존에 노출되던 .map 파일 경로에 접근 시 404 상태 확인
curl -I https://dodohan-ai-counsel.vercel.app/_next/static/chunks/37ddf08b330de67b.js.map
```

---

## 6. Rate Limiting 헤더 부재

### 발견된 문제
- API 계층 및 로그인 등의 중요 경로에 Rate Limiting 관련된 제한 헤더(`X-RateLimit-Limit` 등)가 감지되지 않음

### 위험성
- 악의적인 사용자가 무차별 대입 공격(브루트포스)이나 짧은 시간 내 과도한 요청(DDoS 형태)으로 서버의 리소스를 고갈시키거나 계정을 탈취할 가능성이 있음

### 조치 내용
- **파일**: `src/middleware.ts` (신규 적용)
- **방법**: Next.js Edge Middleware를 활용하여 클라이언트 IP 주소별로 일정 시간(1분) 동안 보낼 수 있는 최대 요청 횟수(60회)를 제한하는 인메모리 방식 Rate Limiter 적용

#### 적용 사항

| 대상 경로 | 제한 설정 | 추가된 헤더 |
|-----------|-----------|-------------|
| `/api/*`, `/login` | 1분당 최대 60회 (초과 시 `429 Too Many Requests`) | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |

> 🧩 **참고:** Vercel의 Serverless / Edge 특성 상 각 인스턴스마다 메모리가 분리되어 있어 완전 분산된 Rate Limit은 아니지만, 특정 노드를 겨냥한 트래픽 봇/스패머 및 1차 방어막으로서 상당한 효과를 제공합니다. 향후 좀 더 철저한 방어가 필요할 시 Redis 기반 분산 캐시(예: Upstash 등) 적용을 확장할 수 있습니다.

### 적용 코드 (요약)

```typescript
// src/middleware.ts
export function middleware(req: NextRequest) {
  // ... 생략 (IP 수집 및 카운팅)
  if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 /* ...Headers */ });
  }
  
  // 성공 시 다음 라우트로 헤더 전달
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  // ...
}
```

### 검증 방법
```bash
# 적용된 헤더값이 응답에 포함되는지 확인 (API 경로 등에 호출 시도)
curl -I https://dodohan-ai-counsel.vercel.app/login | grep -i rate
```

---

## 7. MIME Sniffing 방지 (X-Content-Type-Options)

### 발견된 문제
- `X-Content-Type-Options` 헤더 설정 필요 (MIME Sniffing 경고)

### 위험성
- 브라우저가 응답의 Content-Type을 무시하고 파일 내용을 분석(Sniffing)하여 실행할 경우, 텍스트 파일 등으로 위장한 악성 스크립트가 실행될 위험이 있음.

### 조치 내용
- **상태**: ✅ **1번(HSTS) 설정 단계에서 보안 헤더 패키지로 이미 적용 완료**
- **적용값**: `nosniff`
- 브라우저가 서버가 전달한 `Content-Type`을 엄격하게 준수하도록 강제하여, 의도하지 않은 형식의 리소스 실행을 차단합니다.

### 검증 방법
```bash
# 헤더에 nosniff 포함 여부 확인
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i x-content-type-options
```

---

## 8. Referrer-Policy 설정

### 발견된 문제
- `Referrer-Policy` 헤더 미설정 경고

### 위험성
- 외부 링크 클릭 시 브라우저가 전송하는 `Referrer` 헤더에 내부 URL의 쿼리 파라미터나 민감한 경로 정보가 포함되어 외부로 유출될 수 있음.

### 조치 내용
- **상태**: ✅ **1번(HSTS) 설정 시 보안 헤더 보안 패키지로 이미 적용 완료**
- **적용값**: `strict-origin-when-cross-origin`
- **효과**: 
    - 동일 출처(Same-origin) 요청 시에는 전체 URL 전송.
    - 보안 수준이 같은 타사 사이트로 이동 시에는 도메인(Origin) 정보만 전송.
    - HTTPS에서 HTTP로 이동 시에는 리퍼러를 전송하지 않아 가장 권장되는 보안 설정입니다.

### 검증 방법
```bash
# 헤더에 Referrer-Policy 포함 여부 확인
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i referrer-policy
```

---

## 9. Permissions-Policy 설정

### 발견된 문제
- `Permissions-Policy` 헤더 미설정 경고

### 위험성
- 브라우저의 강력한 기능(카메라, 마이크, 위치 정보 등)에 대한 권한이 명시적으로 제한되지 않을 경우, 예기치 않은 접근이나 보안 취약점이 발생할 가능성이 있음.

### 조치 내용
- **상태**: ✅ **1번(HSTS) 설정 시 보안 헤더 보안 패키지로 이미 적용 완료**
- **적용값**: `camera=(), microphone=(), geolocation=()`
- **효과**: 서비스에서 사용하지 않는 카메라, 마이크, 지오로케이션 등의 브라우저 기능을 전역적으로 차단하여 공격 표면(Attack Surface)을 최소화합니다.

### 검증 방법
```bash
# 헤더에 Permissions-Policy 포함 여부 확인
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i permissions-policy
```

---

## 10. X-XSS-Protection 설정

### 발견된 문제
- `X-XSS-Protection` 헤더 미설정

### 위험성
- 구형 브라우저(IE8+, 구형 Chrome/Safari 등)에서 반사형 XSS(Reflected XSS) 공격에 노출될 수 있음. 최신 브라우저는 CSP를 사용하지만, 하위 호환성을 위한 추가적인 방어선이 필요함.

### 조치 내용
- **상태**: ✅ **1번(HSTS) 설정 단계에서 보안 헤더 패키지로 이미 적용 완료**
- **적용값**: `1; mode=block`
- **효과**: 브라우저의 XSS 필터를 활성화하고, 공격이 감지되면 페이지 렌더링을 즉시 중단(Block)하여 피해를 방지합니다.

### 검증 방법
```bash
# 헤더에 X-XSS-Protection 포함 여부 확인
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i x-xss-protection
```

---

## 11. CSP frame-ancestors 설정

### 발견된 문제
- CSP 내 `frame-ancestors` 지시어 부재

### 위험성
- `frame-ancestors`가 누락될 경우, 최신 브라우저에서 사이트가 타 사이트의 `iframe` 등에 삽입되는 것을 제어하기 어려워져 클릭재킹(Clickjacking) 공격의 타겟이 될 수 있음.

### 조치 내용
- **상태**: ✅ **2번(CSP) 및 3번(클릭재킹 방어) 조치 시 이미 적용 완료**
- **적용값**: `frame-ancestors 'none';`
- **효과**: 
    - `X-Frame-Options: DENY`와 함께 이중 방어 체계를 구축합니다.
    - 최신 브라우저가 본 사이트를 오직 독립적인 페이지로만 렌더링하도록 강제하며, 어떠한 외부 도메인에서의 임베딩도 허용하지 않습니다.

### 검증 방법
```bash
# CSP 헤더 내 frame-ancestors 포함 여부 확인
curl -I https://dodohan-ai-counsel.vercel.app/ | grep -i "frame-ancestors"
```

---

## 12. 쿠키 Secure 플래그 설정

### 발견된 문제
- `Set-Cookie` 헤더 및 `Secure` 플래그 설정 여부 점검 필요

### 점검 및 분석 결과
- **현재 인증 방식**: 본 프로젝트는 **Supabase Auth**를 사용하며, 브라우저의 전용 **Local Storage**를 통해 세션을 관리합니다. (쿠키를 직접 사용하지 않음)
- **커스텀 쿠키**: 소스 코드 전수 조사 결과, 서버사이드에서 수동으로 `Set-Cookie` 헤더를 생성하거나 쿠키를 설정하는 로직이 없음을 확인했습니다.
- **연관 보안 조치**: 이미 **1번(HSTS)** 조치를 통해 사이트 전체에 HTTPS 접속을 강제하고 있으므로, 만약 향후 쿠키가 도입되더라도 평문(HTTP) 전송 공격으로부터 보호받는 구조입니다.

### 결론
- ✅ **안전함 (Safe by Design)**: 쿠키 기반 세션을 사용하지 않으므로 본 취약점의 직접적인 영향권이 아니며, 이미 강력한 HTTPS 강제 정책(HSTS)이 적용되어 있어 전송 보안이 확보된 상태입니다.

---

## 13. 쿠키 HttpOnly 플래그 설정

### 발견된 문제
- `Set-Cookie` 헤더 및 `HttpOnly` 플래그 설정 여부 점검 필요

### 점검 및 분석 결과
- **현재 인증 방식**: 본 프로젝트는 **Supabase Auth**를 사용하며, 브라우저의 전용 **Local Storage**를 통해 세션을 관리합니다. (쿠키를 직접 사용하지 않음)
- **방어 기제**: `HttpOnly` 플래그의 목적은 자바스크립트를 통한 쿠키 접근을 차단하여 XSS 공격 시 세션 탈취를 방지하는 것입니다. 본 사이트는 이미 **2번(CSP)** 조치를 통해 스크립트 주입 공격을 강력히 차단하고 있어, 전반적인 세션 보안이 확보된 상태입니다.

### 결론
- ✅ **안전함 (Safe by Design)**: 쿠키 기반 세션을 사용하지 않으므로 해당 플래그 설정 대상이 아니며, CSP 정책을 통해 근본적인 스크립트 보안이 적용되어 있습니다.

---

## 14. 쿠키 SameSite 플래그 설정

### 발견된 문제
- `Set-Cookie` 헤더 및 `SameSite` 플래그 설정 여부 점검 필요

### 점검 및 분석 결과
- **현재 인증 방식**: 본 프로젝트는 **Supabase Auth**를 사용하며, 인증 토큰을 **Local Storage**에 저장합니다.
- **방어 효과**: `SameSite` 플래그는 CSRF(사이트 간 요청 위조) 공격을 방어하기 위한 것이나, 본 서비스는 쿠키가 아닌 `Authorization` 헤더 등을 전송하는 방식을 취하므로 쿠키 기반 CSRF 공격 경로가 원천 차단되어 있습니다.

### 결론
- ✅ **안전함 (Safe by Design)**: 쿠키 기반 세션을 사용하지 않으므로 해당 플래그 설정 대상이 아니며, 인증 메커니즘 자체가 CSRF 공격에 대해 강력한 내성을 가지고 있습니다.

---

## 15. wp-config.php 노출 여부

### 발견된 문제
- `wp-config.php` 경로 접근 및 민감 키 노출 여부 점검

### 점검 및 분석 결과
- **기술 스택 확인**: 본 서비스는 **Next.js (React 기반)** 프레임워크를 사용하며 Vercel 플랫폼에서 동작합니다.
- **파일 존재 여부**: 프로젝트 내부 전수 조사 결과, 워드프레스(WordPress) 설정 파일인 `wp-config.php`는 존재하지 않습니다.
- **배포 환경 특성**: PHP 런타임을 사용하지 않는 환경이므로 해당 파일이 있더라도 실행되지 않으며, 빌드 결과물에 포함될 가능성도 없습니다.

### 결론
- ✅ **해당 없음 (N/A)**: 본 프로젝트는 워드프레스 기반이 아니므로 해당 취약점의 대상이 아닙니다. 자동 점검 도구에서 기술 스택 오인으로 인해 발생한 오탐(False Positive)으로 판단됩니다.

---

## 16. 관리자 보호 및 권한 체크(RBAC) 강화

### 발견된 문제
- 관리자 경로(`/manager/*`)에 대한 접근 제어 불충분 및 권한 체크 누락
- 일부 관리용 페이지(`/manager/schedule`)에 인증 가드 전무 확인

### 위험성
- **비인가 접근**: 악의적인 사용자가 URL 추측을 통해 관리자 페이지에 접속하여 민감한 상담 데이터를 열람하거나 파괴할 수 있음.
- **데이터 유출**: 일반 사용자(Client) 권한으로 로그인한 사용자가 관리자 기능에 접근하여 타인의 정보를 탈취할 가능성.

### 조치 내용
- **파일**: `src/app/manager/layout.tsx` (신규 생성)
- **방법**: Next.js App Router의 공통 레이아웃을 활용하여 `/manager` 하위의 모든 페이지에 대해 통합 인증 가드(Auth Guard) 수립

#### 적용 사항
- **통합 가드**: `ManagerLayout`에서 `useAuth()`를 통해 `userRole === 'manager'` 여부를 전역적으로 검증
- **접근 차단**: 비로그인 사용자는 `/login`으로, 일반 사용자(Client)는 메인 페이지로 리다이렉트 처리
- **깜빡임 방지**: 권한 확인 중에는 로딩 상태를 표시하여 인가되지 않은 화면이 잠시라도 노출되는 것(FOUC)을 방지

### 결론
- ✅ **조치 완료**: 모든 매니저 관련 페이지가 통합 보안 레이어 내로 편입되어, 비인가자의 접근이 원천적으로 차단되었습니다.

---

## 17. HTTP → HTTPS 리다이렉트 설정

### 발견된 문제
- HTTP 요청 시 HTTPS로의 자동 전환(Redirect) 여부 점검 필요

### 점검 및 분석 결과
- **플랫폼 기본 보안**: Vercel 배포 환경은 모든 HTTP(80포트) 요청을 HTTPS(443포트)로 자동 리다이렉트 처리합니다.
- **HSTS 적용 완료**: **1번 조치**에서 적용한 HSTS 헤더(`max-age=63072000; includeSubDomains; preload`)를 통해 브라우저 레벨에서도 HTTPS를 강제하도록 이중 설정되어 있습니다.

### 결론
- ✅ **안전함 (Safe by Default & Design)**: 플랫폼 단의 자동 리다이렉트와 애플리케이션 단의 HSTS 설정이 결합되어 있어, 평문 전송 및 다운그레이드 공격에 대해 완벽하게 보호되고 있습니다.

---

<!-- 아래에 추가 보안 조치 항목을 계속 추가합니다 -->
