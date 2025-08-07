// pages/blog.tsx
import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'

export default function Blog() {
  return (
    <>
      <Head>
        <title>Blog podróżniczy – Zwiedzaj&nbsp;Chytrze</title>
        <meta name="description" content="Wyprawy z&nbsp;pasją – odkryj relacje z&nbsp;podróży po&nbsp;Lofotach, USA, Indonezji, Islandii, Austrii i&nbsp;więcej!" />
      </Head>

      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">🌍 Wyprawy krok po&nbsp;kroku</h1>

          <p className="text-lg text-center mb-12">
            Tutaj znajdziesz wpisy z&nbsp;moich najciekawszych podróży – praktyczne porady, trasy, zdjęcia i&nbsp;subiektywne odczucia.
          </p>

          <ul className="grid gap-6">
            <li className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-[#f1861e]">🇳🇴 Lofoty</h2>
              <p className="text-gray-700 dark:text-gray-300">Norwegia poza sezonem – rodzinne trasy, dzikie krajobrazy, dużo praktycznych wskazówek.</p>
            </li>
            <li className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-[#f1861e]">🇺🇸 USA</h2>
              <p className="text-gray-700 dark:text-gray-300">Parki narodowe, roadtrip i&nbsp;podróż życia – z&nbsp;dzieckiem i&nbsp;plecakiem.</p>
            </li>
            <li className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-[#f1861e]">🇮🇩 Indonezja</h2>
              <p className="text-gray-700 dark:text-gray-300">Wyspy, wulkany, uśmiechy i&nbsp;komary – czyli Azja z&nbsp;bliska.</p>
            </li>
            <li className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-[#f1861e]">🇮🇸 Islandia</h2>
              <p className="text-gray-700 dark:text-gray-300">Zorza, wodospady i&nbsp;szczypta magii – z&nbsp;praktycznymi mapami i&nbsp;tipami.</p>
            </li>
            <li className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-[#f1861e]">🇦🇹 Wiedeń</h2>
              <p className="text-gray-700 dark:text-gray-300">Krótki wypad do Austrii – kultura, kawiarnie i&nbsp;dziecko w&nbsp;wózku.</p>
            </li>
            <li className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-[#f1861e]">🇲🇬 Madagaskar</h2>
              <p className="text-gray-700 dark:text-gray-300">Nietypowe kierunki – podróż, która zmienia spojrzenie na&nbsp;świat.</p>
            </li>
            <li className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-[#f1861e]">🇲🇩 Mołdawia i&nbsp;Naddniestrze</h2>
              <p className="text-gray-700 dark:text-gray-300">Poza szlakiem – historia, kontrasty i&nbsp;dużo taniego wina 🍷</p>
            </li>
          </ul>
        </div>

        <ScrollToTop />
      </main>
    </>
  )
}
