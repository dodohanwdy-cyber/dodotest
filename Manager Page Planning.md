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
- **CHOOSE_SCHEDULE** - Section 2 선택한 일정 확정
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/time-request`
  - Method: POST
  - 사용: 인테이크 폼 Step 2
- **AI_CHAT_ANALYZE** - Section 3 채팅 분석 및 최종 저장
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/request-data`
  - Method: POST
  - 사용: 인테이크 폼 Step 3
- **SUBMIT_FINAL_REPORT** - 최종 상세 리포트 제출
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/consultation-summary`
  - Method: POST
  - 사용: 인테이크 폼 Step 4 (결과 리포트)

#### 기타
- **GET_DASHBOARD_APPLICATIONS** - 클라이언트 대시보드 데이터 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/dashboard-applications`
  - Method: POST
  - 사용: 클라이언트 대시보드
- **GET_APPLICATION_DETAIL** - 특정 신청의 전체 데이터 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/application-detail`
  - Method: POST
  - 사용: 인테이크 폼 (수정 모드)

### ⚠️ 연동 완료/진행 중 (상담사 페이지)

#### 3단계: 상담사 대시보드 및 상담 관리
- **GET_MANAGER_DASHBOARD** - 전체 상담 현황 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/schedule-start`
  - Method: POST
  - 용도: 상담사 대시보드 메인 데이터
- **GET_DASHBOARD_PREVIEW** - 대시보드용 간편 데이터 조회
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/send-confirmed-list-data`
  - Method: POST
  - 용도: 상담사 대시보드 요약 정보 (확정 목록)
- **ADJUST_SCHEDULE** - 드래그 앤 드롭 일정 변경
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/schedule-confirm`
  - Method: POST
  - 용도: 상담 일정 조정
- **START_CONSULTATION** - 상담 시작 시 전체 데이터 로드
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/send-all-data`
  - Method: POST
  - 용도: 상담 시작 페이지
- **CONSULTATION_SUMMARY** - 상담 요약 및 정리
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/consultation-summary`
  - Method: POST
  - 용도: 상담 완료 후 요약 저장 (STT 결과 전송)

### ⚪ 미사용/대기
- **AI_CHAT_INPUT** - 채팅 실시간 반응
  - URL: `https://primary-production-1f39e.up.railway.app/webhook/chat-input`
  - 상태: 현재 사용하지 않음 (Gemini API 직접 호출)
- **SYNC_GOOGLE_SHEETS** - 구글 시트 강제 동기화
  - URL: 미설정
  - 상태: 필요시 구현

---

## 🏗️ 상담사 페이지 구성 요소

### 1. 상담사 대시보드 (`/manager/dashboard`)
- **필요한 데이터**: 전체 상담 신청 목록, 오늘의 일정, 통계(대기/완료/긴급)
- **주요 기능**: 
  - 📊 통계 카드 (오늘의 상담, 대기 신청, 주간 완료 건수 등)
  - 📅 캘린더 뷰 (월간/주간/일간, 드래그 앤 드롭 일정 조정)
  - 📋 신청 목록 테이블 (상태별 필터링, 검색, 페이지네이션)
  - 🔔 알림 센터 (신규 신청, 일정 변경, 긴급 요청)
- **연동 웹훅**: `GET_MANAGER_DASHBOARD`, `GET_DASHBOARD_PREVIEW`

### 2. 상담 일정 관리 (`/manager/schedule`)
- **필요한 데이터**: 전체 상담 일정(확정/대기), 상담사 근무 시간, 휴일 정보
- **주요 기능**:
  - 📅 인터랙티브 캘린더 (시간 블록 시각화, 상태별 색상 코딩, 충돌 감지)
  - ⏰ 일정 조정 (변경, 취소, 긴급 추가, 자동 내담자 알림)
  - 🔄 자동 스케줄링 (빈 시간대 최적 할당)
- **연동 웹훅**: `ADJUST_SCHEDULE`, `GET_CALENDAR`

### 3. 상담 진행 페이지 (`/manager/consultation/[id]`)
- **필요한 데이터**: 내담자 기본 정보, 인테이크 응답, AI 채팅 분석 결과, 이전 기록
- **주요 기능**:
  - 👤 내담자 정보 패널 (프로필, 관심 분야, 특이사항)
  - 💬 AI 분석 결과 (고민 요약, 감정 분석, 추천 정책 제안)
  - 📝 상담 노트 (실시간 메모, 자동 저장, 템플릿)
  - 🎯 정책 추천 (추천 리스트 검색/추가, 신청 방법 안내)
  - ✅ 상담 완료 처리 (요약 작성, 후속 조치 계획 전송)
- **연동 웹훅**: `START_CONSULTATION`, `CONSULTATION_SUMMARY`

### 4. 상담 리포트 페이지 (`/manager/consultation/[id]/report`)
- **필요한 데이터**: 상담 요약, 확정 추천 정책, 상담사 코멘트, 후속 조치
- **주요 기능**:
  - 📄 리포트 뷰어 (최종 결과 시각화, PDF 다운로드)
  - 📧 결과 전송 (이메일, 카카오 알림톡/SMS 발송)
  - 📊 통계 분석 (상담 성과 지표 관리)
- **연동 웹훅**: `SUBMIT_FINAL_REPORT`
