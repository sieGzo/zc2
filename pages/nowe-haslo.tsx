import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function NoweHasloPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (router.isReady) {
      const queryToken = router.query.token
      if (typeof queryToken === 'string') {
        setToken(queryToken)
      } else {
        setMessage('Brak tokena w linku.')
      }
      setLoading(false)
    }
  }, [router.isReady, router.query.token])

  const isStrongPassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (password !== confirm) {
      return setMessage('Hasła się nie zgadzają.')
    }

    if (!isStrongPassword(password)) {
      return setMessage('Hasło musi mieć min. 8 znaków, wielką literę i znak specjalny.')
    }

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
      setMessage(data.message)
      setTimeout(() => router.push('/login'), 3000)
    } else {
      setMessage(data.message || 'Nie udało się ustawić nowego hasła.')
    }
  }

  return (
    <>
      <Head>
        <title>Ustaw nowe hasło – Zwiedzaj Chytrze</title>
      </Head>

      <main className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow text-center">
        <h1 className="text-2xl font-bold text-[#f1861e] mb-4">Ustaw nowe hasło</h1>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Ładowanie...</p>
        ) : success ? (
          <p className="text-green-600">{message}</p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Nowe hasło"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
              />
              <input
                type="password"
                placeholder="Powtórz hasło"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
              />
              <button type="submit" className="bg-[#f1861e] text-white py-2 rounded w-full">
                Zmień hasło
              </button>
            </form>

            {message && (
              <p className="mt-4 text-sm text-red-500">{message}</p>
            )}
          </>
        )}
      </main>
    </>
  )
}
