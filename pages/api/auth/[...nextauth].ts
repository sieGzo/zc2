// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** ---------- Turnstile helpers ---------- */
function getTurnstileSecret() {
  return (
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.NEXT_TURNSTILE_SECRET || // ewentualny alias
    ""
  );
}

async function verifyTurnstileServer(token?: string, ip?: string) {
  const secret = getTurnstileSecret();
  if (!secret) {
    // DEV/preview: nie blokujemy, jeśli nie skonfigurowano sekretu
    return { ok: true, reason: "no-secret-dev-bypass" as const };
  }
  if (!token) return { ok: false, reason: "missing-token" as const };

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  });

  const data = await resp.json().catch(() => ({}));
  return { ok: !!data.success, detail: data };
}
/** -------------------------------------- */

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
        // Turnstile token przekazujemy z frontu pod kluczem "turnstile"
        turnstile: { label: "turnstile", type: "text" } as any,
      },
      // @ts-ignore NextAuth przekazuje tu req (z nagłówkami) jako drugi argument
      async authorize(credentials, req) {
        const identifier = credentials?.email?.trim();
        const password = credentials?.password ?? "";
        const turnstileToken = (credentials as any)?.turnstile as string | undefined;

        if (!identifier || !password) return null;

        // IP z nagłówków (Vercel/Cloudflare)
        const ipHeader =
          (req?.headers?.["x-forwarded-for"] as string) ||
          (req?.headers?.["x-real-ip"] as string) ||
          (req?.headers?.["cf-connecting-ip"] as string) ||
          "";
        const ip = ipHeader.split(",")[0]?.trim();

        // ✅ Weryfikacja Turnstile
        const ts = await verifyTurnstileServer(turnstileToken, ip);
        if (!ts.ok) {
          // trafi do /login?error=AccessDenied -> ładna wiadomość z mapy
          throw new Error("AccessDenied");
        }

        // login po emailu (lowercase) lub username
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
          },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // wymagamy potwierdzenia e-maila dla kont local credentials
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

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
      if ((token as any)?.uid) (session.user as any).id = (token as any).uid as string;
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
