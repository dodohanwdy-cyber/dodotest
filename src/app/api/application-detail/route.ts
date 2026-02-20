import { NextResponse } from 'next/server';
import { WEBHOOK_URLS } from '@/config/webhooks';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (!WEBHOOK_URLS.GET_APPLICATION_DETAIL) {
      return NextResponse.json(
        { error: 'n8n 웹훅이 설정되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 503 }
      );
    }

    const response = await fetch(WEBHOOK_URLS.GET_APPLICATION_DETAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'n8n 워크플로우가 활성화되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 503 }
      );
    }

    const rawData = await response.json();

    // n8n이 배열 형태로 반환하는 경우 처리
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
