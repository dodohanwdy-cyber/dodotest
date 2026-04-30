'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: string | null
  loading: boolean
  isLoading: boolean
  signOut: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async (userId: string) => {
      try {
        const { data } = await supabase.from('user_profiles').select('role').eq('id', userId).single()
        if (isMounted) setUserRole(data?.role || 'client')
      } catch (e) {
        if (isMounted) setUserRole('client')
      }
    }

    // 1. 초기 세션을 명시적으로 한 번 가져와서 무한 로딩(버튼 사라짐) 방지
    const initSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) console.error("getSession error:", error);
        if (!isMounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchRole(initialSession.user.id);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("AuthContext initSession error:", err);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setUserRole(null);
        }
      } finally {
        if (isMounted) setLoading(false); // 로딩 즉시 해제
      }
    };

    initSession();

    // 2. 이후 로그인/로그아웃 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // 이미 위에서 초기화를 했으므로 INITIAL_SESSION 이벤트는 무시하여 충돌 방지
        if (!isMounted || event === 'INITIAL_SESSION') return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchRole(currentSession.user.id);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, isLoading: loading, signOut, logout: signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
