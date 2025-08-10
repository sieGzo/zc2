// pages/login.tsx
import { useState, useEffect, useMemo } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"

const errorMessages: Record<string, string> = {
  EmailNotVerified: "Najpierw potwierdź e-mail.",
  CredentialsSignin: "Nieprawidłowe dane logowania.",
  OAuthSignin: "Błąd logowania przez dostawcę.",
  OAuthCallback: "Błąd podczas autoryzacji dostawcy.",
  OAuthAccountNotLinked: "To konto jest już powiązane z inną metodą logowania.",
  AccessDenied: "Dostęp zabroniony.",
  Configuration: "Błąd konfiguracji logowania.",
  default: "Wystąpił błąd. Spróbuj ponownie.",
}

export default function Login() {
  const router = useRouter()
  const [emailOrUsername, setEmailOrUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // „Bezpieczny” callbackUrl — nigdy nie wracamy na /login
  const safeCallbackUrl = useMemo(() => {
    const raw = typeof router.query.callbackUrl === "string" ? router.query.callbackUrl : "/"
    try {
      const url = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
      return url.pathname.startsWith("/login") ? "/" : url.toString()
    } catch {
      return !raw || raw.includes("/login") ? "/" : raw
    }
  }, [router.query.callbackUrl])

  // Przechwycenie błędów NextAuth z ?error=... i komunikat „verified”
  useEffect(() => {
    if (typeof router.query.error === "string") {
      const msg = errorMessages[router.query.error] || errorMessages.default
      setError(msg)
    }
    // jeśli wracamy z weryfikacji e-maila
    if (router.query.verified === "1") {
      setError(null)
    }
  }, [router.query.error, router.query.verified])

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        callbackUrl: safeCallbackUrl,
        email: emailOrUsername,
        username: emailOrUsername,
        password,
      })
      if (res?.error) {
        const msg = errorMessages[res.error] || errorMessages.default
        setError(msg)
        return
      }
      if (res?.url) {
        router.push(res.url)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-lg mx-auto my-14 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow">
      <Head><title>Logowanie — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-extrabold text-center mb-6">Zaloguj się</h1>

      {router.query.verified === "1" && (
        <div className="mb-4 bg-green-100 text-green-700 p-3 rounded">
          Adres e-mail został potwierdzony. Możesz się zalogować.
        </div>
      )}
      {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>}

      <form onSubmit={handleCredentials} className="space-y-3">
        <label className="block">
          <span className="text-sm">Email lub nazwa użytkownika</span>
          <input
            value={emailOrUsername}
            onChange={(e) => { setEmailOrUsername(e.target.value); setError(null) }}
            className="w-full border rounded p-2"
            required
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="text-sm">Hasło</span>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null) }}
            className="w-full border rounded p-2"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={loading} className="w-full bg-[#f1861e] hover:bg-orange-600 text-white py-2 rounded-lg">
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm space-y-1">
        <p>
          Nie masz konta?{" "}
          <Link href="/register" className="text-[#f1861e] underline">Zarejestruj się</Link>
        </p>
        <p>
          Zapomniałeś hasła?{" "}
          <Link href="/reset-hasla" className="underline">Zresetuj</Link>
        </p>
      </div>

      <hr className="my-6" />

      <div className="space-y-3">
        <button
          onClick={() => signIn("google", { callbackUrl: safeCallbackUrl })}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
        >
          Zaloguj przez Google
        </button>
        <button
          onClick={() => signIn("facebook", { callbackUrl: safeCallbackUrl })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
        >
          Zaloguj przez Facebook
        </button>
      </div>
    </section>
  )
}
