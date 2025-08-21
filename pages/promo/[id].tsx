import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { promos, getPromo } from '@/lib/promos'

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: promos.map(p => ({ params: { id: p.id } })),
  fallback: false, // 404 dla nieznanych id
})

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = String(params?.id)
  const promo = getPromo(id)
  if (!promo) return { notFound: true }
  return { props: { promo } }
}

export default function PromoPage({ promo }: InferGetStaticPropsType<typeof getStaticProps>) {
  const title = `${promo.title} — ${promo.brand} | ZwiedzajChytrze`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`${promo.title} – ${promo.brand}.`} />
        <link rel="canonical" href={`https://twojadomena.pl/promo/${promo.id}`} />
        <meta property="og:title" content={promo.title} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`https://twojadomena.pl${promo.img}`} />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-[#f1861e] hover:underline">← Wróć na stronę główną</Link>
        </nav>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={promo.img}
              alt={promo.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>

          <div className="mb-2 text-xs text-gray-500">
            <span className="rounded-full border px-2 py-0.5">{promo.brand}</span>
            {promo.dates && <span className="ml-2">{promo.dates}</span>}
          </div>

          <h1 className="mb-4 text-2xl font-semibold">{promo.title}</h1>

          <div className="prose dark:prose-invert">
            <p>Tu będzie treść przewodnika / poradnika dla: <strong>{promo.title}</strong>.</p>
            <p>Możesz przygotować sekcje: <em>Jak dojechać</em>, <em>Budżet</em>, <em>Co zobaczyć</em>, itd.</p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {promo.price && (
              <span className="rounded-full bg-black/80 px-3 py-1 text-sm text-white">{promo.price}</span>
            )}
            <Link href="/" className="text-[#f1861e] underline-offset-2 hover:underline">
              Zobacz więcej ofert
            </Link>
          </div>
        </article>
      </main>
    </>
  )
}
