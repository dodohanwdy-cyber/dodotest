# 🗄️ 열고닫기(OPCL) 데이터베이스 필드 스키마 명세 (2026.04.21 업데이트)

> **문서 목적:** 서비스에서 사용하는 모든 데이터베이스 필드 정의를 일원화하여 데이터 무결성을 유지하고, 개발자 간의 통신 규격을 맞추는 '단일 진실 공급원(SSOT)' 역할을 수행합니다.

**중요**: 이 문서는 DB 필드명의 단일 진실 공급원(Single Source of Truth)입니다. 모든 API 통신 및 데이터 처리 시 이 필드명을 정확하게 사용해야 합니다.

## 전체 필드 목록

| 필드 | 설명 |
|------|------|
| `request_id` | 상담신청건 식별을 위한 값 설정 |
| `time` | 사용자 데이터 입력 시간 |
| `email` | 로그인용 이메일 |
| `password_hash` | 암호화된 비밀번호 |
| `role` | 사용자 역할 (client, manager, admin) |
| `name` | 이름 |
| `age` | 나이 |
| `gender` | 성별 |
| `regional_local_government` | 거주지(광역단위) |
| `basic_local_government` | 거주지(기초단위) |
| `job_status` | 직업 상태 |
| `income_level` | 소득 수준 |
| `interest_areas` | 관심 분야 |
| `education_level` | 학력 |
| `marital_statues` | 결혼 상태 |
| `benefited_policy` | 수혜받은 정책 |
| `request_time_1` | 상담 요청 일시(1순위) |
| `request_time_2` | 상담 요청 일시(2순위) |
| `request_time_3` | 상담 요청 일시(3순위) |
| `preferred_location` | 희망 상담 장소 |
| `preferred_method` | 희망 상담 방식 (online, offline, phone) |
| `conversation_scrips` | chat을 통해 획득한 대화 전체 스크립트 |
| `chat_summary` | 대화 내용 요약 |
| `special_notes` | 특이사항 체크 (군복무, 장애인, 다문화가정, 한부모가정, 탈가정청년, 자립준비청년, 고립은둔청년, 저소득층, 기타) |
| `user_interest` | 채팅으로 추출된 관심사, 고민거리 (주거, 일자리, 금융, 문화예술) |
| `consultation_guide` | 상담사가 내담자에게 던질 '결정적 질문' 및 설명 팁 |
| `policy_roadmap` | 지금 신청할 것 vs 나중에 준비할 것 요약 |
| `recommended_policies` | 시트 조회용 policy_id가 포함된 경량 JSON 리스트 |
| `pre_consultation_brief` | 상담 전 브리핑 및 내담자 분석 데이터 |
| `status` | 상담 상태 (pending, confirmed, in_progress, completed, cancelled) |
| `confirmed_datetime` | 확정된 상담 일시 |
| `confirmed_location` | 확정된 상담 장소 |
| `confirmed_method` | 확정된 상담 방식 |
| `confirmed_at` | 일정 확정 일시 |
| `completed_at` | 상담 완료 일시 |
| `main_issue` | 내담자의 핵심 호소 문제 (주거/일자리/금융/문화예술 중 택1 및 상세) |
| `dialog_summary` | 상담 대화 요약 (상담사 개입 포함) |
| `risk_grade` | 위기 등급 (1~5점) 및 짧은 사유 |
| `engagement_change` | 상담 전/후 내담자의 인식 또는 태도 변화 |
| `policy_match` | 추천 정책과 구체적인 연계 근거 |
| `user_message` | 내담자 공유용 따뜻한 응원 메시지 |
| `next_step` | 내담자가 다음 상담 전까지 실천할 Action Plan |
| `counselor_note` | 상담사 참고용 특이사항 및 행정적 조언 |
| `keywords` | 쉼표로 구분된 통계용 키워드 5개 |
| `etc_data` | 기타 추가 원하는 데이터(상담자, 관리자 등) |
| `updated_at` | 마지막 수정 일시 |

## 섹션별 필드 그룹

