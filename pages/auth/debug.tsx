// pages/auth/debug.tsx
'use client'
import Head from 'next/head'
import { useSession } from 'next-auth/react'

export default function AuthDebug() {
  const { data: session, status } = useSession()
  return (
    <main className="max-w-3xl mx-auto p-6">
      <Head><title>Auth Debug</title></Head>
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      <pre className="p-4 rounded bg-gray-100 whitespace-pre-wrap">
{JSON.stringify({ status, session }, null, 2)}
      </pre>
    </main>
  )
}
