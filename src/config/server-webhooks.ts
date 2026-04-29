export const SERVER_WEBHOOK_URLS: Record<string, string> = {
  // 1단계: 인증 및 기본 정보
  LOGIN: "https://primary-production-1f39e.up.railway.app/webhook/login-id", 
  SIGNUP: "https://primary-production-1f39e.up.railway.app/webhook/signup", 
  UPDATE_USER: "https://primary-production-1f39e.up.railway.app/webhook/update-user", 

  // 2단계: 상담 신청
  SUBMIT_INTAKE: "https://primary-production-1f39e.up.railway.app/webhook/submit-intake", 
  GET_CALENDAR: "https://primary-production-1f39e.up.railway.app/webhook/time-check", 
  CHOOSE_SCHEDULE: "https://primary-production-1f39e.up.railway.app/webhook/time-request", 
  AI_CHAT_INPUT: "https://primary-production-1f39e.up.railway.app/webhook/chat-input", 
  AI_CHAT_ANALYZE: "https://primary-production-1f39e.up.railway.app/webhook/request-data", 
  CONSENT_COMPLETE: "https://primary-production-1f39e.up.railway.app/webhook/consent-complete", 

  // 3단계: 매니저 대시보드
  GET_MANAGER_DASHBOARD: "https://primary-production-1f39e.up.railway.app/webhook/schedule-start", 
  GET_DASHBOARD_PREVIEW: "https://primary-production-1f39e.up.railway.app/webhook/send-confirmed-list-data", 
  GET_COMPLETED_LIST: "https://primary-production-1f39e.up.railway.app/webhook/completed-list", 
  ADJUST_SCHEDULE: "https://primary-production-1f39e.up.railway.app/webhook/schedule-confirm", 
  START_CONSULTATION: "https://primary-production-1f39e.up.railway.app/webhook/send-all-data", 
  CONSULTATION_SUMMARY: "https://primary-production-1f39e.up.railway.app/webhook/consultation-summary", 
  SUBMIT_FINAL_REPORT: "https://primary-production-1f39e.up.railway.app/webhook/consultation-summary", 
  CHECK_CASE: "https://primary-production-1f39e.up.railway.app/webhook/check-case", 

  // 기타
  GET_DASHBOARD_APPLICATIONS: "https://primary-production-1f39e.up.railway.app/webhook/dashboard-applications", 
  GET_APPLICATION_DETAIL: "https://primary-production-1f39e.up.railway.app/webhook/application-detail", 
  GET_COMPLETED_DETAIL: "https://primary-production-1f39e.up.railway.app/webhook/get-completed-detail", 
  GET_REPORT_EXAMPLE: "https://primary-production-1f39e.up.railway.app/webhook/result-example", 
  SYNC_GOOGLE_SHEETS: "", 
  GENERATE_NOTION_REPORT: "https://primary-production-1f39e.up.railway.app/webhook/notion-report", 
};
