// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",                // ⬅️ custom error page (żadnych surowych ekranów NextAuth)
    verifyRequest: "/potwierdz-email-wyslany",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email lub nazwa użytkownika", type: "text" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.email?.trim();
        const password = credentials?.password ?? "";
        if (!identifier || !password) return null;

        // login po emailu (lowercase) lub username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier.toLowerCase() },
              { username: identifier },
            ],
          },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // wymagamy potwierdzenia e-maila dla kont local credentials
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return { id: user.id, email: user.email ?? undefined, name: user.username ?? undefined } as any;
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // allowDangerousEmailAccountLinking: false (domyślnie)
    }),

    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      // allowDangerousEmailAccountLinking: false (domyślnie)
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // OAuth: jeśli pierwszy raz i brak emailVerified -> ustaw
      if (account && account.provider !== "credentials") {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: String(user.id) } });
          if (dbUser && !dbUser.emailVerified) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: new Date() },
            });
          }
        } catch (e) {
          console.warn("signIn() emailVerified update failed:", e);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.uid = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) (session.user as any).id = token.uid as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        if (u.origin === baseUrl) return u.toString();
        return baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
};

export default NextAuth(authOptions);
