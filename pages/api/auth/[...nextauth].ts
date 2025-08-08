import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email lub nazwa użytkownika', type: 'text' },
        password: { label: 'Hasło', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const identifier = String(credentials.email).trim().toLowerCase()
          const user = await prisma.user.findFirst({
            where: { OR: [{ email: identifier }, { username: credentials.email }] },
          })
          if (!user || !user.passwordHash) return null
          if (!user.emailVerified) throw new Error('EmailNotVerified') // wymagamy potwierdzenia e-maila
          const ok = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!ok) return null
          return { id: user.id, email: user.email, name: user.username }
        } catch (e: any) {
          if (e?.message === 'EmailNotVerified') throw e
          console.error('authorize error:', e)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl)
        // Nigdy nie wracaj na /login
        if (u.pathname.startsWith('/login')) return baseUrl + '/'
        // Tylko ten sam origin
        if (u.origin === baseUrl) return u.toString()
        return baseUrl + '/'
      } catch {
        return baseUrl + '/'
      }
    },
    async session({ session, token }) {
      if (token?.sub) (session.user as any).id = token.sub
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
})
