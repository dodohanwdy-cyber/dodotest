import { NextResponse } from 'next/server';
import { WEBHOOK_URLS } from '@/config/webhooks';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // n8n 웹훅이 설정되지 않은 경우
    if (!WEBHOOK_URLS.GET_DASHBOARD_APPLICATIONS) {
      console.log('[Dashboard API] n8n 웹훅이 설정되지 않았습니다.');
      return NextResponse.json(
        { 
          error: 'n8n 웹훅이 설정되지 않았습니다. 관리자에게 문의하세요.',
          applications: [] // 빈 배열 반환하여 UI가 깨지지 않도록
        },
        { status: 200 } // 에러가 아닌 정상 응답으로 처리
      );
    }

    console.log('[Dashboard API] n8n 웹훅 호출:', WEBHOOK_URLS.GET_DASHBOARD_APPLICATIONS);
    console.log('[Dashboard API] 사용자 이메일:', userEmail);

    // n8n 웹훅 호출 (POST 방식)
    const response = await fetch(
      WEBHOOK_URLS.GET_DASHBOARD_APPLICATIONS,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      }
    );

    console.log('[Dashboard API] n8n 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      // 404 Not Found 등의 에러는 워크플로우가 없거나 비활성화된 경우
      console.error('[Dashboard API] n8n webhook error:', response.status, response.statusText);
      
      return NextResponse.json(
        { 
          error: 'n8n 워크플로우가 활성화되지 않았습니다. 관리자에게 문의하세요.',
          applications: [] // 빈 배열 반환
        },
        { status: 200 } // 정상 응답으로 처리하여 UI가 깨지지 않도록
      );
    }

    // 응답 텍스트 가져오기
    const responseText = await response.text();
    console.log('[Dashboard API] n8n 응답 텍스트:', responseText);

    // 빈 응답 처리
    if (!responseText || responseText.trim() === '') {
      console.warn('[Dashboard API] n8n이 빈 응답을 반환했습니다.');
      return NextResponse.json({
        applications: [],
        message: 'n8n 워크플로우가 데이터를 반환하지 않았습니다.'
      });
    }

    // JSON 파싱
    let rawData;
    try {
      rawData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Dashboard API] JSON 파싱 에러:', parseError);
      console.error('[Dashboard API] 응답 내용:', responseText);
      return NextResponse.json({
        error: 'n8n 응답 형식이 올바르지 않습니다.',
        applications: []
      });
    }

    console.log('[Dashboard API] n8n 응답 데이터 (원본):', rawData);
    
    // n8n에서 반환한 데이터 구조 확인
    if (rawData.applications) {
      return NextResponse.json(rawData);
    } else {
      // 데이터 구조가 다른 경우 변환
      return NextResponse.json({ applications: Array.isArray(rawData) ? rawData : [] });
    }
  } catch (error: any) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { 
        error: '데이터를 불러오는 중 오류가 발생했습니다.',
        applications: [] // 에러 시에도 빈 배열 반환
      },
      { status: 200 } // 정상 응답으로 처리
    );
  }
}
