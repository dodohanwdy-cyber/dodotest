'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      toast('로그인이 필요한 페이지입니다.', 'error')
      router.push('/login')
    }
  }, [user, authLoading, router, toast])

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !initialFetchDone) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()

        if (data && !error) {
          setFullName(data.full_name || '')
          setPhone(data.phone || '')
        }
        setInitialFetchDone(true)
      }
    }
    fetchProfile()
  }, [user, initialFetchDone])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: fullName,
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      toast('프로필 업데이트에 실패했습니다.', 'error')
    } else {
      toast('프로필이 성공적으로 업데이트되었습니다.', 'success')
    }
    setLoading(false)
  }

  if (authLoading || (!user && !initialFetchDone)) {
    return <div className="text-center mt-20">로딩 중...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl border border-zinc-100">
      <h1 className="text-2xl font-bold mb-6 text-center">회원 정보 변경</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">이메일 (변경 불가)</label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-500 outline-none"
          />
        </div>
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
          <label className="block text-sm font-medium text-zinc-700 mb-1">연락처</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            placeholder="010-1234-5678"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? '저장 중...' : '변경 내용 저장'}
        </button>
      </form>
    </div>
  )
}
