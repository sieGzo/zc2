import Head from 'next/head'
import ScrollToTop from '@/components/ScrollToTop'
import IntroVideo from '@/components/IntroVideo'
import PromocjeLinii from '@/components/PromocjeLinii'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const title = 'Zwiedzaj Chytrze — szlaki i blog podróżniczy'
  const description =
    'Planer tras pieszych i rowerowych + blog podróżniczy. Zapisuj trasy, inspiruj się i zwiedzaj… chytrze!'
  const site = 'https://zwiedzajchytrze.pl'
  const ogImage = `${site}/og.jpg`

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="canonical" href={site} />
        <meta name="description" content={description} />
        <meta name="robots" content="index,follow" />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={site} />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* HERO */}
        <section className="relative w-full py-16 px-4 md:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f1861e]/15 to-transparent dark:from-[#f1861e]/10" />

          <div className="relative max-w-6xl mx-auto text-center">
            <p className="inline-flex items-center gap-2 text-[30px] uppercase tracking-wider text-[#f1861e]">
              🦊 Zwiedzaj&nbsp;mądrze… Zwiedzaj&nbsp;chytrze 😉
            </p>

            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">
              <span className="text-[#f1861e]">Planer&nbsp;tras</span>
              <span className="text-gray-900 dark:text-white"> + blog&nbsp;podróżniczy</span>
            </h1>

            <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-300">
              Zaplanuj pieszo lub rowerem, zapisz trasę&nbsp;i wróć do niej później.
              A&nbsp;gdy szukasz pomysłów — wpadnij na bloga po świeże inspiracje.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/trails"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold
                          bg-[#f1861e] text-white hover:bg-orange-600 focus-visible:outline-none
                          focus-visible:ring-2 focus-visible:ring-[#f1861e] transition-colors"
              >
                🚀 Otwórz planer trasy
              </Link>

              <Link
                href="/blog"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold
                          border-2 border-[#f1861e] text-[#f1861e]
                          hover:bg-[#f1861e]/10 hover:border-orange-600 hover:text-orange-600
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1861e]
                          transition-colors"
              >
                📖 Przejdź do bloga
              </Link>
            </div>
          </div>
        </section>

        {/* Video */}
        <IntroVideo />

        {/* Szlaki */}
        <section className="max-w-6xl mx-auto px-4 my-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">🗺️ Szlaki&nbsp;i&nbsp;trasy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
            {[
              { icon: '🚶‍♀️', title: 'Szlaki piesze', text: 'Od krótkich spacerów po dłuższe wędrówki.' },
              { icon: '⛰️', title: 'Górskie', text: 'Trasy bezpieczne i&nbsp;piękne, z&nbsp;mapą i&nbsp;podpowiedziami.' },
              { icon: '🚴', title: 'Rowerowe', text: 'Rowerowe przygody w&nbsp;Polsce i&nbsp;Europie, z&nbsp;GPX.' },
            ].map((c) => (
              <Link
                key={c.title}
                href="/trails"
                className="rounded-lg shadow-sm border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition w-full max-w-sm"
              >
                <div className="text-2xl">{c.icon}</div>
                <h3 className="mt-2 text-lg font-semibold" dangerouslySetInnerHTML={{ __html: c.title }} />
                <p
                  className="mt-1 text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: c.text }}
                />
                <span className="mt-4 inline-block text-[#f1861e] font-medium">Otwórz planer →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Blog */}
        <section className="bg-orange-50 dark:bg-gray-800 py-14">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">📝 Z&nbsp;bloga</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
              {[
                { tag: 'NORWEGIA', title: 'Lofoty bez tłumów', href: '/blog', img: '/lofoten.webp' },
                { tag: 'USA', title: 'Roadtrip przez parki', href: '/blog', img: '/usa.webp' },
                { tag: 'ISLANDIA', title: 'Zorza, wodospady i&nbsp;mgła', href: '/blog', img: '/iceland.webp' },
              ].map((p) => (
                <Link
                  key={p.title}
                  href={p.href}
                  className="rounded-lg overflow-hidden border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition w-full max-w-sm"
                >
                  <div className="h-40 relative">
                    <Image
                      src={p.img}
                      alt={p.title.replace(/&nbsp;/g, ' ')}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4 text-left">
                    <span className="text-[11px] tracking-wider font-semibold text-[#f1861e]">{p.tag}</span>
                    <h3
                      className="mt-2 font-semibold"
                      dangerouslySetInnerHTML={{ __html: p.title }}
                    />
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Czytaj dalej →</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6">
              <Link href="/blog" className="text-[#f1861e] font-medium underline">
                Zobacz wszystkie wpisy
              </Link>
            </div>
          </div>
        </section>

        {/* Promocje */}
        <section className="max-w-6xl mx-auto px-4 my-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">✈️ Promocje&nbsp;linii&nbsp;lotniczych</h2>
          <PromocjeLinii />
        </section>

        <ScrollToTop />
      </main>
    </>
  )
}
