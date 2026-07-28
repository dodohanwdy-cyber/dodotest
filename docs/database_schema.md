# 🗄️ Supabase 데이터베이스 스키마 명세서 (database_schema.md)

 본 문서는 '열고닫기(OPCL) 청년 정책 상담 플랫폼'의 Supabase 데이터베이스 구조를 정리한 문서입니다. 프론트엔드 컴포넌트, 백엔드 API 라우트, n8n 워크플로우 통신 시 본 명세서의 필드명을 기준으로 1:1 바인딩합니다.

---

## 1. 📋 `counselings` (핵심 상담 신청 & 리포트 테이블)

| 컬럼명 (Column) | 데이터 타입 (Type) | Null 허용 | 설명 / 역할 |
|---|---|---|---|
| `request_id` | `text` | **PRIMARY (NO)** | 상담 고유 신청 번호 (예: `REQ-17696...`) |
| `email` | `text` | YES | 내담자 이메일 |
| `time` | `timestamptz` | YES | 신청 일시 |
| `role` | `text` | YES | 사용자 역할 (`client`, `manager`) |
| `name` | `text` | YES | 내담자 이름 |
| `age` | `integer` | YES | 내담자 나이 |
| `gender` | `text` | YES | 성별 (`male`, `female`, `남성`, `여성`) |
| `regional_local_government` | `text` | YES | 광역 자치단체 (예: `서울특별시`, `울산광역시`) |
| `basic_local_government` | `text` | YES | 기초 자치단체 (예: `강남구`, `남구`) |
| `job_status` | `text` | YES | 직업 상태 / 사회적 상태 (`재직중`, `취업준비생`, `대학생` 등) |
| `income_level` | `text` | YES | 소득 수준 |
| `interest_areas` | `text` | YES | 관심 분야 (쉼표 구분 문자열 또는 JSON) |
| `education_level` | `text` | YES | 최종 학력 |
| `marital_status` | `text` | YES | 혼인 상태 |
| `benefited_policy` | `text` | YES | 기존 수혜 정책 경험 |
| `request_time_1` | `text` | YES | 1순위 희망 상담 일시 |
| `request_time_2` | `text` | YES | 2순위 희망 상담 일시 |
| `request_time_3` | `text` | YES | 3순위 희망 상담 일시 |
| `preferred_location` | `text` | YES | 희망 상담 장소 (예: `온라인`, `서울청년센터 강남`) |
| `preferred_method` | `text` | YES | 희망 상담 방식 (`online`, `offline`, `phone`) |
| `status` | `text` | YES | 진행 상태 (`step1`~`step4`, `pending`, `confirmed`, `analyzed`, `completed`, `canceled`) |
| `confirmed_datetime` | `text` | YES | 매니저 최종 확정 상담 일시 (`YYYY-MM-DD HH:mm`) |
| `confirmed_location` | `text` | YES | 확정 상담 장소 |
| `confirmed_method` | `text` | YES | 확정 상담 방식 |
| `confirmed_at` | `text` | YES | 매니저 배정 확정 처리 시각 |
| `completed_at` | `text` | YES | 상담 최종 종료 처리 시각 |
| `conversation_scripts` | `text` | YES | SFBT AI 사전 인터뷰 대화 스크립트 (JSON 문자열) |
| `chat_summary` | `text` | YES | AI 사전 인터뷰 요약 |
| `special_notes` | `text` | YES | 특이 사항 / 내담자 요청 사항 |
| `user_interest` | `text` | YES | 관심 사항 |
| `consultation_guide` | `text` | YES | AI 생성 상담 가이드라인 |
| `policy_roadmap` | `text` | YES | AI 생성 맞춤 정책 로드맵 (JSON 문자열) |
| `recommended_policies` | `text` | YES | AI 추천 정책 목록 (JSON 문자열) |
| `pre_consultation_brief` | `text` | YES | 사전 진단 브리핑 |
| `counsel_scripts` | `text` | YES | 실시간 STT 녹음 전사 대본 URL 또는 텍스트 |
| `main_issue` | `text` | YES | 핵심 문제 |
| `dialog_summary` | `text` | YES | 실제 상담 대화 요약 |
| `risk_grade` | `text` | YES | 위험도 등급 |
| `engagement_change` | `text` | YES | 내담자 태도/참여도 변화 |
| `policy_match` | `text` | YES | 정책 매칭 점수/결과 |
| `user_message` | `text` | YES | 내담자 전달 메시지 |
| `next_step` | `text` | YES | 향후 조치 계획 |
| `counselor_note` | `text` | YES | 전문 상담사 소견 노트 |
| `keywords` | `text` | YES | 키워드 태그 |
| `etc_data` | `text` | YES | 기타 보조 데이터 |
| `is_dummy` | `boolean` | YES | 더미 테스트 데이터 여부 |
| `updated_at` | `timestamptz` | YES | 수정 일시 |

---

## 2. 🛡️ `consent_logs` (서비스 약관 동의 로그 테이블)

| 컬럼명 (Column) | 데이터 타입 (Type) | Null 허용 | 설명 |
|---|---|---|---|
| `id` | `uuid` | **PRIMARY (NO)** | 고유 로그 ID |
| `request_id` | `text` | **NO** | 연관 상담 신청 ID |
| `email` | `text` | YES | 동의 유저 이메일 |
| `agreed_general_privacy_version` | `text` | **NO** | 개인정보 처리방침 약관 버전 |
| `is_agreed_general_privacy` | `boolean` | **NO** | 필수 개인정보 동의 여부 |
| `agreed_third_party_version` | `text` | YES | 제3자 제공 약관 버전 |
| `is_agreed_third_party` | `boolean` | YES | 선택 제3자 제공 동의 여부 |
| `agreed_at` | `timestamptz` | YES | 동의 일시 |
| `user_ip` | `text` | YES | 접속 IP 주소 |
| `user_agent` | `text` | YES | 접속 브라우저/디바이스 정보 |

---

## 3. 👤 `user_profiles` & `user_management_view` (회원 프로필)

| 컬럼명 (Column) | 데이터 타입 (Type) | Null 허용 | 설명 |
|---|---|---|---|
| `id` | `uuid` | **PRIMARY (NO)** | Supabase Auth User ID |
| `role` | `text` | **NO** | 권한 (`client`, `manager`) |
| `full_name` | `text` | YES | 성명 |
| `phone` | `text` | YES | 연락처 |
| `created_at` | `timestamptz` | **NO** | 가입 일시 |
| `updated_at` | `timestamptz` | **NO** | 수정 일시 |

---

## 4. 🏛️ `refinement_ontong_policies`, `seoul_policies`, `raw_ontong_policies` (청년 정책 DB)

| 테이블명 | 주요 핵심 컬럼 | 설명 |
|---|---|---|
| `refinement_ontong_policies` | `policy_id`, `title`, `processed_region_metro`, `processed_region_local`, `processed_occupation`, `processed_min_age`, `processed_max_age`, `original_description`, `original_support`, `ai_search_tags`, `embedding` | 온통청년 정제 정책 DB (Vector Search 포함) |
| `seoul_policies` | `id`, `title`, `category`, `status`, `link`, `processed_min_age`, `processed_max_age`, `processed_occupations`, `original_description` | 서울 청년 정책 DB |

---

## 5. 📜 `terms_and_conditions` (약관 관리)

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `uuid` | 약관 ID |
| `version_code` | `text` | 약관 버전 코드 (예: `v1.0`) |
| `title` | `text` | 약관 제목 |
| `body_text` | `text` | 약관 본문 내용 |
| `is_active` | `boolean` | 활성화 여부 |
