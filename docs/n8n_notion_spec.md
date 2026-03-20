# n8n-Notion AI 리포트 생성 워크플로우 명세서

본 문서는 프론트엔드에서 전송하는 상담 데이터를 수신하여, 내담자용 **노션(Notion) 보안 보고서** 페이지를 자동으로 생성하는 n8n 워크플로우 설계를 위한 가이드라인입니다.

## 1. 개요
- **목적:** 상담 종료 후 분석된 데이터를 바탕으로 깔끔하게 디자인된 노션 페이지를 생성하고, 보안 링크(URL)를 반환함.
- **트리거:** 프론트엔드 `[보안 링크 생성하기]` 버튼 클릭 시 호출되는 HTTP Webhook.

## 2. 웹훅 데이터 구조 (JSON Payload)
프론트엔드에서 n8n으로 다음과 같은 데이터를 전송합니다.

```json
{
  "request_id": "REQ-123456",
  "client_info": {
    "name": "내담자 이름",
    "age": 24,
    "gender": "male",
    "location": "서울시 강남구"
  },
  "report_summary": {
    "risk_score": 3,
    "main_issue": "상담의 핵심 이슈 요약",
    "keywords": ["키워드1", "키워드2"]
  },
  "analysis_detail": {
    "dialog_summary": "전체 상담 내용의 핵심 요약 텍스트",
    "engagement_change": "참여도 변화에 대한 분석 내용",
    "counselor_note": "상담사 관점의 특이사항"
  },
  "action_plan": {
    "policies": ["추천 정책 1", "추천 정책 2"],
    "next_steps": ["향후 과제 1", "향후 과제 2"]
  },
  "feedback_message": "내담자에게 전하는 따뜻한 메시지",
  "completed_at": "2024-03-12 15:00:00"
}
```

## 3. 노션 페이지 디자인 가이드 (n8n 구성 단계)

### Step 1: Notion Page 생성 (Database Row 추천)
- **Title:** `[열고닫기] ${client_info.name}님을 위한 상담 분석 리포트`
- **Properties:**
    - `ID`: `request_id`
    - `위험도`: `risk_score` (숫자)
    - `상담일시`: `completed_at` (날짜)

### Step 2: 본문 블록 구성 (Append Block)
보기 좋은 리포트를 위해 다음 블록 타입을 활용하세요.
1. **Callout (전구 아이콘):** `${report_summary.main_issue}`를 넣어 핵심을 먼저 인지하게 함.
2. **Heading 2:** "상담 대화 요약" -> **Quote Block:** `${analysis_detail.dialog_summary}`
3. **Heading 2:** "맞춤형 추천 정책" -> **Bulleted List:** `${action_plan.policies}` 항목들
4. **Heading 2:** "향후 실행 계획" -> **Todo List:** `${action_plan.next_steps}` 항목들
5. **Divider:** 구분선 추가
6. **Callout (하트 아이콘):** `${feedback_message}`를 마지막에 배치.

## 4. 응답 (Response)
워크플로우 마지막 단계(Webhook Response)에서 아래와 같이 생성된 노션 페이지의 URL을 반환해야 합니다.

```json
{
  "status": "success",
  "share_url": "https://www.notion.so/reporst-page-url-id"
}
```

---
**Tip for Gemini:** n8n의 `Notion` 노드를 사용하여 페이지를 생성한 뒤, `Notion` 노드의 `Append content to a page` 기능을 활용하여 `analysis_detail`과 `action_plan`의 내용을 블록별로 추가하면 됩니다.
