import { NextResponse } from 'next/server';

// 메모리 캐싱을 위한 선언 (Vercel Serverless 단일 인스턴스 내 큐잉 유지용)
if (!(globalThis as any).notificationsQueue) {
  (globalThis as any).notificationsQueue = [];
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // n8n에서 보내준 데이터를 글로벌 배열에 저장
    (globalThis as any).notificationsQueue.push({
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, message: "알림 접수 성공" });
  } catch (err) {
    return NextResponse.json({ error: "잘못된 요청 양식입니다." }, { status: 400 });
  }
}

export async function GET() {
  // 현재 큐에 있는 모든 알림을 가져온 뒤
  const currentNotifications = [...((globalThis as any).notificationsQueue || [])];
  
  // 클라이언트가 가져간 알림은 배열에서 제거하여 중복 노출 방지
  (globalThis as any).notificationsQueue = []; 
  
  return NextResponse.json({ notifications: currentNotifications });
}
