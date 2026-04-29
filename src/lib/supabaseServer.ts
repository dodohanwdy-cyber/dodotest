import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 서버 사이드 랜더링(SSR) 및 API 라우트에서 사용할 안전한 Supabase 클라이언트
export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 이 블록은 미들웨어나 API 라우트 등에서 호출될 때 안전하게 넘어갑니다.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) { }
        },
      },
    }
  )
}
