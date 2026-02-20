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

Push가 완료되면 Vercel이 자동으로 빌드를 시작합니다.
배포 진행 상황은 https://vercel.com 대시보드에서 확인할 수 있습니다.
일반적으로 1~3분 내에 배포가 완료됩니다.
