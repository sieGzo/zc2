'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FaTiktok, FaInstagram, FaFacebook, FaYoutube, FaHashtag } from 'react-icons/fa'

type VisitStats = { total: number; today: number; month: number; unique: number }

function Pill({
  label, value, loading, emoji,
}: { label: string; value?: number; loading?: boolean; emoji: string }) {
  const fmt = useMemo(() => new Intl.NumberFormat('pl-PL'), [])
  return (
    <div
      className="rounded-full px-3 py-1.5 text-[12px] leading-none
                 bg-white/70 border border-gray-200/70
                 dark:bg-gray-800/60 dark:border-gray-700
                 flex items-center justify-center gap-1"
    >
      <span aria-hidden className="text-[13px]">{emoji}</span>
      <span className="font-medium">{loading ? '…' : fmt.format(value ?? 0)}</span>
      <span className="pl-1 text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}

export default function Footer() {
  const SHOW_STATS =
    (process.env.NEXT_PUBLIC_SHOW_VISIT_STATS ?? 'true').toLowerCase() !== 'false'

  const [visits, setVisits] = useState<VisitStats | null>(null)

  useEffect(() => {
    if (!SHOW_STATS) return
    const ac = new AbortController()
    fetch('/api/auth/counter', { signal: ac.signal, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setVisits(d))
      .catch(() => {})
    return () => ac.abort()
  }, [SHOW_STATS])

  const loading = SHOW_STATS && !visits

  return (
    <footer className="mt-16 border-t bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/80">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center text-center gap-6">
        {SHOW_STATS && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Pill label="ogółem"   value={visits?.total}  loading={loading} emoji="🔢" />
            <Pill label="dziś"     value={visits?.today}  loading={loading} emoji="📅" />
            <Pill label="miesiąc"  value={visits?.month}  loading={loading} emoji="🗓️" />
            <Pill label="unikalni" value={visits?.unique} loading={loading} emoji="👥" />
          </div>
        )}

        <div className="flex items-center gap-4 text-xl text-[#f1861e]">
          <Link href="https://www.youtube.com/@zwiedzajchytrze" target="_blank" aria-label="YouTube" className="transition-opacity hover:opacity-80"><FaYoutube /></Link>
          <Link href="https://www.threads.com/@zwiedzajchytrze"   target="_blank" aria-label="Threads" className="transition-opacity hover:opacity-80"><FaHashtag /></Link>
          <Link href="https://www.tiktok.com/@zwiedzajchytrze"    target="_blank" aria-label="TikTok"   className="transition-opacity hover:opacity-80"><FaTiktok /></Link>
          <Link href="https://www.instagram.com/zwiedzajchytrze/" target="_blank" aria-label="Instagram"className="transition-opacity hover:opacity-80"><FaInstagram /></Link>
          <Link href="https://www.facebook.com/profile.php?id=61578581730371" target="_blank" aria-label="Facebook" className="transition-opacity hover:opacity-80"><FaFacebook /></Link>
        </div>

        {/* Copyright – lisek PO napisie „Zwiedzaj Chytrze”, malutki i bez obramowania */}
        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
          © {new Date().getFullYear()}&nbsp;
          <span className="font-semibold text-[#f1861e]">Zwiedzaj Chytrze</span>
          <Image
            src="/logo.png"
            alt=""
            width={24}
            height={24}
            className="inline-block align-middle translate-y-[1px]"
          />
          <span className="ml-1">Wszystkie prawa zastrzeżone.</span>
        </p>
      </div>
    </footer>
  )
}
