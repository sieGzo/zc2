// pages/register.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Turnstile } from '@marsidev/react-turnstile'
import Head from 'next/head'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [usernameError, setUsernameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [subscribe, setSubscribe] = useState(false)
  const [nickname, setNickname] = useState('')

  const isStrongPassword = (password: string) =>
    password.length >= 8 && /[A-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password)

  const checkAvailability = async (field: 'email' | 'username', value: string) => {
    if (!value) return
    try {
      const res = await fetch(`/api/auth/check-availability?${field}=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (field === 'email') setEmailError(data.emailTaken ? 'Ten e-mail jest już zarejestrowany.' : '')
      if (field === 'username') setUsernameError(data.usernameTaken ? 'Nazwa użytkownika jest zajęta.' : '')
    } catch (err) {
      console.error('❌ Błąd sprawdzania dostępności:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setSuccess(false)

    if (!isStrongPassword(form.password)) {
      setMessage('Hasło musi mieć min. 8 znaków, wielką literę i znak specjalny.')
      return
    }
    if (emailError || usernameError) {
      setMessage('Popraw błędy formularza.')
      return
    }
    if (!turnstileToken) {
      setMessage('Potwierdź, że nie jesteś robotem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken }),
      })
      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        setSuccess(true)

        // (opcjonalnie) newsletter
        if (subscribe) {
          const name = (nickname || form.username || form.email.split('@')[0]).trim()
          try {
            await fetch('/api/newsletter/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: form.email, name }),
            })
          } catch {}
        }

        // Bez auto-logowania – wymagamy potwierdzenia e-maila
        router.push('/potwierdz-email-wyslany')
      } else {
        setMessage(data.message || 'Wystąpił błąd podczas rejestracji.')
      }
    } catch (error) {
      console.error('❌ Błąd sieci przy rejestracji:', error)
      setLoading(false)
      setMessage('Nie udało się połączyć z serwerem.')
    }
  }

  return (
    <>
      <Head>
        <title>Rejestracja – Zwiedzaj Chytrze</title>
      </Head>
      <main className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#f1861e]">Rejestracja</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nazwa użytkownika"
            value={form.username}
            onChange={e => { setForm({ ...form, username: e.target.value }); setUsernameError('') }}
            onBlur={() => checkAvailability('username', form.username)}
            className="p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
            required
            autoComplete="username"
          />
          {usernameError && <p className="text-sm text-red-500 -mt-2">{usernameError}</p>}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => { setForm({ ...form, email: e.target.value }); setEmailError('') }}
            onBlur={() => checkAvailability('email', form.email)}
            className="p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
            required
            autoComplete="email"
          />
          {emailError && <p className="text-sm text-red-500 -mt-2">{emailError}</p>}

          <input
            type="password"
            placeholder="Hasło"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
            required
            autoComplete="new-password"
            aria-describedby="password-requirements"
          />
          <small id="password-requirements" className="text-sm text-gray-500 dark:text-gray-400">
            Hasło: min. 8 znaków, wielka litera i znak specjalny.
          </small>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={subscribe} onChange={e => setSubscribe(e.target.checked)} />
            Zapisz mnie do newslettera
          </label>

          {subscribe && (
            <input
              type="text"
              placeholder="Jak się do Ciebie zwracać?"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-900 dark:text-white"
            />
          )}

          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken('')}
            className="self-center"
          />

          <button
            type="submit"
            disabled={loading}
            className={`bg-[#f1861e] text-white py-2 rounded transition ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
          >
            {loading ? 'Rejestruję...' : 'Zarejestruj się'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}
        {success && <p className="mt-4 text-center text-sm text-green-600">Wysłano e-mail weryfikacyjny!</p>}

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
          Masz już konto? <a href="/login" className="text-[#f1861e] underline">Zaloguj się</a>
        </p>

        <div className="mt-6 flex flex-col gap-2 text-center">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Zaloguj się przez Google
          </button>
          <button
            onClick={() => signIn('facebook', { callbackUrl: '/' })}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Zaloguj się przez Facebook
          </button>
        </div>
      </main>
    </>
  )
}
