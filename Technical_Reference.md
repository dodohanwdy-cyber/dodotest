# 열고닫기(OPCL) 기술 레퍼런스 (Technical Reference) - 2024.03.12 최신화

본 문서는 서비스의 실 서버 반영 상태에 따른 기술적 세부 명세를 기록합니다. n8n 웹후크 연동, 보안 로직, 비동기 상태 관리 규격을 포함합니다.

---

## 📋 n8n 웹후크 연동 리워드

### 1. 내담자 서비스 (Client Side)
- **LOGIN**: 로그인 처리 (`/webhook/login-id`)
- **SIGNUP**: 회원가입 처리 (`/webhook/signup`)
- **UPDATE_USER**: 프로필 수정 (`/webhook/update-user`)
- **SUBMIT_INTAKE**: 인테이크 폼 Section 1 저장 (`/webhook/submit-intake`)
- **GET_CALENDAR**: 예약 일정 조회 (`/webhook/time-check`)
- **CHOOSE_SCHEDULE**: 일정 확정 (`/webhook/time-request`)
- **AI_CHAT_ANALYZE**: 채팅 분석 최종 저장 (`/webhook/request-data`)
- **GET_DASHBOARD_APPLICATIONS**: 대시보드 신청 내역 조회 (`/webhook/dashboard-applications`)
- **CANCEL_ASSIGNMENT**: 상담 취소 (`/webhook/cancel-assignment`)

### 2. 상담사 서비스 (Manager Side)
- **GET_MANAGER_DASHBOARD**: 전체 상담 현황 조회 (`/webhook/schedule-start`)
- **GET_DASHBOARD_PREVIEW**: 확정 목록 조회 (`/webhook/send-confirmed-list-data`)
- **ADJUST_SCHEDULE**: 일정 확정/상태 변경 (`/webhook/schedule-confirm`)
- **GET_COMPLETED_LIST**: 완료된 전체 상담 내역 조회 (`/webhook/completed-list`)
- **START_CONSULTATION**: 상담 시작 전체 데이터 로드 (`/webhook/send-all-data`)
- **CONSULTATION_SUMMARY**: 상담 요약 및 STT 결과 저장 (`/webhook/consultation-summary`)
- **SUBMIT_FINAL_REPORT**: 최종 리포트 링크 생성 및 상태 업데이트 (`/webhook/consultation-summary`)
  - *Note: 두 웹후크는 동일 엔드포인트를 공유하거나 유사한 데이터 객체를 다룹니다.*
- **GET_COMPLETED_DETAIL**: 완료된 상담의 최종 분석 결과 조회 (`/webhook/get-completed-detail`)
- **CHECK_CASE**: 분석 데이터 즉시 준비 요청 (`/webhook/check-case`)

---

## 🏗️ 시스템 아키텍처 및 처리 로직

### 1. 비동기 AI 분석 흐름
1. 상담사 페이지에서 '상담 종료' 클릭 시 `CONSULTATION_SUMMARY` 웹후크 호출.
2. 데이터 전송 즉시 프론트엔드는 다음 페이지로 이동 (타임아웃 방지).
3. n8n 워크플로우에서 AI 분석 및 구글 시트 업데이트 수행 (평균 10~20분 소요).
4. 분석 완료 시 상태값이 `completed` -> `analyzed`로 변경되어 대시보드에 노출.

### 2. 보안 접근 및 세션 관리
- **내담자 리포트 (`/report/[id]`)**: 
  - 로그인 세션 자동 감지 로직 적용.
  - 로그인된 이메일(`user.email`)이 리포트의 `email` 또는 `user_email`과 일치하면 즉시 자동 승인.
  - 일치하지 않거나 비로그인 시 접근 차단 및 로그인 유도.
- **새 탭 접근**: 대시보드에서 `target="_blank"` 속성을 통해 원본 세션을 유지하며 리포트 열람 가능.
- **매니저 권한**: `manager` 역할군을 가진 계정만 상담 접수 및 리포트 작성 페이지 접근 가능.

---

## 🛠️ 유지보수 참고 사항
- n8n 서버: Railway Production 환경 운영 중.
- 알림톡 발송: `CONSULTATION_SUMMARY` 및 `CHOOSE_SCHEDULE` 단계에서 연동됨.
