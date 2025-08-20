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
      className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm
                 dark:border-gray-800 dark:bg-gray-800/60"
      role="status"
      aria-live="polite"
    >
      <span aria-hidden className="text-[13px]">{emoji}</span>
      <span className="font-semibold tabular-nums">{loading ? '…' : fmt.format(value ?? 0)}</span>
      <span className="pl-1 text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  )
}

export default function Footer() {
  const SHOW_STATS =
    (process.env.NEXT_PUBLIC_SHOW_VISIT_STATS ?? 'true').toLowerCase() !== 'false'

  const [visits, setVisits] = useState<VisitStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!SHOW_STATS) return
    const ac = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        const r = await fetch('/api/auth/counter', {
          signal: ac.signal,
          cache: 'no-store',
          headers: { 'x-no-cache': '1' },
        })
        if (!r.ok) return
        const d = (await r.json()) as VisitStats
        setVisits(d)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    return () => ac.abort()
  }, [SHOW_STATS])

  return (
    <footer className="mt-16 border-t bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 text-center">

        {/* STATSY: responsywny grid */}
        {SHOW_STATS && (
          <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
            <Pill label="ogółem"   value={visits?.total}  loading={loading && !visits} emoji="🔢" />
            <Pill label="dziś"     value={visits?.today}  loading={loading && !visits} emoji="📅" />
            <Pill label="miesiąc"  value={visits?.month}  loading={loading && !visits} emoji="🗓️" />
            <Pill label="unikalni" value={visits?.unique} loading={loading && !visits} emoji="👥" />
          </div>
        )}

        {/* SOCIALS */}
        <div className="flex items-center gap-4 text-xl text-[#f1861e]">
          <Link href="https://www.youtube.com/@zwiedzajchytrze" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-opacity hover:opacity-80"><FaYoutube /></Link>
          <Link href="https://www.threads.net/@zwiedzajchytrze"  target="_blank" rel="noopener noreferrer" aria-label="Threads" className="transition-opacity hover:opacity-80"><FaHashtag /></Link>
          <Link href="https://www.tiktok.com/@zwiedzajchytrze"   target="_blank" rel="noopener noreferrer" aria-label="TikTok"   className="transition-opacity hover:opacity-80"><FaTiktok /></Link>
          <Link href="https://www.instagram.com/zwiedzajchytrze/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"className="transition-opacity hover:opacity-80"><FaInstagram /></Link>
          <Link href="https://www.facebook.com/profile.php?id=61578581730371" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-opacity hover:opacity-80"><FaFacebook /></Link>
        </div>

        {/* LINKI PRAWNE */}
        <nav className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/polityka-prywatnosci" className="underline-offset-2 hover:underline">Polityka prywatności</Link>
          <span className="opacity-40">•</span>
          <Link href="/regulamin" className="underline-offset-2 hover:underline">Regulamin</Link>
          <span className="opacity-40">•</span>
          <Link href="/kontakt" className="underline-offset-2 hover:underline">Kontakt</Link>
        </nav>

        {/* COPYRIGHT */}
        <p className="flex flex-wrap items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} <span className="whitespace-nowrap font-semibold text-[#f1861e]">Zwiedzaj Chytrze</span>
          <Image src="/logo.png" alt="" width={20} height={20} className="inline-block translate-y-[1px]" />
          <span className="whitespace-nowrap">Wszystkie prawa zastrzeżone.</span>
        </p>
      </div>
    </footer>
  )
}
