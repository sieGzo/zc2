// pages/register.tsx
import Head from 'next/head'

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Rejestracja – Zwiedzaj Chytrze</title>
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <h1 className="text-3xl font-bold mb-6">Zarejestruj się</h1>
        <p className="text-center max-w-md mb-4">
          Na razie nie mamy jeszcze systemu rejestracji, ale będzie wkrótce!
        </p>
      </main>
    </>
  )
}
