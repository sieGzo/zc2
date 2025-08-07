import Head from 'next/head'

export default function EmailWyslany() {
  return (
    <>
      <Head>
        <title>Sprawdź e-mail – Zwiedzaj Chytrze</title>
      </Head>

      <main className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow text-center">
        <h1 className="text-2xl font-bold text-[#f1861e]">Sprawdź skrzynkę</h1>
        <div className="mt-4">
          <img
            src="/lisek-email.png"
            alt="Lisek czeka"
            className="mx-auto w-20 h-20"
          />
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Wysłaliśmy link potwierdzający na podany adres e-mail.
          <br />
          Kliknij w niego, aby aktywować konto.
        </p>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
          Jeśli nie widzisz wiadomości, sprawdź folder SPAM lub Oferty.
        </p>
      </main>
    </>
  )
}
