'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/context/ToastContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast('로그인에 실패했습니다. 이메일이나 비밀번호를 확인해주세요.', 'error')
    } else {
      toast('성공적으로 로그인되었습니다.', 'success')
      
      // 💡 핵심 수정 포인트: 브라우저가 쿠키를 받았음을 서버(Next.js)에 강제로 동기화!
      // 이 한 줄이 있어야 미들웨어와 레이아웃이 유저를 튕겨내지 않습니다.
      router.refresh()

      const loggedInUser = data.user
      if (loggedInUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', loggedInUser.id)
          .single()
        
        if (profile?.role === 'manager') {
          router.push('/manager/dashboard')
        } else {
          router.push('/client/dashboard')
        }
      } else {
        router.push('/')
      }
    }
    
    setLoading(false)
  }

  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
            열고닫기 로그인
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-bold">
            안전하고 스마트한 정책 상담을 시작하세요.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="********"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 flex justify-center bg-gradient-to-r from-blue-500 to-primary text-white rounded-xl font-black text-[15px] hover:opacity-90 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 font-medium">
              아직 계정이 없으신가요?{' '}
              <Link href="/signup" className="font-bold text-primary hover:text-blue-600 transition-colors underline underline-offset-2">
                회원가입하기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
