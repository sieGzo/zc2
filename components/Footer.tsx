'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FaTiktok, FaInstagram, FaFacebook, FaYoutube, FaHashtag } from 'react-icons/fa'

type VisitStats = { total: number; today: number; month: number; unique: number }

function StatCard({
  label,
  value,
  loading,
  emoji,
}: {
  label: string
  value?: number
  loading?: boolean
  emoji: string
}) {
  const fmt = useMemo(() => new Intl.NumberFormat('pl-PL'), [])
  return (
    <div
      className="rounded-xl border border-gray-200/70 bg-white px-4 py-3 shadow-sm
                 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-100"
      aria-live="polite"
    >
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {loading ? (
        <div className="mt-1 h-6 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      ) : (
        <div className="mt-1 text-lg font-semibold flex items-center justify-center gap-2">
          <span aria-hidden>{emoji}</span>
          <span>{fmt.format(value ?? 0)}</span>
        </div>
      )}
    </div>
  )
}

export default function Footer() {
  const [visits, setVisits] = useState<VisitStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetch('/api/auth/counter', { signal: ac.signal, cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Błąd odpowiedzi z serwera')
        return res.json()
      })
      .then((data) => {
        setVisits(data)
        setError(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError('Nie udało się pobrać statystyk')
      })
    return () => ac.abort()
  }, [])

  const loading = !visits && !error

  return (
    <footer className="mt-16 border-t bg-gray-50/70 px-4 py-12 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
      <div className="mx-auto max-w-6xl flex flex-col items-center text-center gap-8">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Zwiedzaj Chytrze"
          width={96}
          height={96}
          className="h-16 w-16 rounded-lg ring-1 ring-gray-200 dark:ring-gray-800"
        />

        {/* Statystyki */}
        <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Odwiedzin ogółem" value={visits?.total} loading={loading} emoji="🔢" />
          <StatCard label="Dziś" value={visits?.today} loading={loading} emoji="📅" />
          <StatCard label="W tym miesiącu" value={visits?.month} loading={loading} emoji="🗓️" />
          <StatCard label="Unikalni goście" value={visits?.unique} loading={loading} emoji="👥" />
        </div>

        {error && <div className="text-xs text-red-500">{error}</div>}

        {/* Sociale */}
        <div className="flex items-center justify-center gap-5 text-2xl text-[#f1861e]">
          <Link href="https://www.youtube.com/@zwiedzajchytrze" target="_blank" aria-label="YouTube" className="transition-transform hover:scale-110">
            <FaYoutube />
          </Link>
          <Link href="https://www.threads.com/@zwiedzajchytrze" target="_blank" aria-label="Threads" className="transition-transform hover:scale-110">
            <FaHashtag />
          </Link>
          <Link href="https://www.tiktok.com/@zwiedzajchytrze" target="_blank" aria-label="TikTok" className="transition-transform hover:scale-110">
            <FaTiktok />
          </Link>
          <Link href="https://www.instagram.com/zwiedzajchytrze/" target="_blank" aria-label="Instagram" className="transition-transform hover:scale-110">
            <FaInstagram />
          </Link>
          <Link href="https://www.facebook.com/profile.php?id=61578581730371" target="_blank" aria-label="Facebook" className="transition-transform hover:scale-110">
            <FaFacebook />
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-sm">
          &copy; {new Date().getFullYear()} <span className="font-semibold text-[#f1861e]">Zwiedzaj Chytrze</span>. Wszystkie prawa zastrzeżone.
        </p>
      </div>
    </footer>
  )
}
