# 향후 보안 및 기능 확장 고려사항 (Security & Roadmap Considerations)

본 문서는 `next.config.js`에 적용된 강력한 보안 헤더(CSP, X-Frame-Options 등)로 인해, 향후 새로운 기능을 기획/개발할 때 발생할 수 있는 충돌 요소를 미리 기록하여 다음 개발자가 참고할 수 있도록 작성되었습니다.

## 1. 외부 위젯 및 IFrame 삽입 (CSP: `frame-src`)
*   **현재 상태:** `frame-src 'none';` 및 `object-src 'none';`
*   **제한 사항:** 현재 애플리케이션 내부에 어떠한 형태의 iframe이나 외부 객체도 삽입할 수 없습니다.
*   **발생 가능한 문제:** 향후 안내 페이지에 **유튜브(YouTube) 가이드 영상**, **카카오맵/네이버 지도(오프라인 센터 안내)**, 또는 **구글 폼(사전 설문지)** 등을 임베드(삽입)하여 보여주려는 기획이 생길 경우, 해당 요소들이 화면에 표시되지 않고 에러가 발생합니다.
*   **해결 가이드:** 해당 기획이 확정되어 개발을 진행할 때, `next.config.js`의 `ContentSecurityPolicy` 중 `frame-src` 항목에 필요한 도메인을 명시적으로 허용해야 합니다.
    *   *예시:* `frame-src 'self' https://www.youtube.com https://map.kakao.com;`

## 2. 타 플랫폼에 대시보드 연동 (X-Frame-Options & CSP: `frame-ancestors`)
*   **현재 상태:** `X-Frame-Options: DENY`, CSP: `frame-ancestors 'none';`
*   **제한 사항:** 본 웹 애플리케이션(도도한 콜라보)을 다른 웹사이트나 플랫폼의 화면 내부에 iframe 형태로 띄우는 것이 원천 차단되어 있습니다.
*   **발생 가능한 문제:** 향후 기관이나 회사 내부에서 사용하는 **노션(Notion), 사내 인트라넷(위키), 슬랙(Slack) 앱** 내부 등에 본 상담 관리 대시보드를 임베드(통합)하여 사용하려는 기획이 생길 경우, 접속이 거부되며 화면이 표시되지 않습니다.
*   **해결 가이드:** 대시보드를 특정 외부 플랫폼에 띄워야 하는 기획이 확정될 경우, 다음 설정 변경이 필요합니다.
    1.  `X-Frame-Options: DENY` 항목을 삭제하거나 주석 처리.
    2.  CSP의 `frame-ancestors`에 삽입을 허용할 특정 도메인을 추가.
    *   *예시:* `frame-ancestors 'self' https://www.notion.so https://*.slack.com;`

---
> **💡 다음 개발자를 위한 팁:** 보안 헤더는 기본적으로 '가장 강력한 차단(허용 리스트 방식)'을 원칙으로 세팅되어 있습니다. 새로운 외부 서비스나 API를 연동할 때 리소스가 로드되지 않는다면 브라우저의 콘솔 창에서 `[Violation] Permissions policy violation` 또는 `Content Security Policy` 관련 에러를 가장 먼저 확인하시기 바랍니다.
