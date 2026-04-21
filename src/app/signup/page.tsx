'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('회원가입이 완료되었습니다!', 'success')
      router.push('/')
    }
    
    setLoading(false)
  }

  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
            열고닫기 회원가입
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-bold">
            안전하고 스마트한 계정을 만들어 보세요.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">이름</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="홍길동"
              />
            </div>
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
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 font-medium">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-bold text-primary hover:text-blue-600 transition-colors underline underline-offset-2">
                로그인하기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
