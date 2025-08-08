import Head from 'next/head'

export default function Page() {
  return (
    <>
      <Head><title>Panel administracyjny — Zwiedzaj Chytrze</title></Head>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Panel administracyjny</h1>
        <p className="text-gray-600 dark:text-gray-300">Szkielet pod treści. Podmień zawartość według potrzeb.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key=76 className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 h-32"></div>
          ))}
        </div>
      </main>
    </>
  )
}
