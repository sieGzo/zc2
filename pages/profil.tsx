// pages/profil.tsx
import { getSession, useSession } from 'next-auth/react'
import Head from 'next/head'

export default function Profil() {
  const { data: session } = useSession()
  return (
    <main className="max-w-4xl mx-auto p-6">
      <Head><title>Twój profil — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-4">Twój profil</h1>
      <pre className="p-4 bg-gray-100 rounded">{JSON.stringify(session, null, 2)}</pre>
    </main>
  )
}

export async function getServerSideProps(ctx: any) {
  const session = await getSession(ctx)
  if (!session) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent('/profil')}`,
        permanent: false,
      },
    }
  }
  return { props: {} }
}
