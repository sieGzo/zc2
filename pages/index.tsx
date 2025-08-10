import Head from 'next/head'
import ScrollToTop from '@/components/ScrollToTop'
import IntroVideo from '@/components/IntroVideo'
import DestinationCarousel from '@/components/DestinationCarousel'
import PromocjeLinii from '@/components/PromocjeLinii'
import Link from 'next/link'

export default function Home() {
  const title = 'Zwiedzaj Chytrze — szlaki i blog podróżniczy'
  const description =
    'Planer tras pieszych i rowerowych + blog podróżniczy. Zapisuj trasy, inspiruj się i zwiedzaj… chytrze!'
  const site = 'https://zwiedzajchytrze.pl'
  const ogImage = `${site}/og.jpg` // dodaj plik do /public/og.jpg

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
      {/* HERO — wyraźny nagłówek w brandzie + poprawione buttony */}
      <section className="relative w-full py-16 px-4 md:px-8">
        {/* delikatny pas w kolorze marki za nagłówkiem */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f1861e]/15 to-transparent dark:from-[#f1861e]/10" />

        <div className="relative max-w-6xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 text-[13px] uppercase tracking-wider text-[#f1861e]">
            🦊 Zwiedzaj mądrze. Zwiedzaj chytrze.
          </p>

          {/* H1: pierwsza część w kolorze marki */}
          <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">
            <span className="text-[#f1861e]">Planer tras</span>
            <span className="text-gray-900 dark:text-white"> + blog podróżniczy</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-300">
            Zaplanuj pieszo lub rowerem, zapisz trasę i wróć do niej później.
            A gdy szukasz pomysłów — wpadnij na bloga po świeże inspiracje.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Primary */}
            <Link
              href="/trails"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold
                        bg-[#f1861e] text-white hover:bg-orange-600 focus-visible:outline-none
                        focus-visible:ring-2 focus-visible:ring-[#f1861e] transition-colors"
            >
              🚀 Otwórz planer trasy
            </Link>

            {/* Secondary (outline) — poprawiony hover */}
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

    <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
      Bez logowania zaplanujesz trasę; zapis wymaga konta (sekundy).
    </div>
  </div>
</section>

        {/* Krótkie video – może zostać jako smaczek */}
        <IntroVideo />

        {/* 3 kafle: rodzaje szlaków → prowadzą do /trails */}
        <section className="max-w-6xl mx-auto px-4 my-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">🗺️ Szlaki i trasy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🚶‍♀️', title: 'Szlaki piesze', text: 'Od krótkich spacerów po dłuższe wędrówki.' },
              { icon: '⛰️', title: 'Górskie', text: 'Trasy bezpieczne i piękne, z mapą i podpowiedziami.' },
              { icon: '🚴', title: 'Rowerowe', text: 'Rowerowe przygody w Polsce i Europie, z GPX.' },
            ].map((c) => (
              <Link
                key={c.title}
                href="/trails"
                className="rounded-lg shadow-sm border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition"
              >
                <div className="text-2xl">{c.icon}</div>
                <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-300">{c.text}</p>
                <span className="mt-4 inline-block text-[#f1861e] font-medium">Otwórz planer →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Teaser bloga – lekkie karty (na razie statyczne, potem podłączysz CMS/MDX) */}
        <section className="max-w-6xl mx-auto px-4 my-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">📝 Z bloga</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: 'NORWEGIA', title: 'Lofoty bez tłumów', href: '/blog' },
              { tag: 'USA', title: 'Roadtrip przez parki', href: '/blog' },
              { tag: 'ISLANDIA', title: 'Zorza, wodospady i mgła', href: '/blog' },
            ].map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="rounded-lg overflow-hidden border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition"
              >
                {/* Miejsce na miniaturę – na razie gradient */}
                <div className="h-32 bg-gradient-to-br from-orange-100 to-orange-300 dark:from-gray-700 dark:to-gray-600" />
                <div className="p-4">
                  <span className="text-[11px] tracking-wider font-semibold text-[#f1861e]">{p.tag}</span>
                  <h3 className="mt-2 font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Czytaj dalej →</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/blog" className="text-[#f1861e] font-medium underline">
              Zobacz wszystkie wpisy
            </Link>
          </div>
        </section>

        {/* Destynacje & Promocje – niżej, jako dodatki */}
        <section className="bg-orange-50 dark:bg-gray-800 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-[#f1861e]">
              🔥 Gorące destynacje
            </h2>
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-4 px-2 md:px-0 snap-x snap-mandatory">
                <DestinationCarousel />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 my-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">✈️ Promocje linii lotniczych</h2>
          <PromocjeLinii />
        </section>

        {/* Linki końcowe */}
        <section className="mt-10 text-center px-4">
          <div className="flex flex-col md:flex-row justify-center md:space-x-6 space-y-2 md:space-y-0">
            <Link href="/trails" className="text-[#f1861e] font-medium underline">🗺️ Planer trasy</Link>
            <Link href="/blog" className="text-[#f1861e] font-medium underline">📖 Blog</Link>
            <Link href="/o-mnie" className="text-[#f1861e] font-medium underline">🧭 O mnie</Link>
            <Link href="/kontakt" className="text-[#f1861e] font-medium underline">📬 Kontakt</Link>
          </div>
        </section>

        <ScrollToTop />
      </main>
    </>
  )
}
