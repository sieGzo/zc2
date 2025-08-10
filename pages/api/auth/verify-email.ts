// pages/api/auth/verify-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = typeof req.query.token === "string" ? req.query.token : null;
  const wantsJson =
    typeof req.query.format === "string" && req.query.format.toLowerCase() === "json"
      ? true
      : (req.headers.accept || "").includes("application/json");

  if (!token) {
    if (wantsJson) return res.status(400).json({ ok: false, message: "Brak lub nieprawidłowy token." });
    return res.writeHead(302, { Location: "/login?error=VerifyFailed" }).end();
  }

  try {
    const user = await prisma.user.findFirst({ where: { emailToken: token } });

    // Token już zużyty / nieprawidłowy — traktujemy jak „już potwierdzony” dla UX
    if (!user) {
      if (wantsJson) return res.status(200).json({ ok: true, already: true });
      return res.writeHead(302, { Location: "/login?verified=1" }).end();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), emailToken: null },
    });

    // Newsletter: best-effort
    if (user.email) {
      await prisma.newsletterSubscriber.updateMany({
        where: { email: user.email },
        data: { verified: true },
      });
      try {
        await sendWelcomeEmail(user.email);
      } catch (e) {
        console.warn("sendWelcomeEmail warn:", e);
      }
    }

    if (wantsJson) return res.status(200).json({ ok: true, emailVerified: true });
    return res.writeHead(302, { Location: "/login?verified=1" }).end();
  } catch (error) {
    console.error("❌ Błąd przy weryfikacji e-maila:", error);
    if (wantsJson) return res.status(500).json({ ok: false, message: "Błąd serwera." });
    return res.writeHead(302, { Location: "/login?error=VerifyFailed" }).end();
  }
}
