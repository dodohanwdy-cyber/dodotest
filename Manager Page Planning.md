# 웹훅 연동 현황 및 상담사 페이지 기획

현재 열고닫기(OPCL) 서비스의 웹훅 연동 상태와 매니저(상담사) 전용 페이지의 기획안입니다.

## 📋 n8n 웹훅 연동 현황

### ✅ 연동 완료 (내담자 페이지)

#### 1단계: 인증 및 기본 정보
- **LOGIN** - 로그인 처리 및 사용자 정보 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/login-id`
  - Method: POST
  - 사용: 로그인 페이지
- **SIGNUP** - 회원가입 및 초기 데이터 생성
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/signup`
  - Method: POST
  - 사용: 회원가입 페이지
- **UPDATE_USER** - 사용자 정보 수정
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/update-user`
  - Method: POST
  - 사용: 프로필 페이지

#### 2단계: 상담 신청 (인테이크 폼)
- **SUBMIT_INTAKE** - Section 1 상담 정보 입력 저장
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/submit-intake`
  - Method: POST
  - 사용: 인테이크 폼 Step 1
- **GET_CALENDAR** - Section 2 예약 가능한 일정 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/time-check`
  - Method: POST
  - 사용: 인테이크 폼 Step 2
- **CHOOSE_SCHEDULE** - Section 2 선택한 일정 확정 (배정 요청)
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/time-request`
  - Method: POST
  - 사용: 인테이크 폼 Step 2
- **AI_CHAT_ANALYZE** - Section 3 채팅 분석 및 최종 저장
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/request-data`
  - Method: POST
  - 사용: 인테이크 폼 Step 3
- **SUBMIT_FINAL_REPORT** - 최종 상세 리포트 제출 (요약 포함)
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/consultation-summary`
  - Method: POST
  - 사용: 상담 완료 및 리포트 생성

#### 기타 (내담자 사이드)
- **GET_DASHBOARD_APPLICATIONS** - 클라이언트 대시보드 신청 내역 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/dashboard-applications`
  - Method: POST
  - 사용: 클라이언트 대시보드 메인
- **GET_APPLICATION_DETAIL** - 특정 신청의 전체 데이터 조회 (수정용)
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/application-detail`
  - Method: POST
  - 사용: 인테이크 폼 (수정/로드 모드)
- **CANCEL_ASSIGNMENT** - 내담자/매니저 레이어에서의 상담 신청 취소
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/cancel-assignment`
  - Method: POST
  - 사용: 내담자 대시보드 '취소하기', 매니저 페이지 '삭제' 구역

### ✅ 연동 완료 (상담사 페이지)

#### 3단계: 상담사 대시보드 및 상담 관리
- **GET_MANAGER_DASHBOARD** - 전체 상담 현황 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/schedule-start`
  - Method: POST
  - 용도: 상담사 대시보드 메인 데이터 (캘린더 및 미배정 목록)
- **GET_DASHBOARD_PREVIEW** - 대시보드용 확정 목록 데이터 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/send-confirmed-list-data`
  - Method: POST
  - 용도: 상담사 대시보드 하단 '확정된 상담 목록'
- **ADJUST_SCHEDULE** - 드래그 앤 드롭 일정 확정/상태 변경
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/schedule-confirm`
  - Method: POST
  - 용도: 미배정 건의 상담 시간 확정 처리
- **GET_COMPLETED_LIST** - 완료된 전체 상담 내역 조회 (**신규**)
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/completed-list`
  - Method: POST
  - 용도: 상담 완료 내역 리스트 페이지용 데이터 수신 (status: completed 대상)
- **START_CONSULTATION** - 상담 시작 시 전체 데이터 로드
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/send-all-data`
  - Method: POST
  - 용도: 상담 시작 페이지 진입 시 내담자 전체 정보 수신
