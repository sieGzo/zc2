// pages/login.tsx
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/router"

export default function Login() {
  const router = useRouter()
  const [emailOrUsername, setEmailOrUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Jeśli NextAuth zwróci error w URL (np. z callbacka), pokaż go
  useEffect(() => {
    if (typeof router.query.error === "string") {
      setError(router.query.error)
    }
  }, [router.query.error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn("credentials", {
      redirect: false,
      email: emailOrUsername,     // ważne: backend musi akceptować email LUB username
      username: emailOrUsername,  // patrz authorize() po stronie [...nextauth]
      password,
      callbackUrl: "/",           // dokąd po udanym loginie
    })

    setLoading(false)

    if (!res || res.error) {
      setError(res?.error || "Nie udało się zalogować")
      return
    }

    // sukces → przekierowanie
    window.location.href = res.url || "/"
  }

  return (
    <section className="section flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="title text-2xl font-bold text-center mb-6">
          Zaloguj się
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email lub nazwa użytkownika
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hasło
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div className="my-6 border-t border-gray-300"></div>

        <div className="space-y-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
          >
            Zaloguj przez Google
          </button>

          <button
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Zaloguj przez Facebook
          </button>
        </div>
      </div>
    </section>
  )
}
