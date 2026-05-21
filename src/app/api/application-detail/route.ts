import { NextResponse } from 'next/server';
import { SERVER_WEBHOOK_URLS } from '@/config/server-webhooks';
import { createClient } from '@/lib/supabaseServer';
import { n8nFetch } from '@/lib/n8nClient';

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

    const response = await n8nFetch(SERVER_WEBHOOK_URLS.GET_APPLICATION_DETAIL, {
      method: 'POST',
      body: JSON.stringify({ request_id: id, email: user.email }), // 이메일 동봉하여 n8n에서 유효성 검사 수행 가능
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'no body');
      console.error(`[Application Detail API] n8n error status: ${response.status}, body: ${errorText}`);
      
      const activeApiKey = process.env.NEXT_PUBLIC_N8N_API_KEY || process.env.N8N_API_KEY;
      const apiKeyExists = !!activeApiKey;
      const apiKeyLength = activeApiKey ? activeApiKey.length : 0;
      const apiEnvStatus = apiKeyExists ? `설정됨 (글자수: ${apiKeyLength}자)` : '누락됨 (빈 값)';

      return NextResponse.json(
        { 
          error: `n8n 웹훅 호출 실패 (Status: ${response.status}). 워크플로우가 비활성화 상태이거나 인증 정보가 잘못되었습니다.`,
          details: errorText.slice(0, 200),
          nextJsEnvStatus: apiEnvStatus
        },
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
