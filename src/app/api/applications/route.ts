import { NextResponse } from 'next/server';
import { SERVER_WEBHOOK_URLS } from '@/config/server-webhooks';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.', applications: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userEmailRaw = searchParams.get('email');

    // [보안] 클라이언트가 보낸 이메일이 아닌, 세션에 존재하는 진짜 이메일만 신뢰합니다.
    const secureEmail = user.email;

    if (!SERVER_WEBHOOK_URLS.GET_DASHBOARD_APPLICATIONS) {
      return NextResponse.json(
        { error: 'n8n 웹훅이 설정되지 않았습니다. 관리자에게 문의하세요.', applications: [] },
        { status: 200 }
      );
    }

    const response = await fetch(SERVER_WEBHOOK_URLS.GET_DASHBOARD_APPLICATIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: secureEmail }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'n8n 워크플로우가 활성화되지 않았습니다.', applications: [] },
        { status: 200 }
      );
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      return NextResponse.json({ applications: [] });
    }

    let rawData: any;
    try {
      rawData = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'n8n 응답 형식이 올바르지 않습니다.', applications: [] });
    }

    if (rawData.applications) {
      return NextResponse.json(rawData);
    }
    return NextResponse.json({ applications: Array.isArray(rawData) ? rawData : [] });

  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.', applications: [] },
      { status: 200 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { request_id } = await req.json();

    if (!request_id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // N8N 취소 웹훅 (매니저 쪽과 동일한 엔드포인트 사용)
    const CANCEL_WEBHOOK = 'https://primary-production-1f39e.up.railway.app/webhook/cancel-assignment';
    
    // [보안] 자신이 취소하는 것인지 추가 인증이 이상적이나 여기서는 우선 email 로깅 차원에서 보안 처리
    const response = await fetch(CANCEL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manager_email: 'client_cancel', // N8N에서 사용자 취소 구분
        canceled_requests: [request_id],
        user_email: user.email, // 보안강화: 실제 취소 요청자 인증 기록
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '취소 요청 처리에 실패했습니다.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: '상담이 취소되었습니다.' });

  } catch (error) {
    console.error('[Dashboard API DELETE] Error:', error);
    return NextResponse.json(
      { error: '취소 요청 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
