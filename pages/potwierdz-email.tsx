import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import LisekLoader from '../components/LisekLoader'
import Head from 'next/head'

export default function PotwierdzEmail() {
  const router = useRouter()
  const [message, setMessage] = useState('Poczekaj chwilę ;)')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading')

  useEffect(() => {
    if (!router.isReady) return

    const token = typeof router.query.token === 'string' ? router.query.token : null

    if (!token) {
      setMessage('Brak tokena w linku.')
      setStatus('missing')
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (res.ok && data.emailVerified) {
          setMessage('E-mail został potwierdzony!')
          setStatus('success')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        } else if (res.status === 200 && data.emailVerified === true) {
          setMessage('E-mail był już wcześniej potwierdzony.')
          setStatus('success')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        } else {
          setMessage(data.message || 'Nie udało się potwierdzić e-maila.')
          setStatus('error')
        }
      } catch (err) {
        console.error('Błąd po stronie klienta:', err)
        setMessage('Błąd połączenia z serwerem.')
        setStatus('error')
      }
    }

    verifyEmail()
  }, [router.isReady, router.query.token])

  return (
    <>
      <Head>
        <title>Weryfikacja e-maila – Zwiedzaj Chytrze</title>
      </Head>

      <main className="max-w-md mx-auto mt-20 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow text-center">
        <h1 className="text-2xl font-bold text-[#f1861e]">Weryfikacja e-maila</h1>

        {status === 'loading' && (
          <>
            <LisekLoader />
            <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-[#28a745] text-4xl mt-6">✅</div>
            <p className="mt-4 text-green-600 dark:text-green-400 font-semibold">{message}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Za chwilę zostaniesz przekierowany do strony logowania...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-[#dc3545] text-4xl mt-6">❌</div>
            <p className="mt-4 text-red-600 dark:text-red-400 font-semibold">{message}</p>
          </>
        )}

        {status === 'missing' && (
          <>
            <div className="text-pink-500 text-4xl mt-6">❌</div>
            <p className="mt-4 text-pink-600 dark:text-pink-400 font-semibold">{message}</p>
          </>
        )}
      </main>
    </>
  )
}
