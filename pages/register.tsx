// pages/register.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Turnstile } from '@marsidev/react-turnstile'
import Head from 'next/head'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

type FormState = { username: string; email: string; password: string }

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isStrongPassword = (p: string) =>
  p.length >= 8 && /[A-Z]/.test(p) && /[^a-zA-Z0-9]/.test(p)

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ username: '', email: '', password: '' })
  const [usernameError, setUsernameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [tsError, setTsError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [subscribe, setSubscribe] = useState(false)
  const [nickname, setNickname] = useState('')
  const [widgetKey, setWidgetKey] = useState(0) // wymusza rerender widgetu (reset)

  const btnRef = useRef<HTMLButtonElement>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  // prosta walidacja e-maila lokalnie (żeby nie walić 400 w API)
  useEffect(() => {
    if (!form.email) return
    setEmailError(emailRegex.test(form.email.trim().toLowerCase()) ? '' : 'Nieprawidłowy adres e-mail.')
  }, [form.email])

  const canSubmit = useMemo(() => {
    return (
      !!form.username &&
      !!form.email &&
      !!form.password &&
      !usernameError &&
      !emailError &&
      isStrongPassword(form.password) &&
      !!turnstileToken &&
      !loading
    )
  }, [form, usernameError, emailError, turnstileToken, loading])

  const checkAvailability = async (field: 'email' | 'username', value: string) => {
    if (!value) return
    try {
      const q = field === 'email'
        ? `/api/auth/check-availability?email=${encodeURIComponent(value.trim().toLowerCase())}`
        : `/api/auth/check-availability?username=${encodeURIComponent(value.trim())}`
      const res = await fetch(q, { cache: 'no-store' })
      const data = await res.json()
      if (field === 'email') setEmailError(data.emailTaken ? 'Ten e-mail jest już zarejestrowany.' : '')
      if (field === 'username') setUsernameError(data.usernameTaken ? 'Nazwa użytkownika jest zajęta.' : '')
    } catch (err) {
      // nie blokuj rejestracji, ale pokaż komunikat
      console.warn('check-availability error:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setSuccess(false)
    setTsError(null)

    // klientowa walidacja
    if (!isStrongPassword(form.password)) {
      setMessage('Hasło musi mieć min. 8 znaków, wielką literę i znak specjalny.')
      return
    }
    if (!emailRegex.test(form.email.trim().toLowerCase())) {
      setMessage('Nieprawidłowy adres e-mail.')
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
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          turnstileToken,
        }),
      })

      const data = await res.json().catch(() => ({} as any))

      if (res.ok) {
        setSuccess(true)

        // subskrypcja newslettera (best-effort)
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

        router.push('/potwierdz-email-wyslany')
        return
      }

      // mapowanie najczęstszych odpowiedzi backendu
      if (res.status === 409) {
        setMessage(typeof data?.message === 'string' ? data.message : 'E-mail lub nazwa użytkownika zajęta.')
      } else if (res.status === 400 && (data?.detail || data?.reason)) {
        // Turnstile / walidacja – pokaż bardziej treściwy komunikat
        const d = (data?.detail && JSON.stringify(data.detail)) || data?.reason || data?.message
        setMessage(`Weryfikacja nie powiodła się. Spróbuj ponownie. ${d ? `\n(${d})` : ''}`)
        // zresetuj widget dla pewności
        setWidgetKey((k) => k + 1)
        setTurnstileToken('')
      } else {
        setMessage(data?.message || 'Wystąpił błąd podczas rejestracji.')
      }
    } catch (error) {
      console.error('❌ Błąd sieci przy rejestracji:', error)
      setMessage('Nie udało się połączyć z serwerem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Rejestracja – Zwiedzaj Chytrze</title>
      </Head>

      <main className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#f1861e]">Rejestracja</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

          {/* Turnstile */}
          {siteKey ? (
            <div className="self-center">
              <Turnstile
                key={widgetKey}
                siteKey={siteKey}
                onSuccess={(t) => { setTurnstileToken(t); setTsError(null) }}
                onExpire={() => { setTurnstileToken(''); setTsError('Sesja potwierdzenia wygasła — zaznacz ponownie.') }}
                onError={() => { setTurnstileToken(''); setTsError('Weryfikacja nie powiodła się. Spróbuj ponownie.') }}
                options={{ retry: 'auto', retryInterval: 2000 }}
              />
            </div>
          ) : (
            <p className="text-xs text-amber-600 text-center">
              Brak NEXT_PUBLIC_TURNSTILE_SITE_KEY — w DEV rejestracja przejdzie bez weryfikacji.
            </p>
          )}
          {tsError && <p className="text-sm text-red-500 -mt-2 text-center">{tsError}</p>}

          <button
            ref={btnRef}
            type="submit"
            disabled={!canSubmit}
            className={`bg-[#f1861e] text-white py-2 rounded transition ${loading || !canSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
          >
            {loading ? 'Rejestruję...' : 'Zarejestruj się'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-red-500 whitespace-pre-line">{message}</p>}
        {success && <p className="mt-4 text-center text-sm text-green-600">Wysłano e-mail weryfikacyjny!</p>}

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
          Masz już konto? <Link href="/login" className="text-[#f1861e] underline">Zaloguj się</Link>
        </p>

        <div className="mt-6 flex flex-col gap-2 text-center">
          <button onClick={() => signIn('google', { callbackUrl: '/' })} className="bg-red-600 text-white py-2 rounded hover:bg-red-700">Zaloguj się przez Google</button>
        </div>
      </main>
    </>
  )
}
