// hooks/useAuth.ts — next-auth wrapper with loading flag
import { useSession, signIn, signOut } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  const getSafeCallback = () => {
    if (typeof window === 'undefined') return '/'
    const params = new URLSearchParams(window.location.search)
    const cb = params.get('callbackUrl') || '/'
    try {
      const u = new URL(cb, window.location.origin)
      return u.pathname.startsWith('/login') ? '/' : u.toString()
    } catch {
      return !cb || cb.includes('/login') ? '/' : cb
    }
  }

  return {
    user: status === 'authenticated' ? session?.user ?? null : null,
    loading: status === 'loading',
    login: (provider: 'credentials'|'google'|'facebook' = 'credentials', opts: Record<string, any> = {}) =>
      signIn(provider, { callbackUrl: getSafeCallback(), ...opts }),
    logout: () => signOut({ callbackUrl: '/' }),
  }
}
