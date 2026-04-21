# 🔒 보안 점검 및 조치 이력

**사이트**: [dodohan-ai-counsel.vercel.app](https://dodohan-ai-counsel.vercel.app)  
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

<!-- 아래에 추가 보안 조치 항목을 계속 추가합니다 -->
