// components/SessionSync.tsx
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuth } from '../hooks/useAuth'

export default function SessionSync() {
  const { data: session } = useSession()
  const { login } = useAuth()

  useEffect(() => {
    if (session?.user) {
      login({
        id: session.user.id || '',
        username: session.user.name || session.user.email?.split('@')[0] || 'Użytkownik',
        email: session.user.email || '',
        visitedCountries: [], // Dodasz potem z bazy, jeśli chcesz
      })
    }
  }, [session, login])

  return null
}
