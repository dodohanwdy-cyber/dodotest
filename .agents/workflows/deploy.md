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

### 4단계: 배포 상태 자동 확인 (백그라운드)
사용자가 직접 확인하지 않아도 되도록 백그라운드에서 배포 상태를 확인합니다.

1. `read_url_content`를 사용하여 GitHub 커밋 페이지(`https://github.com/dodohanwdy-cyber/dodotest/commits/main`)의 HTML을 읽어와 빌드 상태 아이콘(체크 표시 등)을 분석합니다.
2. `browser_subagent`를 사용할 경우 사용자의 화면을 방해하지 않도록 최소한의 동작으로만 수행합니다.
3. 배포가 완료되면 성공 메시지를 보고하고, 실패 시에만 상세 원인을 파악하여 별도 보고합니다.
