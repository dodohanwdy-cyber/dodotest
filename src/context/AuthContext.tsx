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
        // 빠른 화면 렌더링을 위해 캐시된 권한 선적용
        const cachedRole = typeof window !== 'undefined' ? localStorage.getItem(`role_${userId}`) : null;
        if (cachedRole && isMounted) {
          setUserRole(cachedRole);
        }

        // Supabase DB 조회 (최대 3초 대기)
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
        const fetchPromise = supabase.from('user_profiles').select('role').eq('id', userId).single();
        
        // 에러가 발생해도 진행되도록 감싸기
        const response = await Promise.race([fetchPromise, timeoutPromise]).catch(() => ({ data: null, error: true }));
        const data = (response as any)?.data;
        
        if (isMounted) {
          const fetchedRole = data?.role || cachedRole || 'client';
          setUserRole(fetchedRole);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`role_${userId}`, fetchedRole);
          }
        }
      } catch (e) {
        console.error("[AuthContext] fetchRole error:", e);
        if (isMounted && !userRole) setUserRole('client');
      }
    }

    // 1. 초기 세션을 명시적으로 한 번 가져와서 무한 로딩(버튼 사라짐) 방지
    const initSession = async () => {
      try {
        // getSession이 네트워크 문제로 무한 대기하는 현상 방지 (최대 3초)
        const sessionTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('session_timeout')), 3000));
        const sessionPromise = supabase.auth.getSession();
        
        const response = await Promise.race([sessionPromise, sessionTimeout]) as any;
        if (response?.error) console.error("getSession error:", response.error);
        if (!isMounted) return;
        
        const initialSession = response?.data?.session || null;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchRole(initialSession.user.id);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("[AuthContext] initSession error:", err);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setUserRole(null);
        }
      } finally {
        // 무조건 최우선으로 로딩을 해제하여 빈 화면(스켈레톤)에 갇히는 것을 방지
        if (isMounted) {
          setLoading(false);
          // 엣지 케이스 방어: fallback 강제 해제
          setTimeout(() => {
            if (isMounted) setLoading(false);
          }, 100);
        }
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