- **CHECK_CASE** - AI 상담 분석 데이터 즉시 준비 요청 (**신규**)
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/check-case`
  - Method: POST
  - 용도: 상담 상세 팝업 내 '바로 준비하기' 버튼 (AI 분석 수동 트리거)
- **RESET_SCHEDULE** - 배정 내역 일괄 초기화
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/reset-schedule`
  - Method: POST
  - 용도: 주간/특정 기간 배정 전체 리셋
- **CONSULTATION_SUMMARY** - 상담 요약 및 STT 결과 저장
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/consultation-summary`
  - Method: POST
  - 용도: 상담 종료 후 대화 요약 기록
- **GET_COMPLETED_DETAIL** - 완료된 상담의 최종 분석 결과 조회 (**신규**)
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/get-completed-detail`
  - Method: POST
  - 용도: 리포트 페이지(`isCompletedMode=true`) 접속 시 과거 분석 데이터 로드

### ⚪ 기타/테스트
- **GET_REPORT_EXAMPLE** - 리포트 결과 예시 데이터 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/result-example`
- **AI_CHAT_INPUT** - 채팅 실시간 반응 (대기)
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/chat-input`
  - 상태: 현재 사용하지 않음 (Edge Function 직접 호출 방식 병행)
- **SYNC_GOOGLE_SHEETS** - 구글 시트 강제 동기화 (**신규**)
  - URL: (현재 빈 값)
  - 상태: 필요시 동기화 용도

---

## 🏗️ 상담사 페이지 구성 요소 (상세)

### 1. 상담사 대시보드 (`/manager/dashboard`)
- **주요 기능**: 
  - 📊 실시간 상담 현황 통계
  - 📅 캘린더 인터페이스 (FullCalendar 연동)
  - 📋 하단 확정 목록 및 알람톡 발송 기능
- **연동 웹훅**: `GET_MANAGER_DASHBOARD`, `GET_DASHBOARD_PREVIEW`

### 2. 일정 조정 팝업 (`ScheduleAdjustPopup`)
- **주요 기능**:
  - ⏰ 미배정 건 드래그앤드롭 배정
  - 🔙 확정 일정 배정 취소/복구 (미배정 상태로 원복)
  - 🔄 배정 내역 전체 초기화
- **연동 웹훅**: `ADJUST_SCHEDULE`, `GET_CALENDAR`, `CANCEL_ASSIGNMENT`, `RESET_SCHEDULE`

### 3. 상담 상세 리포트 및 진행 (`/manager/consultation/[id]/report`)
- **주요 기능**:
  - 👤 상세 인적사항 및 인테이크 응답 확인
  - 🪄 **AI 상담 가이드**: 위험도 분석, 대화 요약, 특이사항, 추천 정책 등 제공
  - ⚡ **바로 준비하기 / 예시 보기**: AI 분석 데이터가 즉시 필요할 때 강제 요청 또는 예시 로드
  - 📝 **원페이퍼 상담 리포트**: 상담 결과 내용을 내담자에게 발송 가능하도록 클립보드 복사 지원
  - 🗂️ **완료 모드 지원**: 상담 완료 내역에서 접근 시 과거 진단 결과를 바로 병합하여 표시
- **연동 웹훅**: `START_CONSULTATION`, `CONSULTATION_SUMMARY`, `CHECK_CASE`, `GET_COMPLETED_DETAIL`, `GET_APPLICATION_DETAIL`

### 4. 상담 완료 내역 (`/manager/completed`)
- **주요 기능**:
  - 🗓️ 연도/월별 리스트 필터링 및 캘린더형 네비게이션 조회
  - 🔍 신청자 이름 및 이메일 기반 검색 필터링
  - 📋 완료된 상담 내역 요약 카드 (위기 점수, 주요 관심사, 완료일시 등 표기)
  - 🔗 상세 리포트 페이지(`?status=completed`) 연동 상세보기 지원
- **연동 웹훅**: `GET_COMPLETED_LIST`
