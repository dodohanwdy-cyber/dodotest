# 📑 제품 요구사항 정의서 (PRD) 및 개발 인수인계서

**프로젝트 명:** 도도한콜라보 (OPCL) AI 상담 및 매니지먼트 플랫폼
**작성일:** 2026-03-20
**대상 독자:** 프론트엔드/백엔드 유지보수 및 신규 개발을 담당할 중/고급 프로그래머
**주요 아키텍처:** Next.js (App Router) 기반 서버리스 프론트엔드 + n8n 워크플로우 전면 백엔드(BaaS)

---

## 🏗 1. 시스템 아키텍처 (Architecture Overview)

본 서비스는 전통적인 RDBMS/Node.js 백엔드를 직접 구축하지 않고, 모든 비즈니스 로직과 데이터베이스 트랜잭션 수신을 **n8n 워크플로우 인스턴스**로 위임하는 구조를 가집니다.

- **프론트엔드 (Next.js)**: UI 상태 관리, 사용자 입력 검증, 화면 전환 및 n8n Webhook Endpoint를 향한 API 호출(Fetch) 담당.
- **백엔드 (n8n)**: 프론트엔드에서 전송한 JSON Payload를 Webhook 노드로 받아, 구글 스프레드시트(데이터베이스 역할) 기록, OpenAI API 호출(분석/요약 수행), 응답 구성 후 프론트엔드로 반환하는 역할. 
- **설정 파일 (`src/config/webhooks.js`)**: 모든 백엔드 엔드포인트 URL 상수를 중앙에서 매핑 관리합니다.

---

## 📂 2. 프론트엔드 라우팅 및 기능 명세

디렉토리 구조는 크게 인증(`Auth`), 내담자(`Client`), 매니저(`Manager`)로 분리됩니다.

### 2.1. 인증 및 세션 영역 (Auth)
- `/login` / `/signup`: JWT 토큰 기반 (n8n에서 토큰 발급 및 검증 추정 로직).
- `AuthContext` 등 상태 관리: 쿠키나 로컬스토리지 기반 로그인 유무 및 세션 관리.

### 2.2. 내담자 영역 (Client)
- `/client/dashboard`
  - **역할**: 현재 상담 진행 상태(status) 확인 및 확정 일정 확인.
  - **주요 기능**: 최근 상담 내역 요약 로딩, 확정(`confirmed`) 상태 시 프리미엄 '일정 확정 배너' 렌더링, 최종 완성된 상담 상세 리포트 열람 기능.
- `/client/intake`
  - **역할**: 3단계(Step S1~S3)로 구성된 아코디언 컴포넌트 형태의 다이내믹 심층 신청 폼.
  - S1 (기본정보/정책제출) → S2 (AI가 제안하는 캘린더 빈 시간 체크 및 선택) → S3 (AI 사전인터뷰 채팅 폼 로딩 및 분석 제출).
  - 현재는 중도 이탈자(pending, sec1, sec2)의 상태값에 맞춰 라우팅 컨트롤 진행. 확정(confirmed) 사용자는 View-Only 모드.

### 2.3. 매니저(상담가) 영역 (Manager)
- `/manager/dashboard`
  - **역할**: 전체 내담자 접수 현황 조회, 드래그 앤 드롭 일정 조정, 상담 취소 처리 등.
  - **주요 기능**: 특정 내담자의 상태 확정 시 '알람 발송 버튼' 클릭 -> (실제 API 부하 최소화 및 시각적/DB업데이트 처리 후 클라이언트 대시보드로 배너 렌더링 전달).
- `/manager/consultation/[id]` & `report`
  - **역할**: 실시간 상담 화면, STT 통합, 실시간 AI 요약 결과 송수신(웹소켓 또는 Webhook Long Polling).
- `/manager/completed`
  - **역할**: 완료된 전체 상담 목록 조회 및 상세 리포트 확인.

---

## 🔗 3. n8n 워크플로우 웹훅 연동 명세 (21개 핵심)

서버(n8n) 내에서 실행 중인 21개의 운영 핵심 워크플로우는 철저하게 `[분류] S/No. 기능 (엔드포인트)` 형태로 체계화되어 있습니다.
개발자는 `src/config/webhooks.js` 파일과 n8n 워크플로우 리스트(Sort by name)를 1:1로 대조하여 유지보수해야 합니다.

