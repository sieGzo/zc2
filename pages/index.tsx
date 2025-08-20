// pages/index.tsx
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import ScrollToTop from '@/components/ScrollToTop'
import IntroVideo from '@/components/IntroVideo'
import PromoGrid from '@/components/PromoGrid'   // ⬅️ NOWE

export default function Home() {
  const title = 'Zwiedzaj Chytrze — planer tras i blog podróżniczy'
  const description =
    'Planer tras pieszych i rowerowych + blog podróżniczy. Zapisuj trasy, inspiruj się i zwiedzaj… chytrze!'
  const site = 'https://zwiedzajchytrze.pl'
  const ogImage = `${site}/og.jpg`

  // 👇 pozycjonowanie zdjęć w kartach (1 i 2 wyżej)
  const blogCards = [
    { tag: 'NORWEGIA', title: 'Lofoty bez tłumów', href: '/blog', img: '/lofoten.webp', pos: 'object-[center_30%]' },
    { tag: 'USA',      title: 'Roadtrip przez parki', href: '/blog', img: '/usa.webp',     pos: 'object-[center_20%]' },
    { tag: 'ISLANDIA', title: 'Zorza, wodospady i mgła', href: '/blog', img: '/iceland.webp', pos: 'object-top' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zwiedzaj Chytrze',
    url: site,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${site}/search?q={query}`,
      'query-input': 'required name=query',
    },
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="canonical" href={site} />
        <meta name="description" content={description} />
        <meta name="robots" content="index,follow" />
        <meta name="theme-color" content="#f1861e" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={site} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* HERO */}
        <section className="relative w-full px-4 md:px-8 pt-14 pb-10">
          <div className="pointer-events-none absolute inset-x-0 -top-12 h-48 bg-gradient-to-b from-[#f1861e]/15 to-transparent dark:from-[#f1861e]/10" />
          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">
              🦊 Zwiedzaj mądrze. Zwiedzaj chytrze.
            </h1>
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">
              <span className="text-[#f1861e]">Planer tras</span>{' '}
              <span className="text-gray-900 dark:text-white">+ blog podróżniczy</span>
            </h1>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/trails" className="btn btn-primary rounded-full btn-md w-full sm:w-auto">
                🚀 Otwórz planer trasy
              </Link>
              <Link href="/blog" className="btn btn-outline rounded-full btn-md w-full sm:w-auto">
                📖 Przejdź do bloga
              </Link>
            </div>
          </div>
        </section>

        {/* Wideo intro */}
        <IntroVideo />

        {/* Blog – 3 karty */}
        <section className="bg-orange-50 dark:bg-gray-800 py-14">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">📝 Z bloga</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
              {blogCards.map((p) => (
                <Link
                  key={p.title}
                  href={p.href}
                  className="group relative rounded-lg overflow-hidden border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:scale-[1.02] transition-transform duration-300 w-full max-w-sm text-left"
                >
                  <div className="h-40 relative">
                    <Image
                      src={p.img}
                      alt={p.title}
                      fill
                      className={`object-cover ${p.pos} transition-transform duration-300 group-hover:scale-105`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <span className="kicker">{p.tag}</span>
                    <h3 className="mt-2 font-semibold">{p.title}</h3>
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

        {/* Promocje linii lotniczych / oferty */}
        <section className="max-w-6xl mx-auto px-4 my-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">✈️ Promocje i okazje</h2>
          <PromoGrid /> {/* ⬅️ NOWE */}
        </section>

        <ScrollToTop />
      </main>
    </>
  )
}
