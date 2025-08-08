import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

const FROM = `"Zwiedzaj Chytrze" <${process.env.SMTP_FROM}>`

// ✅ 1. E-mail weryfikacyjny konta użytkownika
export async function sendVerificationEmail(email: string, token: string) {
  const confirmUrl = `${process.env.BASE_URL}/potwierdz-email?token=${token}`

  const htmlContent = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.BASE_URL}/logo.png" alt="Zwiedzaj Chytrze" style="height: 80px; display: block; margin: 0 auto;" />
      </div>

      <h2 style="text-align: center; color: #f1861e;">Potwierdzenie adresu e-mail</h2>
      <p style="text-align: center;">Dziękujemy za rejestrację na <strong>Zwiedzaj Chytrze</strong>! 🦊</p>
      <p style="text-align: center;">Kliknij poniższy przycisk, aby potwierdzić swój adres e-mail:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" style="
          background-color: #f1861e;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          display: inline-block;
        ">Potwierdź e-mail</a>
      </p>
      <p style="text-align:center; font-size: 14px; color: #777;">
        Jeśli nie rejestrowałaś/eś się na naszej stronie – zignoruj tę wiadomość.
      </p>
      <hr style="margin: 40px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        © ${new Date().getFullYear()} Zwiedzaj Chytrze – Wszystkie prawa zastrzeżone.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Potwierdź swój adres e-mail – Zwiedzaj Chytrze',
    html: htmlContent,
  })
}

// ✅ 2. E-mail do resetu hasła
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.BASE_URL}/nowe-haslo?token=${token}`

  const html = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.BASE_URL}/logo.png" alt="Zwiedzaj Chytrze" style="height: 80px; display: block; margin: 0 auto;" />
      </div>
      <h2 style="text-align: center; color: #f1861e;">Resetowanie hasła</h2>
      <p style="text-align: center;">Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="
          background-color: #f1861e;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          display: inline-block;
        ">Ustaw nowe hasło</a>
      </p>
      <p style="text-align:center; font-size: 14px; color: #777;">
        Jeśli to nie Ty zainicjowałaś/eś reset hasła – zignoruj tę wiadomość.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Resetowanie hasła – Zwiedzaj Chytrze',
    html,
  })
}

// ✅ 3. E-mail z potwierdzeniem zapisu do newslettera
export async function sendNewsletterConfirmationEmail(email: string, token: string) {
  const confirmUrl = `${process.env.BASE_URL}/potwierdz-email?token=${token}`

  const htmlContent = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.BASE_URL}/logo.png" alt="Zwiedzaj Chytrze" style="height: 80px; display: block; margin: 0 auto;" />
      </div>
      <h2 style="text-align: center; color: #f1861e;">Potwierdzenie zapisu do newslettera</h2>
      <p style="text-align: center;">Dziękujemy za chęć otrzymywania naszych podróżniczych inspiracji! 🦊</p>
      <p style="text-align: center;">Kliknij poniższy przycisk, aby potwierdzić subskrypcję:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" style="
          background-color: #f1861e;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          display: inline-block;
        ">Potwierdź subskrypcję</a>
      </p>
      <p style="text-align:center; font-size: 14px; color: #777;">
        Jeśli nie zapisywałaś/eś się do newslettera – zignoruj tę wiadomość.
      </p>
      <hr style="margin: 40px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        © ${new Date().getFullYear()} Zwiedzaj Chytrze – Wszystkie prawa zastrzeżone.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Potwierdź subskrypcję – Zwiedzaj Chytrze',
    html: htmlContent,
  })
}

// ✅ 4. E-mail powitalny po potwierdzeniu konta i subskrypcji
export async function sendWelcomeEmail(email: string) {
  const htmlContent = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; background-color: #fff; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.BASE_URL}/logo.png" alt="Zwiedzaj Chytrze" style="height: 80px; display: block; margin: 0 auto;" />
      </div>
      <h2 style="text-align: center; color: #f1861e;">Witaj w Zwiedzaj&nbsp;Chytrze! 🦊</h2>
      <p style="text-align: center;">Twoje konto zostało potwierdzone, a&nbsp;subskrypcja newslettera aktywowana.</p>
      <p style="text-align: center;">Od teraz otrzymasz od nas tylko najciekawsze podróżnicze inspiracje ✈️🏔️</p>
      <p style="text-align:center; margin: 30px 0;">
        <a href="${process.env.BASE_URL}" style="
          background-color: #f1861e;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          display: inline-block;
        ">Przejdź na stronę</a>
      </p>
      <hr style="margin: 40px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        © ${new Date().getFullYear()} Zwiedzaj Chytrze – Wszystkie prawa zastrzeżone.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Witaj na pokładzie – Zwiedzaj Chytrze',
    html: htmlContent,
  })
}
