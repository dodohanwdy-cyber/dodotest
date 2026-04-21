'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩이 끝난 후 권한 체크
    if (!isLoading) {
      if (!user) {
        // 로그인하지 않은 경우 로그인 페이지로
        router.push('/login');
      } else if (userRole !== 'manager') {
        // 로그인했지만 매니저가 아닌 경우 (Client 등) 메인으로 리다이렉트
        // 또는 접근 권한 없음 페이지로 보낼 수 있습니다.
        router.push('/');
      }
    }
  }, [user, userRole, isLoading, router]);

  // 로딩 중이거나 권한이 없는 경우 화면을 보여주지 않음 (깜빡임 방지용 가드)
  if (isLoading || !user || userRole !== 'manager') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-zinc-500 font-medium animate-pulse">관리 권한을 확인하고 있습니다...</p>
      </div>
    );
  }

  // 권한이 확인된 경우에만 하위 페이지(Children)를 렌더링
  return <>{children}</>;
}
