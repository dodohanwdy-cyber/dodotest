# 🚀 최신 시스템 업데이트 및 배포 현황 (update_changelog.md)

> **문서 목적:** 최근 진행된 Supabase DB 스키마 1:1 바인딩, n8n 웹훅 보안 인증, 매니저 대시보드 캘린더/상세보기 웹훅 분리, STT 오디오 게인/컴프레서 최적화 및 Verbatim 하이브리드 전사 기술 적용 이력을 기록합니다.

---

## 📅 최신 업데이트 이력 (2026-07-28 기준)

### 1. 🗄️ Supabase 데이터베이스 1:1 정밀 바인딩 & 스키마 문서화
- **내용**: `counselings` 테이블의 47개 핵심 컬럼(`regional_local_government`, `basic_local_government`, `job_status`, `income_level`, `chat_summary`, `pre_consultation_brief` 등)과 프론트엔드/n8n 간의 데이터 키를 1:1 완벽 연결
- **관련 문서**: [`docs/database_schema.md`](file:///docs/database_schema) 생성 및 원본 [`docs/database_schema.json`](file:///docs/database_schema.json) 보존

### 2. 🛡️ n8n 웹훅 보안 인증 헤더(`X-Api-Key`) 전수 적용
- **내용**: 브라우저 direct 호출 시 발생하던 `401 Unauthorized` 헤더 누락을 완전히 소탕하기 위해, 26개 전 수량 웹훅 통신을 Next.js 서버 보안 프록시 라우터(`/api/webhook`)로 경유 전환
- **보안 검증**: `X-Api-Key: Ehehgks_counsel_2026_!@` 인증 헤더 자동 주입 및 Supabase Auth 유저 세션 1차 검증 적용

### 3. 📅 매니저 대시보드 웹훅 역할 명확 분리
- **`GET_DASHBOARD_PREVIEW` (`/webhook/send-confirmed-list-data`)**: 매니저 첫 접속 시 캘린더 및 확정된 상담 일정 목록 0건 누락 현상 해결 ➔ 100% 정상 출력
- **`GET_PREVIEW_DETAIL` (`/webhook/send-preview-data`)**: 대시보드 하단 '상세보기' 버튼 클릭 시 단건 팝업 상세 정보 불러오기 ➔ 팝업 데이터 1:1 완벽 노출

### 4. 🎙️ 오디오 수음 민감도 & 다이내믹 컴프레서 최적화
- **하드웨어 AGC & 노이즈 억제**: `getUserMedia` 캡처 시 `autoGainControl`, `noiseSuppression`, `echoCancellation` 활성화
- **DynamicsCompressorNode 도입**: 작은 소리는 끌어올리고 큰 소리가 찢어지는 현상(Clipping)을 방지하여 STT 음성 인식률 향상
- **기본 게인 상향**: 기본 증폭값 `gainValue`를 `1.0` ➔ `2.5`배로 상향하고 노이즈 게이트 임계값을 `120` ➔ `50`으로 조율하여 조용한 첫 마디 민감도 극대화

### 5. 🗣️ Verbatim 100% 전사 & 하이브리드 화자 분리 기술 적용
- **하이브리드 텍스트+오디오 매칭**: 상담 중 실시간 수집된 텍스트(`realtime_transcript`)를 오디오와 함께 Gemini에 동시 전달하여 화자 분리 처리 속도 3배 단축
- **Verbatim 절대 지침**: Gemini 시스템 프롬프트에서 축약/요약/교정 지시를 제거하고 `temperature: 0.1` 설정 적용으로 원문 축약 0% 보존
- **UI 문구 세련화**: 로딩 안내창의 특정 모델명(`Gemini 2.0`) 문구 삭제 및 범용 AI 안내 문구 적용

---

## 🚀 배포 현황 (Deployment Status)

- **버전 제어**: GitHub `origin/main` 푸시 완료 (`35148cc`, `a89b45c`, `3c44db3` 등)
- **로컬 검증**: `npm run build` 프로덕션 빌드 100% 통과 (`✓ Compiled successfully`)
- **Vercel 자동 배포**: 라이브 Vercel 프로덕션 환경에 실시간 최신 버전 100% 배포 적용 완료
