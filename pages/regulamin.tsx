import Head from 'next/head';

export default function Regulamin() {
  return (
    <>
      <Head>
        <title>Regulamin | ZwiedzajChytrze</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold">Regulamin serwisu</h1>
        <ol className="mt-4 list-decimal pl-6 space-y-3">
          <li>Serwis ma charakter informacyjny. Treści nie stanowią porady prawnej ani finansowej.</li>
          <li>Właściciel nie ponosi odpowiedzialności za decyzje podjęte na podstawie treści serwisu.</li>
          <li>Linki afiliacyjne mogą skutkować otrzymaniem prowizji przez właściciela serwisu.</li>
          <li>Zakazane jest kopiowanie treści bez zgody właściciela.</li>
          <li>Kontakt: kontakt@zwiedzajchytrze.pl</li>
        </ol>
      </main>
    </>
  );
}
