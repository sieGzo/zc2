import Head from 'next/head';

export default function PolitykaPrywatnosci() {
  return (
    <>
      <Head>
        <title>Polityka prywatności | ZwiedzajChytrze</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold">Polityka prywatności</h1>
        <p className="mt-4">
          Dbamy o Twoją prywatność. Niniejszy dokument wyjaśnia, jakie dane przetwarzamy i w jakim celu.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Administrator</h2>
        <p>Administratorem danych jest właściciel serwisu ZwiedzajChytrze (kontakt: kontakt@zwiedzajchytrze.pl).</p>

        <h2 className="mt-6 text-xl font-semibold">Zakres danych</h2>
        <p>Adres e‑mail podany w formularzu newslettera oraz dane techniczne standardowo przetwarzane przez narzędzia analityczne.</p>

        <h2 className="mt-6 text-xl font-semibold">Cele i podstawy</h2>
        <ul className="list-disc pl-6">
          <li>Wysyłka newslettera (zgoda – art. 6 ust. 1 lit. a RODO).</li>
          <li>Statystyki odwiedzin (prawnie uzasadniony interes – art. 6 ust. 1 lit. f RODO).</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">Odbiorcy danych</h2>
        <p>Dostawcy usług: system newslettera (/Brevo), hosting (np. Vercel), analityka (Google Analytics).</p>

        <h2 className="mt-6 text-xl font-semibold">Okres przetwarzania</h2>
        <p>Do czasu wycofania zgody lub wniesienia sprzeciwu – a w przypadku statystyk: zgodnie z polityką dostawców.</p>

        <h2 className="mt-6 text-xl font-semibold">Twoje prawa</h2>
        <p>Dostęp do danych, sprostowanie, usunięcie, ograniczenie, przenoszenie, sprzeciw, skarga do PUODO.</p>

        <h2 className="mt-6 text-xl font-semibold">Cookies</h2>
        <p>Używamy wyłącznie niezbędnych cookies oraz narzędzi statystycznych. Szczegóły w ustawieniach przeglądarki.</p>

        <h2 className="mt-6 text-xl font-semibold">Kontakt</h2>
        <p>W sprawach prywatności: kontakt@zwiedzajchytrze.pl</p>
      </main>
    </>
  );
}
