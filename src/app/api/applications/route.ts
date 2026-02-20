import { NextResponse } from 'next/server';
import { WEBHOOK_URLS } from '@/config/webhooks';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!WEBHOOK_URLS.GET_DASHBOARD_APPLICATIONS) {
      return NextResponse.json(
        { error: 'n8n 웹훅이 설정되지 않았습니다. 관리자에게 문의하세요.', applications: [] },
        { status: 200 }
      );
    }

    const response = await fetch(WEBHOOK_URLS.GET_DASHBOARD_APPLICATIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'n8n 워크플로우가 활성화되지 않았습니다. 관리자에게 문의하세요.', applications: [] },
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
