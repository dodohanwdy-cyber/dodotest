---
description: 코드 수정 후 GitHub에 커밋/푸시하고 Vercel에 자동 배포하는 워크플로우
---

## 코드 수정 후 GitHub & Vercel 배포 워크플로우

코드를 수정한 뒤, 아래 순서대로 진행하여 Vercel에 자동 배포합니다.
Vercel은 GitHub main 브랜치에 push되면 자동으로 빌드 및 배포가 트리거됩니다.

### 전제 조건
- 프로젝트 루트: `g:\재택근무\바이브코딩`
- GitHub 원격 저장소: `https://github.com/dodohanwdy-cyber/dodotest.git`
- Vercel이 GitHub의 `main` 브랜치와 자동 연동되어 있음

---

### 1단계: 변경된 파일 스테이징
// turbo
```powershell
git -C "g:\재택근무\바이브코딩" add -A
```

---

### 2단계: 커밋 메시지 작성 및 커밋
커밋 메시지는 수정 내용을 간략히 설명합니다.
// turbo
```powershell
git -C "g:\재택근무\바이브코딩" commit -m "fix: [수정 내용 한 줄 요약]"
```

---

### 3단계: GitHub main 브랜치에 Push
// turbo
```powershell
git -C "g:\재택근무\바이브코딩" push origin main
```

### 4단계: 배포 상태 자동 확인 (내부 프로세스)
Vercel 배포 성공 여부를 브라우저 서브에이전트를 통해 내부적으로 확인합니다. 사용자가 별도로 브라우저를 열어 확인하지 않아도 됩니다.

1. `browser_subagent`가 https://github.com/dodohanwdy-cyber/dodotest/commits/main 에 접속하여 빌드 상태를 확인합니다.
2. 배포가 완료되면 사용자에게 성공 메시지만을 보고합니다.
3. 배포 실패 시 상세 에러 원인을 파악하여 별도 보고합니다.