### 사용자 인증 및 권한 (Supabase 연동)
- `id` (UUID): Supabase `auth.users` 테이블과 1:1로 매핑되는 기본키
- `email`: 계정 로그인용 이메일 (Auth 시스템 관리)
- `role`: 사용자 권한 (`client`, `manager`, `admin`) - `user_profiles` 테이블에서 관리

### 기본 정보 (Section 1)
- `name`
- `age`
- `gender`
- `regional_local_government`
- `basic_local_government`
- `job_status`
- `income_level`
- `interest_areas`
- `education_level`
- `marital_statues`
- `benefited_policy`

### 일정 선택 (Section 2)
- `request_time_1`
- `request_time_2`
- `request_time_3`
- `preferred_location`
- `preferred_method`

### 채팅 및 AI 분석 (Section 3)
- `conversation_scrips`
- `chat_summary`
- `special_notes`
- `user_interest`
- `consultation_guide`
- `policy_roadmap`
- `recommended_policies`
- `pre_consultation_brief`

### 상담 관리
- `request_id`
- `status`
- `confirmed_datetime`
- `confirmed_location`
- `confirmed_method`
- `confirmed_at`
- `completed_at`

### 사용자 정보 및 권한
- `id` (UUID): 자동 생성 식별자
- `role`
- `name`
- `keywords`

### 메타데이터
- `time`
- `updated_at`
- `etc_data`

## 프런트엔드-백엔드 동기화 원칙 (FE-BE Sync Rules)

데이터 무결성을 위해 모든 프런트엔드 참여자(인간 및 AI)는 아래 규칙을 엄격히 준수해야 합니다.

### 1. 명명 규칙 (Naming Convention)
- **Snake Case Only**: 모든 JSON Key, Form Name, State Property는 **소문자와 언더바(`_`)**만 사용합니다.
- **No CamelCase**: `requestId` (X) -> `request_id` (O).
- **No Space/Uppercase**: 공백이나 대문자 사용을 엄격히 금지합니다.

### 2. 컴포넌트 구현 가이드
- **HTML Form**: `<input name="job_status">`와 같이 `name` 속성을 아래의 DB 컬럼명과 1:1로 일치시킵니다.
- **React State & Fetch**: API 전송 시의 모든 속성명은 아래 리스트의 명칭을 단 하나의 예외 없이 따릅니다.

### 3. 특수 필드 주의사항 (Compatibility)
아래 필드들은 현재 DB 설계에 따라 고정된 명칭이므로 임의로 수정하지 마십시오.
- `conversation_scripts`
- `marital_status`

---

## 공식 데이터 스키마 그룹 (`counselings` 테이블)

### 기초 정보 및 상담 단계
- `request_id`, `email`, `time`, `status`, `updated_at`, `is_dummy`

### 내담자 인적 사항
- `name`, `age`, `gender`, `regional_local_government`, `basic_local_government`, `job_status`, `income_level`, `interest_areas`, `education_level`, `marital_status`, `benefited_policy`

### 상담 일정 및 방식
- `request_time_1`, `request_time_2`, `request_time_3`, `preferred_location`, `preferred_method`

### AI 상담 및 분석 데이터
- `conversation_scripts`, `chat_summary`, `special_notes`, `user_interest`, `consultation_guide`, `policy_roadmap`, `recommended_policies`, `pre_consultation_brief`

### 상담 확정 및 관리
- `confirmed_datetime`, `confirmed_location`, `confirmed_method`, `confirmed_at`, `completed_at`

### 상담 결과 및 리포트
- `counsel_scripts`, `main_issue`, `dialog_summary`, `risk_grade`, `engagement_change`, `policy_match`, `user_message`, `next_step`, `counselor_note`, `keywords`, `etc_data`

---

## 주의사항

1. **필드명 변경 금지**: 이 문서의 필드명을 임의로 변경하지 마세요.
2. **카멜케이스 사용 금지**: DB 필드는 스네이크 케이스(`snake_case`)를 사용합니다.
3. **신규 필드 추가**: 새로운 필드가 필요한 경우 먼저 이 문서를 업데이트하세요.
4. **동기화**: 모든 API 호출(n8n Webhook) 데이터는 위 리스트와 정확히 일치해야 합니다.
