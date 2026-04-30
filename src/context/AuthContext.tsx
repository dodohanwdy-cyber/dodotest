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
        const cachedRole = typeof window !== 'undefined' ? localStorage.getItem(`role_${userId}`) : null;
        if (cachedRole && isMounted) {
          setUserRole(cachedRole);
        }

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        const fetchPromise = supabase.from('user_profiles').select('role').eq('id', userId).single();
        
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
        if (isMounted && !userRole) setUserRole('client');
      }
    }

    const initSession = async () => {
      try {
        const sessionTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('session_timeout')), 5000));
        const sessionPromise = supabase.auth.getSession();
        
        const response = await Promise.race([sessionPromise, sessionTimeout]) as any;
        if (!isMounted) return;
        
        const initialSession = response?.data?.session || null;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          fetchRole(initialSession.user.id);
        } else {
          setUserRole(null);
        }
      } catch (err: any) {
      } finally {
        if (isMounted) {
          setLoading(false);
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
        if (!isMounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          fetchRole(currentSession.user.id);
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
