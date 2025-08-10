import Head from 'next/head'
import Link from 'next/link'
import ScrollToTop from '@/components/ScrollToTop'

export default function Blog() {
  const title = 'Blog podróżniczy – Zwiedzaj Chytrze'
  const description = 'Relacje z podróży, praktyczne porady, mapy i inspiracje.'

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h1 className="text-4xl font-bold text-center">🌍 Wyprawy krok po kroku</h1>
          <p className="mt-3 text-lg text-center text-gray-700 dark:text-gray-300">
            Poradniki, trasy, zdjęcia i tipy — wszystko, by podróżować… chytrze.
          </p>

          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              { tag: 'NORWEGIA', title: 'Lofoty poza sezonem', teaser: 'Rodzinne trasy i dzikie krajobrazy.' },
              { tag: 'USA', title: 'Parki narodowe i roadtrip', teaser: 'Przez zachodnie stany – praktycznie.' },
              { tag: 'ISLANDIA', title: 'Zorza i wodospady', teaser: 'Mapy miejsc + wskazówki.' },
              { tag: 'WIEDEŃ', title: 'Weekend w Austrii', teaser: 'Kawa, kultura i spacery z wózkiem.' },
            ].map((p) => (
              <li key={p.title} className="rounded-lg overflow-hidden border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition">
                <div className="h-36 bg-gradient-to-br from-orange-100 to-orange-300 dark:from-gray-700 dark:to-gray-600" />
                <div className="p-5">
                  <span className="text-[11px] tracking-wider font-semibold text-[#f1861e]">{p.tag}</span>
                  <h2 className="mt-1 text-xl font-semibold">{p.title}</h2>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{p.teaser}</p>
                  <Link href="/blog" className="mt-3 inline-block text-[#f1861e] font-medium">
                    Czytaj → 
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ScrollToTop />
      </main>
    </>
  )
}
