'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { Turnstile } from '@marsidev/react-turnstile'
import { signIn } from 'next-auth/react'
import { FaGoogle, FaFacebook } from 'react-icons/fa'

type LoginResponse =
  | { message: string }
  | {
      message: string
      id: string
      username: string
      visitedCountries?: string[]
      email?: string
    }

export default function LoginPage() {
  const { user, login } = useAuth()
  const router = useRouter()
  const redirect = (router.query.redirect as string) || '/profil'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const turnstileRef = useRef<any>(null)

  useEffect(() => {
    if (user) router.replace(redirect)
  }, [user, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    if (!token) {
      setMessage('Potwierdź, że nie jesteś robotem.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, token }),
      })

      const data: LoginResponse = await res.json()
      setLoading(false)

      if (res.ok && 'id' in data) {
        login({
          id: data.id,
          username: data.username,
          visitedCountries: data.visitedCountries || [],
          email: data.email,
        })
        router.push(redirect)
      } else {
        setMessage(data.message || 'Nieprawidłowy login lub hasło.')
        turnstileRef.current?.reset()
        setToken(null)
      }
    } catch (err) {
      console.error('❌ Błąd sieci:', err)
      setMessage('Wystąpił błąd sieci. Spróbuj ponownie później.')
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow text-center">
      <h1 className="text-2xl font-bold mb-6 text-[#f1861e]">Logowanie</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Email lub nazwa użytkownika"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Hasło"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
          autoComplete="current-password"
        />

        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={setToken}
          onExpire={() => setToken(null)}
          ref={turnstileRef}
          className="self-center"
        />

        <button
          type="submit"
          className="bg-[#f1861e] text-white py-2 rounded hover:bg-orange-600 transition disabled:opacity-50"
          disabled={!token || loading}
        >
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        Nie masz konta?{' '}
        <a href="/register" className="text-[#f1861e] underline">
          Zarejestruj się
        </a>
      </p>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        <a href="/reset-hasla" className="text-[#f1861e] underline">
          Nie pamiętasz hasła?
        </a>
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={() => signIn('google', { callbackUrl: redirect })}
          className="flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
        >
          <FaGoogle /> Zaloguj się przez Google
        </button>
        <button
          onClick={() => signIn('facebook', { callbackUrl: redirect })}
          className="flex items-center justify-center gap-2 bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
        >
          <FaFacebook /> Zaloguj się przez Facebook
        </button>
      </div>
    </main>
  )
}
