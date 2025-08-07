import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type CredentialsType = {
  email?: string
  password?: string
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // 🟠 Logowanie przez e-mail i hasło (Credentials)
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Hasło', type: 'password' },
      },
      async authorize(credentials: CredentialsType | undefined) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email || '' },
        })

        if (!user) throw new Error('Brak użytkownika')

        const isValid = await bcrypt.compare(
          credentials?.password || '',
          user.passwordHash
        )

        if (!isValid) throw new Error('Nieprawidłowe hasło')

        return user
      },
    }),

    // 🔴 Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 🔵 Facebook
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
})

// ✅ DLA `pages/api/`: musi być `export default`!
export default handler
