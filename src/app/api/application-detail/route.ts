import { NextResponse } from 'next/server';
import { WEBHOOK_URLS } from '@/config/webhooks';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // n8n 웹훅이 설정되지 않은 경우
    if (!WEBHOOK_URLS.GET_APPLICATION_DETAIL) {
      return NextResponse.json(
        { 
          error: 'n8n 웹훅이 설정되지 않았습니다. 관리자에게 문의하세요.'
        },
        { status: 503 }
      );
    }

    console.log('[Application Detail API] n8n 웹훅 호출:', WEBHOOK_URLS.GET_APPLICATION_DETAIL);
    console.log('[Application Detail API] 신청 ID:', id);

    // n8n 웹훅 호출 (POST 방식)
    const response = await fetch(
      WEBHOOK_URLS.GET_APPLICATION_DETAIL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: id }), // request_id 필드명으로 전송
      }
    );

    console.log('[Application Detail API] n8n 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[Application Detail API] n8n webhook error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'n8n 워크플로우가 활성화되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 503 }
      );
    }

    const rawData = await response.json();
    console.log('[Application Detail API] n8n 응답 데이터 (원본):', rawData);
    
    // n8n이 배열 형태로 반환하는 경우 처리
    let data;
    if (Array.isArray(rawData)) {
      // 배열의 첫 번째 요소 사용
      const firstItem = rawData[0];
      if (firstItem && firstItem.status === 'success' && firstItem.data) {
        data = firstItem.data;
      } else {
        data = firstItem;
      }
    } else if (rawData.status === 'success' && rawData.data) {
      data = rawData.data;
    } else {
      data = rawData;
    }

    console.log('[Application Detail API] 처리된 데이터:', data);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Application Detail API] Error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
