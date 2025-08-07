import Head from 'next/head'
import Image from 'next/image'
import ScrollToTop from '../components/ScrollToTop'
import IntroVideo from '../components/IntroVideo'
import DestinationCarousel from '../components/DestinationCarousel'
import PromocjeLinii from '../components/PromocjeLinii'

export default function Home() {
  return (
    <>
      <Head>
        <title>Zwiedzaj&nbsp;Chytrze</title>
        <meta
          name="description"
          content="Twoje podróże, Twoje zasady – z&nbsp;poradnikiem w&nbsp;kieszeni"
        />
        {/* OPEN GRAPH */}
        <meta property="og:title" content="Zwiedzaj Chytrze" />
        <meta property="og:description" content="Twoje podróże, Twoje zasady – z poradnikiem w kieszeni" />
        <meta property="og:image" content="https://twojadomena.pl/og-image.jpg" />
        <meta property="og:url" content="https://twojadomena.pl/" />
        <meta property="og:type" content="website" />

        {/* TWITTER CARDS */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zwiedzaj Chytrze" />
        <meta name="twitter:description" content="Twoje podróże, Twoje zasady – z poradnikiem w kieszeni" />
        <meta name="twitter:image" content="https://twojadomena.pl/og-image.jpg" />
      </Head>

      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* HERO */}
        <section className="relative w-full bg-gradient-to-r from-[#f1861e]/10 via-white to-[#f1861e]/10 dark:from-gray-900 dark:to-gray-800 py-12 px-4 md:px-8">
          <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#f1861e] mb-4 leading-tight">
                Wybierz&nbsp;mądrze, wybierz&nbsp;chytrze
              </h1>
              <p className="text-gray-700 dark:text-gray-200 text-lg md:text-xl mb-6">
                Oszczędzaj czas, pieniądze i&nbsp;nerwy – podróżuj z&nbsp;głową dzięki naszym szlakom, poradnikom i&nbsp;promocjom.
              </p>
              <a
                href="/blog"
                className="inline-block bg-[#f1861e] text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors"
              >
                Zobacz&nbsp;nowe&nbsp;wpisy
              </a>
            </div>

            <div className="flex-1 flex justify-center md:justify-end">
              <Image
                src="/hero-travel.png"
                alt="Podróżująca kobieta z&nbsp;mapą"
                width={500}
                height={400}
                className="rounded-xl shadow-lg w-full max-w-md h-auto object-contain"
                unoptimized
                priority
              />
            </div>
          </div>
        </section>

        {/* WIDEO */}
        <IntroVideo />

        {/* SZLAKI */}
        <section className="max-w-6xl mx-auto px-4 my-16">
          <h2 className="text-3xl font-bold mb-8 text-center">🗺️ Szlaki i&nbsp;trasy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">🚶‍♀️ Szlaki&nbsp;piesze</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Krótkie i&nbsp;długie&nbsp;spacery po&nbsp;lasach, jeziorach, miasteczkach – dla&nbsp;każdego poziomu&nbsp;kondycji.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">⛰️ Szlaki&nbsp;górskie</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Bezpieczne i&nbsp;piękne&nbsp;trasy po&nbsp;górach – z&nbsp;wózkiem, z&nbsp;dzieckiem, solo lub&nbsp;z&nbsp;ekipą.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">🚴 Szlaki&nbsp;rowerowe</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Rowerowe&nbsp;przygody w&nbsp;Polsce i&nbsp;Europie – z&nbsp;GPX-em, zdjęciami i&nbsp;praktycznymi&nbsp;radami.
              </p>
            </div>
          </div>
        </section>

        {/* GORĄCE DESTYNACJE */}
        <section className="bg-orange-50 dark:bg-gray-800 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10 text-[#f1861e]">🔥 Gorące&nbsp;destynacje</h2>
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-4 px-2 md:px-0 snap-x snap-mandatory">
                <DestinationCarousel />
              </div>
            </div>
          </div>
        </section>

        {/* PROMOCJE LINII*/}
        <section className="max-w-6xl mx-auto px-4 my-16">
          <h2 className="text-3xl font-bold mb-8 text-center">✈️ Promocje&nbsp;linii&nbsp;lotniczych</h2>
          <PromocjeLinii />
        </section> 

        {/* LINKI */}
        <section className="mt-12 text-center px-4">
          <div className="flex flex-col md:flex-row justify-center md:space-x-6 space-y-2 md:space-y-0">
            <a href="/blog" className="text-[#f1861e] font-medium underline">📖 Przejdź&nbsp;do&nbsp;bloga</a>
            <a href="/o-mnie" className="text-[#f1861e] font-medium underline">🧭 Poznaj&nbsp;mnie</a>
            <a href="/kontakt" className="text-[#f1861e] font-medium underline">📬 Skontaktuj&nbsp;się</a>
          </div>
        </section>

        <ScrollToTop />
      </main>
      
    </>
  )
}
