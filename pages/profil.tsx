// pages/profil.tsx
'use client'

import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ProfilPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login?callbackUrl=' + encodeURIComponent('/profil'))
    }
  }, [user])

  if (!user) return null

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center transition">
        <h1 className="text-4xl font-bold text-[#f1861e] mb-2">Twój profil</h1>
        <p className="text-lg mb-4">Witaj, <strong>{user.username}</strong>!</p>

        {user.email && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Email (z newslettera): <span className="font-semibold">{user.email}</span>
          </p>
        )}

        {user.age && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Wiek: <span className="font-semibold">{user.age}</span>
          </p>
        )}

        <div className="mt-6">
          <Link
            href="/profil/mapa"
            className="inline-block mt-2 px-4 py-2 rounded bg-[#f1861e] text-white hover:bg-orange-600 transition"
          >
            🌍 Zobacz odwiedzone kraje
          </Link>
        </div>
      </div>
    </main>
  )
}
