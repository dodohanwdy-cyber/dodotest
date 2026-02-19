# 🚀 열고닫기 (OPCL) 로컬 실행 상세 가이드 (Windows)

컴퓨터에서 웹사이트를 직접 띄워보실 수 있도록 아주 자세하게 안내해 드립니다.

### 1단계: 터미널(명령 프롬프트) 열기
현재 코드 에디터(VS Code 등)를 사용 중이시라면 가장 쉬운 방법입니다.
1. 키보드에서 **`Ctrl` + `j`** (또는 `Ctrl` + `~`) 를 누르세요.
2. 화면 하단에 검은색 창(터미널)이 나타납니다.

---

### 2단계: 필수 도구 확인 (Node.js)
서버를 돌리려면 **Node.js**라는 프로그램이 설치되어 있어야 합니다.
1. 터미널에 `node -v` 라고 입력하고 엔터를 쳐보세요.
2. `v20.x.x` 처럼 숫자가 나오면 설치된 것이고, "알 수 없는 명령어"라고 나오면 [여기(Node.js 공식 홈페이지)](https://nodejs.org/)에서 **LTS 버전**을 다운로드하여 설치해 주세요. (설치 후 에디터를 껐다 켜야 합니다.)

---

### 3단계: 패키지 설치 (최초 1회)
프로젝트에 필요한 부품들을 먼저 모으는 작업입니다.
1. 터미널에 아래 명령어를 입력하고 엔터를 누릅니다.
   ```powershell
   npm install
   ```
2. 약 30초~1분 정도 기다리면 완료됩니다.

---

### 4단계: 서버 실행 (실제 사이트 띄우기)
이제 진짜 사이트를 실행합니다.
1. 터미널에 아래 명령어를 입력합니다.
   ```powershell
   npm run dev
   ```
2. 터미널에 `Ready in ...ms` 또는 `Started server on 0.0.0.0:3000` 이라는 문구가 나타날 때까지 기다립니다.

---

### 5단계: 웹사이트 접속
1. 웹 브라우저(크롬 권장)를 엽니다.
2. 주소창에 아래 주소를 입력하고 접속합니다.
   > **[http://localhost:3000](http://localhost:3000)**

### 6단계: 주요 페이지 바로가기 (로그인 후 이용 가능)
서버가 실행 중인 상태에서 아래 링크를 클릭하면 해당 페이지로 바로 이동합니다.

**1. 공통 페이지**
- 🏠 [메인 랜딩 페이지](http://localhost:3000/)
- 🔑 [로그인 페이지](http://localhost:3000/login)
- 📝 [회원가입 페이지](http://localhost:3000/signup)
- ⚙️ [비밀번호 변경 페이지](http://localhost:3000/profile)

**2. 내담자(청년) 전용**
- ✍️ [상담 통합 신청 (인적사항~AI채팅)](http://localhost:3000/client/intake)
- 📊 [내담자 대시보드](http://localhost:3000/client/dashboard)

**3. 매니저(상담사) 전용**
- 💼 [매니저 메인 대시보드](http://localhost:3000/manager/dashboard)
- 📅 [상담 일정 조율(팝업용)](http://localhost:3000/manager/schedule)
- 🎧 [실시간 상담 진행창 (예시)](http://localhost:3000/manager/consultation/TEST_ID)
- 📄 [최종 보고서 작성 (예시)](http://localhost:3000/manager/consultation/TEST_ID/report)

---

### ⚠️ 버튼 클릭 시 'HTTP error! status: 500'이 발생한다면?
이 오류는 프론트엔드가 아닌 **n8n(서버) 쪽에서 처리에 실패**했다는 의미입니다. 아래 순서로 점검해 보세요.

1. **n8n 워크플로우 활성화:** 해당 웹훅을 사용하는 n8n 워크플로우가 `Active` 상태인지 확인하세요.
2. **Respond to Webhook 오류:** 만약 `"Unused Respond to Webhook node..."` 에러가 난다면, 워크플로우 맨 앞의 **Webhook 노드**를 더블클릭한 후, **`HTTP Response`** (또는 `Response Mode`) 설정을 **`Using 'Respond to Webhook' Node`**로 변경해 주세요.
3. **실행 이력(Executions) 확인:** n8n 왼쪽 메뉴의 'Executions'를 클릭하여 500 에러 시점에 어떤 노드에서 멈췄는지 확인합니다.
3. **Webhook URL 일치 여부:** `src/config/webhooks.js`에 적힌 주소가 현재 n8n의 `Production URL`과 정확히 일치하는지 대조해 보세요.
4. **테스트 모드:** n8n에서 'Listen for event'를 누른 상태에서 웹의 버튼을 클릭하여 데이터가 들어오는지 먼저 테스트해 보세요.

---

### 💡 팁
- **종료하고 싶을 때:** 터미널 창을 클릭하고 **`Ctrl` + `c`** 를 누른 뒤 `Y`를 입력하면 서버가 꺼집니다.
- **수정하면 바로 반영:** 제가 코드를 수정하거나 본인이 코드를 고치면, 서버가 켜져 있는 동안은 웹사이트에 즉시 반영됩니다!
