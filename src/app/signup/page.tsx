'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'

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
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl border border-zinc-100">
      <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">이름</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            placeholder="홍길동"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            placeholder="example@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            placeholder="********"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </form>
    </div>
  )
}
