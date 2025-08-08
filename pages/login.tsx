// pages/login.tsx
import { useState, useEffect, useMemo } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/router"

export default function Login() {
  const router = useRouter()
  const [emailOrUsername, setEmailOrUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bezpieczny callbackUrl: jeśli w URL jest callbackUrl do /login, zignoruj (zapobiega pętli)
  const safeCallbackUrl = useMemo(() => {
    const raw = typeof router.query.callbackUrl === "string" ? router.query.callbackUrl : "/"
    try {
      const url = new URL(raw, window.location.origin)
      return url.pathname.startsWith("/login") ? "/" : url.toString()
    } catch {
      return raw.includes("/login") ? "/" : raw || "/"
    }
  }, [router.query.callbackUrl])

  useEffect(() => {
    if (typeof router.query.error === "string") {
      setError(router.query.error)
    }
  }, [router.query.error])

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn("credentials", {
      redirect: true,
      callbackUrl: safeCallbackUrl,
      email: emailOrUsername,
      username: emailOrUsername,
      password,
    })
    setLoading(false)
    // signIn with redirect:true przejmie nawigację
  }

  return (
    <section className="max-w-lg mx-auto my-10 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow">
      <h1 className="text-3xl font-extrabold text-center mb-6">Zaloguj się</h1>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded"> {error} </div>
      )}

      <form onSubmit={handleCredentials} className="space-y-3">
        <label className="block">
          <span className="text-sm">Email lub nazwa użytkownika</span>
          <input
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm">Hasło</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#f1861e] hover:bg-orange-600 text-white py-2 rounded-lg"
        >
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>

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
