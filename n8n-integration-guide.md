# 🔗 n8n 웹웹훅 연동 가이드 (JSON 예시)

Frontend 애플리케이션과 n8n 워크플로우를 완벽하게 연결하기 위한 데이터 규격 가이드입니다.

---

## 1. 로그인 (Login)
**Webhook URL**: `YOUR_LOGIN_WEBHOOK_URL`

### 📥 앱 -> n8n (Request)
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 📤 n8n -> 앱 (Response)
#### ✅ 성공 (200 OK)
```json
{
  "status": "success",
  "user_id": "unique_id_123",
  "email": "user@example.com",
  "role": "client", 
  "message": "환영합니다!"
}
```
> [!TIP]
> `role` 값은 `client` 또는 `manager`여야 하며, 이에 따라 대시보드가 결정됩니다.

#### ❌ 실패: 등록되지 않은 이메일 (400 Bad Request)
```json
{
  "status": "error",
  "code": "USER_NOT_FOUND",
  "message": "등록되지 않은 이메일입니다."
}
```

#### ❌ 실패: 비밀번호 불일치 (401 Unauthorized)
```json
{
  "status": "error",
  "code": "INVALID_PASSWORD",
  "message": "비밀번호가 일치하지 않습니다."
}
```

---

## 2. 회원가입 (Sign Up)
**Webhook URL**: `YOUR_SIGNUP_WEBHOOK_URL`

### 📥 앱 -> n8n (Request)
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "홍길동",
  "role": "client"
}
```

### 📤 n8n -> 앱 (Response)
#### ✅ 성공 (200 OK)
```json
{
  "status": "success",
  "message": "회원가입이 완료되었습니다."
}
```

---

## 3. 상담 신청/인테이크 (Intake)
**Webhook URL**: `YOUR_INTAKE_WEBHOOK_URL`

### 📥 앱 -> n8n (Request)
```json
{
  "user_id": "unique_id_123",
  "name": "홍길동",
  "category": "금융지원",
  "details": "청년 전세자금 대출에 대해 궁금합니다.",
  "submitted_at": "2026-02-12T13:24:00Z"
}
```

### 📤 n8n -> 앱 (Response)
```json
{
  "status": "success",
  "intake_id": "intake_abc_789",
  "message": "상담 신청이 정상적으로 접수되었습니다."
}
```

---

## 4. 비밀번호 변경 (Update Password)
**Webhook URL**: `YOUR_UPDATE_USER_WEBHOOK_URL`

### 📥 앱 -> n8n (Request)
```json
{
  "user_id": "unique_id_123",
  "email": "user@example.com",
  "current_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

### 📤 n8n -> 앱 (Response)
#### ✅ 성공 (200 OK)
```json
{
  "status": "success",
  "message": "비밀번호가 성공적으로 변경되었습니다."
}
```

#### ❌ 실패: 현재 비밀번호 불일치 (401 Unauthorized)
```json
{
  "status": "error",
  "message": "현재 비밀번호가 일치하지 않습니다."
}
```
