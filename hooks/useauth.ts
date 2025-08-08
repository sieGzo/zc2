// hooks/useAuth.ts
import { signIn, signOut, useSession } from "next-auth/react"

type User = {
  username?: string
  id?: string
  age?: number
  email?: string
  image?: string
}

interface AuthContextType {
  user: User | null
  login: (provider?: string, opts?: Record<string, any>) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

export function useAuth(): AuthContextType {
  const { data: session } = useSession()

  const getSafeCallback = () => {
    if (typeof window === "undefined") return "/"
    const params = new URLSearchParams(window.location.search)
    const cb = params.get("callbackUrl") || "/"
    try {
      const url = new URL(cb, window.location.origin)
      return url.pathname.startsWith("/login") ? "/" : url.toString()
    } catch {
      return !cb || cb.includes("/login") ? "/" : cb
    }
  }

  const login = (provider: string = "credentials", opts: Record<string, any> = {}) => {
    const callbackUrl = getSafeCallback()
    return signIn(provider, { callbackUrl, ...opts })
  }

  const logout = () => signOut({ callbackUrl: "/" })

  const updateUser = (_data: Partial<User>) => {}

  return {
    user: session?.user
      ? {
          username: (session.user as any).username || session.user.name || "",
          id: (session.user as any).id || "",
          age: (session.user as any).age,
          email: session.user.email || "",
          image: session.user.image || "",
        }
      : null,
    login,
    logout,
    updateUser,
  }
}
