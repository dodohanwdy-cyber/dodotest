# 🗺️ 열고닫기 (OPCL) 사이트맵

공개 웹 페이지 배포 시 관리의 편의성을 위해 주요 페이지 목록을 정리한 문서입니다.

## 🏠 공통 서비스
- [랜딩 페이지](http://localhost:3000/) : 서비스 소개 및 시작하기
- [로그인](http://localhost:3000/login) : 관리자 및 내담자 통합 로그인
- [회원가입](http://localhost:3000/signup) : 사용자 역할별 계정 생성
- [비밀번호 변경](http://localhost:3000/profile) : 내 계정 보안 관리

## ✍️ 내담자(청년) 워크플로우
- [상담 신청 사이트](http://localhost:3000/client/intake) : 인적사항 입력부터 AI 채팅까지 통합 프로세스
- [내담자 대시보드](http://localhost:3000/client/dashboard) : 신청 현황 확인 및 내 정보 관리

## 💼 매니저(상담사) 워크플로우
- [매니저 대시보드](http://localhost:3000/manager/dashboard) : 상담 요청 관리 및 캘린더 확인
- [상담 진행 인터페이스](http://localhost:3000/manager/consultation/[id]) : 실시간 STT 및 AI 가이드 제공
- [최종 보고서 작성](http://localhost:3000/manager/consultation/[id]/report) : 상담 결과 요약 및 전송

## ⚙️ 관리 및 설정
- [프로필 설정](http://localhost:3000/profile) : 계정 정보 및 비밀번호 관리
- [일정 조율 팝업](http://localhost:3000/manager/schedule) : 상담 시간 확정 전용 모드

---
*배포 시 `http://localhost:3000` 부분을 실제 도메인 주소로 일괄 변경하여 사용하세요.*
