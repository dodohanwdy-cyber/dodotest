/**
 * 열고닫기 OPCL n8n 웹후크 설정 파일
 * 
 * [사용 방법]
 * n8n에서 생성된 각 Webhook URL을 아래 필드에 입력해 주세요.
 * 주소가 입력된 필드에 한해 자동으로 API 연동이 활성화됩니다.
 */

export const WEBHOOK_URLS = {
  // 1단계: 인증 및 기본 정보
  LOGIN: "https://webhook-processor-production-1f39e.up.railway.app/webhook/login-id", // 로그인 처리 및 사용자 정보 조회
  SIGNUP: "https://webhook-processor-production-1f39e.up.railway.app/webhook/signup", // 회원가입 및 초기 데이터 생성
  UPDATE_USER: "https://webhook-processor-production-1f39e.up.railway.app/webhook/update-user", // 사용자 정보 수정

  // 2단계: 상담 신청 (아코디언 워크플로우)
  SUBMIT_INTAKE: "https://webhook-processor-production-1f39e.up.railway.app/webhook/submit-intake", // [Section 1] 상담 정보 입력 저장
  GET_CALENDAR: "https://webhook-processor-production-1f39e.up.railway.app/webhook/time-check", // [Section 2] 예약 가능한 일정 조회
  CHOOSE_SCHEDULE: "https://webhook-processor-production-1f39e.up.railway.app/webhook/time-request", // [Section 2] 선택한 일정 확정
  AI_CHAT_INPUT: "https://webhook-processor-production-1f39e.up.railway.app/webhook/chat-input", // [Section 3] 채팅 실시간 반응
  AI_CHAT_ANALYZE: "https://webhook-processor-production-1f39e.up.railway.app/webhook/request-data", // [Section 3] 채팅 분석 및 최종 저장

  // 3단계: 매니저 대시보드 및 결과 처리
  GET_MANAGER_DASHBOARD: "https://webhook-processor-production-1f39e.up.railway.app/webhook/schedule-start", // 전체 상담 현황 조회
  GET_DASHBOARD_PREVIEW: "https://webhook-processor-production-1f39e.up.railway.app/webhook/send-confirmed-list-data", // 확정된 상담 상세 목록 조회
  ADJUST_SCHEDULE: "https://webhook-processor-production-1f39e.up.railway.app/webhook/schedule-confirm", // 드래그 앤 드롭 일정 변경
  START_CONSULTATION: "https://webhook-processor-production-1f39e.up.railway.app/webhook/send-all-data", // 상담 시작 시 전체 데이터 로드
  CONSULTATION_SUMMARY: "https://webhook-processor-production-1f39e.up.railway.app/webhook/consultation-summary", // 상담 요약 및 정리 (STT 결과 전송)
  SUBMIT_FINAL_REPORT: "https://webhook-processor-production-1f39e.up.railway.app/webhook/consultation-summary", // 최종 상세 리포트 제출

  // 기타
  GET_DASHBOARD_APPLICATIONS: "https://webhook-processor-production-1f39e.up.railway.app/webhook/dashboard-applications", // 클라이언트 대시보드 데이터 조회 (이메일 기준 최근 5개)
  GET_APPLICATION_DETAIL: "https://webhook-processor-production-1f39e.up.railway.app/webhook/application-detail", // 특정 신청의 전체 데이터 조회 (request_id 기준)
  GET_REPORT_EXAMPLE: "https://webhook-processor-production-1f39e.up.railway.app/webhook/result-example", // 리포트 결과 예시 데이터 조회
  SYNC_GOOGLE_SHEETS: "", // 구글 시트 강제 동기화 (필요시)
};
