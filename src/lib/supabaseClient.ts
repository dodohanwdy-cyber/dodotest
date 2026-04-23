import { createBrowserClient } from '@supabase/ssr'

// 클라이언트와 서버가 '쿠키'를 통해 로그인 상태를 완벽하게 공유하도록 설정합니다.
// 이를 통해 새로고침(F5) 시에도 로그인 상태가 유지되고 미들웨어 권한 체크가 정상 작동합니다.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
