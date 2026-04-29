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
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    // Role 검사를 통해 불필요한 열람 제어가 필요할 수 있음
    // const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    // if (profile?.role !== 'manager' && profile?.role !== 'client') { ... }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (!SERVER_WEBHOOK_URLS.GET_APPLICATION_DETAIL) {
      return NextResponse.json(
        { error: 'n8n 웹훅이 설정되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 503 }
      );
    }

    const response = await fetch(SERVER_WEBHOOK_URLS.GET_APPLICATION_DETAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id, email: user.email }), // 이메일 동봉하여 n8n에서 유효성 검사 수행 가능
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'n8n 워크플로우가 활성화되지 않았습니다.' },
        { status: 503 }
      );
    }

    const rawData = await response.json();

    let data: any;
    if (Array.isArray(rawData)) {
      const firstItem = rawData[0];
      data = firstItem?.status === 'success' && firstItem?.data ? firstItem.data : firstItem;
    } else if (rawData.status === 'success' && rawData.data) {
      data = rawData.data;
    } else {
      data = rawData;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Application Detail API] Error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
