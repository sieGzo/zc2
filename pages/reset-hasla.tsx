import { useState } from 'react'
import Head from 'next/head'

export default function ResetHaslaPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/auth/reset-password-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
    }
    setMessage(data.message)
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow text-center">
	<Head>
	  <title>Reset hasła – Zwiedzaj Chytrze</title>
	</Head>
      <h1 className="text-2xl font-bold text-[#f1861e] mb-4">Resetowanie hasła</h1>
      {success ? (
        <p className="text-green-600">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Podaj swój e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="bg-[#f1861e] text-white py-2 rounded w-full"
          >
            Wyślij link do resetu
          </button>
        </form>
      )}
      {message && !success && (
        <p className="mt-4 text-sm text-red-500">{message}</p>
      )}
    </main>
  )
}
