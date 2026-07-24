# 🚀 열고닫기(OPCL) 청년 정책 상담 플랫폼 - 프로젝트 인수인계 문서 (Antigravity AI용)

> **문서 목적**: 본 문서는 다른 구글 계정으로 로그인한 Antigravity AI 어시스턴트가 프로젝트의 맥락, 기술 스택, 핵심 기능, 환경 변수, 운영 규칙을 완벽히 이해하고 즉시 개발을 이어받을 수 있도록 작성되었습니다.

---

## 1. 📌 프로젝트 개요 및 핵심 정체성
* **프로젝트명**: dodohan-collabo (열고닫기 OPCL 청년 정책 콜라보 플랫폼)
* **목적**: 청년 내담자의 고민을 3단계 SFBT(해결중심 단기치료) AI 챗봇으로 파악하고, 전문 상담사 연결 및 n8n/Supabase 기반 상담 리포트를 제공하는 서비스
* **주요 사용자**:
  1. **청년 내담자 (Client)**: 3단계 AI 인테이크 상담 진행, 상담 완료 신청
  2. **전문 상담사 (Manager)**: 상담 대시보드, 내담자 상세 정보, STT 오디오 녹음 분석 및 리포트 작성

---

## 2. 🛠️ 기술 스택 및 구조 (Tech Stack)
* **Framework**: Next.js 16.1.6 (App Router, Turbopack)
* **Language**: TypeScript, React 19 (latest)
* **Styling**: Vanilla CSS, Tailwind CSS (v3.4.1), Lucide React
* **AI & LLM**:
  * **Primary LLM**: Google Gemini API (`gemini-2.5-flash`) via `@google/generative-ai`
  * **Fallback LLM**: Local EXAONE 3.5 (`https://gastritic-debbi-unbeneficently.ngrok-free.dev/v1`)
* **Database & BaaS**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
* **Workflow Automation**: n8n (`NEXT_PUBLIC_N8N_BASE_URL`, `N8N_API_KEY`)
* **Deployment**: Vercel (GitHub `origin/main` 자동 연동)

---

## 3. 🤖 핵심 기능 및 시스템 아키텍처

### 3.1. SFBT 3단계 AI 인테이크 챗봇 (`src/app/api/chat/route.ts`)
* **Gemini 모델**: `gemini-2.5-flash`
* **동적 단계별 프롬프트 (SFBT 해결중심 단기치료 기법)**:
  - **1단계 (문제 정의)**: 내담자의 고민 공감 후 *"현재 가장 시급하게 해결하고 싶은 구체적인 어려움"* 1개 질문
  - **2단계 (예외/자원 탐색)**: 고민 공감 후 *"이 문제를 해결하기 위해 그동안 스스로 시도해본 현실적인 방법"* 1개 질문
  - **3단계 (목표 설정/기적 질문)**: 시도 격려 후 *"이번 상담을 통해 내일 당장 아주 작은 부분이라도 달라지길 원하는 점"* 1개 질문
  - **4단계 (마무리)**: 공감 인사 후 전문 상담사 신청 완료 안내 (질문 금지)

### 3.2. STT 음성 분석 및 화자 분리 (`src/app/api/stt/route.ts`)
* 오디오 파일 버퍼를 Base64로 변환하여 `gemini-2.5-flash` 멀티모달 오디오 기능 전달
* [상담사]와 [내담자] 2인 화자 분리(Diarization) 및 한국어 전사 텍스트 반환

### 3.3. n8n 워크플로우 통신 보안 (`src/lib/n8nClient.ts`)
* `n8nFetch` 유틸리티를 통해 `X-Api-Key` (`N8N_API_KEY`) 헤더 전송
* 웹훅 및 데이터 동기화 연동

---

## 4. 🔑 주요 환경 변수 (`.env.local` 및 Vercel 설정)
```env
GOOGLE_API_KEY=<YOUR_GOOGLE_API_KEY>
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
GOOGLE_SHEETS_SPREADSHEET_ID=1T9JUBDbx-t4EpYzl-iFGBbC4Rmw0zjwNxOrn6VLS0oY

NEXT_PUBLIC_SUPABASE_URL=https://fwqvsxnrwhiumjfiqavg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_2ko9nPjVSzxhYJLwMoylVQ_LRslc6HM

NEXT_PUBLIC_N8N_API_KEY=Ehehgks_counsel_2026_!@
NEXT_PUBLIC_N8N_BASE_URL=https://primary-production-1f39e.up.railway.app/
```

---

## 5. 📏 AI 어시스턴트 작동 규칙 (User Rules)
1. **대화 언어**: 모든 대화 및 처리내용은 한국어를 기본으로 제공한다.
2. **의견 요청 시**: 2개 이상의 다양한 방안/사례/아이디어를 제안한다.
3. **대화창 제목**: 생성 날짜 및 시간(`YYYY-MM-DD HH:mm`)을 기준으로 제목을 설정한다.
4. **코드 변경 규칙**: 단순 증상 치료(Superficial Patch)를 금지하며, 수정 후 반드시 빌드 검사(`cmd.exe /c "npm run build"`)를 통해 동작을 검증한다.

---

## 6. 🔄 새 계정 접속 후 AI 시동(Start-up) 프롬프트 템플릿
새 구글 계정으로 Antigravity를 켜신 후, 첫 메시지에 아래 텍스트를 그대로 입력하세요:

```markdown
이 프로젝트는 '열고닫기 OPCL 청년 정책 상담 플랫폼'입니다.
프로젝트 루트의 `PROJECT_HANDOVER.md` 파일과 코드베이스를 읽고 전체 구조, SFBT 챗봇 로직, Gemini 2.5 Flash 모델 설정, n8n 연동 환경을 파악한 뒤 인사를 해줘.
```
