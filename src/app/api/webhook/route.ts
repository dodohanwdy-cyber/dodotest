import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { SERVER_WEBHOOK_URLS } from '@/config/server-webhooks';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { action, payload } = await req.json();

    if (!action || !SERVER_WEBHOOK_URLS[action]) {
      return NextResponse.json({ error: '액션이 유효하지 않습니다.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 회원가입이나 로그인은 유저 토큰이 없어도 패스. 그 외 라우트는 엄격하게 권한 검사
    const PUBLIC_ACTIONS = ['LOGIN', 'SIGNUP'];
    
    if (!PUBLIC_ACTIONS.includes(action)) {
      if (authError || !user) {
        return NextResponse.json({ error: '인증되지 않은 사용자입니다. 다시 로그인해주세요.' }, { status: 401 });
      }
    }

    const securePayload = { ...payload };

    // 보안 강화: 페이로드에 이메일이나 유저 ID가 있다면 실제 인증 유저 정보로 덮어쓰기! (스푸핑 방지)
    // 회원가입/로그인 등은 외부 입력(로그인 폼 입력값)을 그대로 쓰지만 나머지는 실제 유저 데이터를 신뢰함
    if (user && !PUBLIC_ACTIONS.includes(action)) {
      if ('email' in securePayload) securePayload.email = user.email;
      if ('user_id' in securePayload) securePayload.user_id = user.id;
    }

    // 서버 측에서 n8n으로 실제 전송
    const response = await fetch(SERVER_WEBHOOK_URLS[action], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(securePayload),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const n8nBody = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'n8n 워크플로우 처리 실패', status: response.status, details: n8nBody },
        { status: response.status }
      );
    }

    return NextResponse.json(isJson ? n8nBody : { status: 'success', data: n8nBody });
  } catch (error) {
    console.error('[Webhook Proxy API] Error:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