| n8n 워크플로우 명 (n8n에서 검색 시) | 적용 페이지 / 컴포넌트 | 기능 설명 및 역할 |
|---|---|---|
| `[Auth] 01. 사용자 인증 및 로그인 (/login-id)` | `/login` 페이지 | 입력받은 이메일/비밀번호 검증 후 토큰/세션값 반환 |
| `[Auth] 02. 회원가입 및 초기 데이터... (/signup)` | `/signup` 페이지 | 회원 생성 및 DB 시트에 초기 로우(row) 인서트 |
| `[Auth] 03. 사용자 프로필 수정 (/update-user)` | 프로필 관리 모달 | 유저네임, 연락처 등 수정 정보 DB 반영 |
| `[Client-Dash] 01. 대시보드 신청 현황 조회 (/dashboard-applications)` | `/client/dashboard` | 해당 유저의 최근 신청/진행 중인 상태 정보 로드 |
| `[Client-Dash] 02. 전체 신청 데이터 상세조회 (/application-detail)` | `/client/dashboard` | 튜토리얼 또는 과거 결과물 상세 열람 |
| `[Client-Intake] S1. 기본정보 및 정책 폼 제출 (/submit-intake)` | `/client/intake` (S1 폼) | S1 통과 시 저장, 다음 S2 스텝 개방 응답 반환 |
| `[Client-Intake] S2. 캘린더 상담 가능 일정 조회 (/time-check)` | `/client/intake` (S2 캘린더) | 실시간 매니저/회사 캘린더 DB 조회하여 남은 시간 리턴 |
| `[Client-Intake] S2. 상담 선호 일정 신청 (/time-request)` | `/client/intake` (S2 제출) | 선택한 일정을 예약 완료(`pending`/`reserved`) 상태로 변경 |
| `[Client-Intake] S3. AI 사전 인터뷰 데이터 분석 (/request-data)`| `/client/intake` (S3 채팅) | 채팅 로그 전체 데이터베이스 스태킹 및 요약 응답 |
| `[Mgr-Dash] 01. 전체 상담 신청 현황 조회 (/schedule-start)` | `/manager/dashboard` 메인 | 접수된 유저 목록과 달력 렌더링을 위한 전역 데이터 로드 |
| `[Mgr-Dash] 02. 스케줄 확정 및 알람 발송 (/send-confirmed-list-data)`| `/manager/dashboard` 배너쪽 | 스케줄을 확정 짓고 알람 트리거 (Client 배너 작동용) |
| `[Mgr-Dash] 03. 드래그앤드롭 일정 재조정 (/schedule-confirm)` | `/manager/dashboard` 드래그 | 캘린더 달력 블록 이동 시 DB 시간(타임스탬프) 즉각 Update |
| `[Mgr-Dash] 04. 스케줄 취소 처리 (/cancel-assignment)` | 대시보드 취소 버튼 | 예약 취소 시 가용 시간 원복 및 DB 변경 |
| `[Mgr-Dash] 05. 상담 전 맞춤 정책 탐색 (/policy-search)` | 매니저 툴킷 | 내담자의 조건에 맞춘 청년 정책 DB 서치 보조 |
| `[Mgr-Dash] 06. 확정 일정 초기화 처리 (/reset-schedule)` | 매니저 리셋 버튼 | 강제 일정 롤백용 |
| `[Mgr-Dash] 07. 확정 상담 내용 일괄 로드 (/send-all)` | 전역 상태 데이터 로드 | |
| `[Mgr-Dash] 08. 개별 상담 내역 즉시 로드 (/check-case)` | 상담 내역 모달 | 특정 `requestId`에 대한 요약/채팅 로그 상세 로드 |
| `[Mgr-Consult] 01. 상담 시작 전 통합 데이터 로딩 (/send-all-data)` | `/manager/consultation/[id]` | 실무 상담 진입 시 페이지 초기화 용도 |
| `[Mgr-Consult] 02. 최종 상담 요약 및 리포트 제출 (/consultation-summary)` | 실시간 AI 정리 | 상담 중 넘어가는 STT 텍스트 구조화 및 리포트 초안 발행 |
| `[Mgr-Completed] 01. 완료된 전체 상담 목록 조회 (/completed-list)` | `/manager/completed` 메인 | 완료(`completed`) 상태인 신청건 히스토리 로딩 |
| `[Mgr-Completed] 02. 완료 상담 최종 분석결과 조회 (/get-completed-detail)`| 리포트 세부 모달 | 생성된 리포트 원문 및 엑세스 링크 획득 |

---

## 🚨 4. 에러 감시 및 로깅 파이프라인 (Ops)

이번 업데이트를 통해 **n8n 백엔드 장애(Timeout, DB 락, AI 토큰 오류 등)를 개발자가 슬랙에서 즉각 모니터링할 수 있는 완전 자동화 시스템**을 부착했습니다.

1. **마스터 알림 봇**: n8n 목록 검색 시 맨 최상단(`00. 시스템 오류 마스터 알림 봇`)에 위치합니다. 
2. 이 워크플로우 안에는 `Error Trigger` 설정이 들어 있으며, 사내 지정된 Slack 웹훅으로 다음과 같은 데이터를 POST 합니다:
   - 에러가 발생한 워크플로우 이름 / 멈춘 노드 이름 / 에러 상세 메세지 / 발생 타임스탬프
3. **작동 원리**: 위 `3번 항목`에 기재된 21개의 운영 워크플로우들(총 27개 적용됨)의 Workflow Settings를 확인해 보면 `Error Workflow` 탭에 `00. 시스템 오류 마스터 알림 봇`의 ID(`U4BH9faxwXYzq8BA`)가 하드코딩 되어 있습니다.
4. **유지보수 지침**: 차후 새로운 워크플로우(기능)를 추가할 때는 반드시 해당 워크플로우 세팅(`Settings > Error Workflow`)에 마스터 봇을 지정해주어야 중앙 슬랙 관제가 이루어집니다.

---
**※ 해당 PRD는 2026-03-20 기준으로 작성되었으며, 코드 스플리팅이나 Next.js 서버 컴포넌트 최적화 등 프론트 아키텍처 작업 진행 상태에 맞춰 최신화가 필요합니다.**
