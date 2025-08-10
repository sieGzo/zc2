// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function verifyTurnstile(token?: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true }; // dev / feature-off
  if (!token) return { ok: false, reason: "missing-token" };

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    const data = await res.json();
    return { ok: !!data?.success, detail: data };
  } catch (e) {
    return { ok: false, reason: "verify-exception", detail: String(e) };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/potwierdz-email-wyslany",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email lub nazwa użytkownika", type: "text" },
        password: { label: "Hasło", type: "password" },
        // token z Turnstile – wysyłasz go jako `turnstile` z formularza
        turnstile: { label: "Turnstile", type: "text" },
      },
      async authorize(credentials, req) {
        const identifier = credentials?.email?.trim() ?? "";
        const password = credentials?.password ?? "";
        const tsToken = (credentials as any)?.turnstile as string | undefined;
        if (!identifier || !password) return null;

        // 1) Turnstile (jeśli skonfigurowany)
        const ip =
          (req as any)?.headers?.["cf-connecting-ip"] ||
          (req as any)?.headers?.["x-forwarded-for"] ||
          null;

        const ts = await verifyTurnstile(tsToken, typeof ip === "string" ? ip : null);
        if (!ts.ok) {
          // Będziemy widzieć error=Callback — w UI zmapowane na ludzki komunikat.
          throw new Error("Callback");
        }

        // 2) User by email or username (case-friendly)
        const idLower = identifier.toLowerCase();
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: idLower },
              { username: identifier },
              { username: idLower }, // gdy ktoś wpisze inną wielkość znaków
            ],
          },
        });
        if (!user || !user.passwordHash) return null;

        // 3) Email verification required for credentials
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        // 4) Password check
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.username ?? undefined,
        } as any;
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // OAuth: auto-verify email the first time
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
