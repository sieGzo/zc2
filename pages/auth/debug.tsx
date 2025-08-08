// pages/auth/debug.tsx
'use client'
import Head from 'next/head'
import { useSession } from 'next-auth/react'

export default function AuthDebug() {
  const { data: session, status } = useSession()

  const cookies = typeof document !== 'undefined' ? document.cookie : ''

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Head><title>Auth Debug</title></Head>
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      <pre className="p-4 rounded bg-gray-100 whitespace-pre-wrap">
{JSON.stringify({ status, session }, null, 2)}
      </pre>
      <h2 className="text-xl font-semibold mt-6 mb-2">Cookies</h2>
      <pre className="p-4 rounded bg-gray-100 whitespace-pre-wrap">{cookies}</pre>
    </main>
  )
}
