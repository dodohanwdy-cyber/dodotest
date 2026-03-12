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

### 4. Manager Completed Pages (`/manager/completed`)
이 페이지는 과거에 상담이 종료된 내역들을 모두 모아보고, 필요 시 상세 분석 리포트를 열람할 수 있는 목록 형태의 대시보드입니다.

### 4.1 UI 구성
* **상단 필터 (연월 이동):** "YYYY년 M월" 형식으로 좌우 화살표를 눌러 데이터를 월 단위로 이동하며 볼 수 있습니다. (향후 백엔드에서 `YYYY-MM` 파라미터를 받아올 수 있도록 구현되어 있음)
* **상단 요약 브리핑 (기능 보강 예정):** 
  * "위험 대상자": 해당 월의 완료 건들 중 위험도(Risk Score)가 8등급 이상인 건수를 카드 형태로 강조.
  * "가장 많은 관심사": 리스트 내 내담자들의 `interest_areas` 중 가장 빈번한 키워드 노출.
  * "이달의 완료된 상담": 조회 월의 전체 완료 건수 노출.
* **통합 검색 바:** "이름 또는 이메일로 검색" 입력을 통해 현재 불러온 리스트에 대한 빠른 클라이언트 사이드 필터링을 지원합니다.
* **상태 리프레시 버튼:** 수동으로 `GET_COMPLETED_LIST`를 호출해 n8n의 AI 분석 진행 상태(진행 중 -> 완료)를 화면에서 실시간으로 갱신해 볼 수 있습니다.

### 4.2 타임아웃 방지 및 비동기 UX (매우 중요)
상담 데이터를 n8n으로 전송하여 AI가 분석을 완료하기까지는 수십 분(대화 내용에 따라 상이)이 소요될 수 있습니다. 이를 브라우저에서 대기하면 Vercel의 프론트엔드 Timeout 에러가 발생합니다.
따라서 다음과 같은 비동기 프로세스 및 UX를 적용합니다.

* **상담 종료 직후:** 상담 페이지(`/manager/consultation/[id]`)에서 '상담 종료'를 누르고 전송 시, 백엔드 응답을 영원히 기다리지 않도록 합니다. 데이터 발송 직후 Vercel 타임아웃 전에 **즉시 상담 완료 내역 리스트(`/manager/completed`)로 매니저를 이동**시킵니다.
* **알림톡 분리:** 이동 전에(혹은 직후 모달을 통해) 내담자에게 "상담이 방금 끝났습니다. 세부 분석 리포트는 추후 보내드립니다."라는 1차 종료 안내 톡을 가장 먼저 쏠 수 있는 버튼을 제공합니다.
* **상태 구분 렌더링:** 완료 내역 페이지의 테이블에서 각 항목은 현재 분석 상태에 따라 다르게 렌더링됩니다.
  * **분석 진행 중 (`status: "completed"`):** 
    * 뱃지: 회색의 `[Loader 아이콘] 분석 진행 중`
    * 우측 버튼: 잠겨 있으며, 클릭 시 "AI가 상담 내용을 분석 중입니다. 잠시 후 새로고침하여 확인해 주세요."라는 Alert 발생.
  * **분석 완료 (`status: "analyzed"`):** 
    * 뱃지: 녹색의 `[체크 아이콘] 분석 완료`
    * 우측 버튼: 원래 의도했던 파란색의 `리포트 보기` 링크 버튼으로 나타남. 클릭 시 `/manager/consultation/[id]/report?status=completed...` 형태의 조회 페이지로 진입.

이러한 분리 구성을 통해 매니저는 에러 없이 안정적으로 50분 분량의 AI 분석을 백그라운드로 넘기고 본인의 추가 업무를 이어갈 수 있습니다.

### 4.3 Webhook 연동 정보
* **`GET_COMPLETED_LIST`**
  * 용도: 매번 페이지 렌더링 시, 또는 수동 새로고침 클릭 시 호출되어 과거의 모든 종료(`completed`) 및 분석 완료(`analyzed`)된 상담 데이터를 불러옵니다. 이 데이터 Array를 통해 테이블을 그립니다.
