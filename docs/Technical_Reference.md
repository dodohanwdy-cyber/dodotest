# 열고닫기(OPCL) 기술 레퍼런스 (Technical Reference) - 2026.04.21 최신화

> **문서 목적:** 프로젝트에 사용된 기술 스택, 라이브러리, 코딩 컨벤션 및 주요 라이브러리 명세를 정리하여 개발 기준을 일원화하는 데 목적이 있습니다.

본 문서는 서비스의 실 서버 반영 상태에 따른 기술적 세부 명세를 기록합니다. n8n 백엔드 웹후크 연동 규격, 보안 로직, 비동기 상태 관리 규격을 포함합니다.

---

## 📋 n8n 백엔드 워크플로우 목록 명세

전체 21+ 운영 워크플로우는 `[분류] S/No. 화면상 기능명 (엔드포인트)` 형태로 체계화되어 n8n 대시보드 이름순 정렬에 맞추어 관리됩니다.

### 1. 전역 및 시스템 수준
- `00. 시스템 오류 마스터 알림 봇` : 타 워크플로우 장애 발생 시 슬랙으로 쏴주기 위한 중앙 관제 봇 (API 엔드포인트 미존재, n8n `errorWorkflow`에 연결되어 작동)

### 2. 내담자 서비스 (Client Side)
- `[Client-Dash] 01. 대시보드 신청 현황 조회 (/dashboard-applications)`
- `[Client-Dash] 02. 전체 신청 데이터 상세조회 (/application-detail)`
- `[Client-Intake] S1. 기본정보 및 정책 폼 제출 (/submit-intake)`
- `[Client-Intake] S2. 캘린더 상담 가능 일정 조회 (/time-check)`
- `[Client-Intake] S2. 상담 선호 일정 신청 (/time-request)`
- `[Client-Intake] S3. AI 사전 인터뷰 데이터 분석 (/request-data)`

### 3. 매니저(상담가) 서비스 (Manager Side)
- `[Mgr-Dash] 01. 전체 상담 신청 현황 조회 (/schedule-start)`
- `[Mgr-Dash] 02. 스케줄 확정 및 알람 발송 (/send-confirmed-list-data)`
- `[Mgr-Dash] 03. 드래그앤드롭 일정 재조정 (/schedule-confirm)`
- `[Mgr-Dash] 04. 스케줄 취소 처리 (/cancel-assignment)`
- `[Mgr-Dash] 05. 상담 전 맞춤 정책 탐색 (/policy-search)`
- `[Mgr-Dash] 06. 확정 일정 초기화 처리 (/reset-schedule)`
- `[Mgr-Dash] 07. 확정 상담 내용 일괄 로드 (/send-all)`
- `[Mgr-Dash] 08. 개별 상담 내역 즉시 로드 (/check-case)`
- `[Mgr-Consult] 01. 상담 시작 전 통합 데이터 로딩 (/send-all-data)`
- `[Mgr-Consult] 02. 최종 상담 요약 및 리포트 제출 (/consultation-summary)`
- `[Mgr-Completed] 01. 완료된 전체 상담 목록 조회 (/completed-list)`
- `[Mgr-Completed] 02. 완료 상담 최종 분석결과 조회 (/get-completed-detail)`

*(※ 기타 테스트 빌드 및 Draft 모드인 비운영 워크플로우들은 이름 앞에 `[z-기타]` 접두사가 붙어 정렬 시 맨 아래 위치함)*

---

## 🏗️ 시스템 아키텍처 및 처리 로직

### 1. 에러 관제망 (Error Monitoring)
- 전 운영 워크플로우(약 27개)의 Settings > Error Workflow 속성이 `00. 시스템 오류 마스터 알림 봇(ID: U4BH9faxwXYzq8BA)`으로 연결되어 있음.
- `lastNodeExecuted` 정보 및 `error.message`가 슬랙 중앙 채널로 웹훅 됨.

### 2. 비동기 AI 분석 흐름
1. 프론트엔드에서 API(Webhook) 전송 즉시 프론트엔드는 블로킹 없이 대기 및 이동 (타임아웃 방지 목적으로 n8n의 Respond to Webhook 노드 적극 활용).
2. n8n 워크플로우에서 백그라운드 AI 분석 및 구글 시트 업데이트 수행 (일부 무거운 로직의 경우 10~20분 소요).

### 3. 보안 접근 및 세션 관리
- **인증 시스템**: **Supabase Auth**를 통해 이메일/비밀번호 인증을 처리하며, 세션은 Supabase Client SDK로 전역 상태(`AuthContext`)로 관리됩니다.
- **내담자 리포트 (`/report/[id]`)**: 
  - 로그인된 세션 이메일이 리포트의 이메일 정보와 일치할 때만 열람이 허가되는 서버사이드 가드가 적용되어 있습니다.
- **매니저 보호 (`/manager/*`)**: 
  - `ManagerLayout` 통합 가드를 통해 `userRole === 'manager'`가 아닌 사용자의 접근을 원천 차단합니다.
  - 비인가 접근 시 `/login` 또는 메인 페이지로 즉각 리다이렉트됩니다.

---

## 🛠️ 유지보수 코드 베이스 매핑
- Frontend API 통신 주소 맵: `src/config/webhooks.js` (신규 Webhook 추가 시 이곳 상수에 먼저 등록할 것)
- 마크다운 렌더링 라이브러리: `react-markdown`, `remark-gfm` (사내 문서 센터 구현용)
- n8n 서버: `primary-production-1f39e.up.railway.app`
