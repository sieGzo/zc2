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
  login: (provider?: string) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

export const useAuth = (): AuthContextType => {
  const { data: session } = useSession()

  const login = (provider?: string) => {
    signIn(provider) // jeśli brak providera → strona logowania
  }

  const logout = () => {
    signOut()
  }

  const updateUser = (data: Partial<User>) => {
    console.log("Update user:", data)
    // w przyszłości możesz tu dodać request do API
  }

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
