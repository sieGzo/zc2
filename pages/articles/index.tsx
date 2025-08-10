import React from "react";
import Head from "next/head";

export default function ArticlesIndexPage() {
  return (
    <>
      <Head>
        <title>Artykuły — Zwiedzaj Chytrze</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Artykuły</h1>

        <p className="text-gray-600 dark:text-gray-300">
          To jest strona listy artykułów. Podmień zawartość według potrzeb.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <article className="border rounded-lg p-4">Przykładowy artykuł</article>
        </div>
      </main>
    </>
  );
}
