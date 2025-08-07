'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  FaTiktok,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaHashtag,
} from 'react-icons/fa'

type VisitStats = {
  total: number
  today: number
  month: number
  unique: number
}

export default function Footer() {
  const [visits, setVisits] = useState<VisitStats | null>(null)

  useEffect(() => {
    fetch('/api/auth/counter')
      .then((res) => {
        if (!res.ok) throw new Error('❌ Błąd odpowiedzi z serwera')
        return res.json()
      })
      .then((data) => {
        console.log('✅ Dane odwiedzin z API:', data)
        setVisits(data)
      })
      .catch((err) => console.error('❌ Błąd pobierania danych:', err))
  }, [])

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t mt-16 px-4 py-10 text-gray-600 dark:text-gray-400 text-center">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
        {/* Logo i tekst */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
          <Image
            src="/logo.png"
            alt="Zwiedzaj Chytrze Logo"
            width={160}
            height={90}
            className="h-auto w-[120px] sm:w-[140px]"
          />
          <div className="text-xs sm:text-sm font-light text-left">
            <p>
              &copy; {new Date().getFullYear()}{' '}
              <span className="font-semibold text-[#f1861e]">Zwiedzaj Chytrze</span>. Wszystkie prawa zastrzeżone.
            </p>
            <div className="mt-2 space-y-1 text-gray-500 dark:text-gray-500 leading-snug">
              <p>🔢 Odwiedzin ogółem: <span className="font-medium">{visits?.total ?? '...'}</span></p>
              <p>📅 Dziś: <span className="font-medium">{visits?.today ?? '...'}</span></p>
              <p>🗓️ W tym miesiącu: <span className="font-medium">{visits?.month ?? '...'}</span></p>
              <p>👥 Unikalnych gości: <span className="font-medium">{visits?.unique ?? '...'}</span></p>
            </div>
          </div>
        </div>

        {/* Ikony sociali */}
        <div className="flex items-center justify-center gap-4 text-xl text-[#f1861e]">
          <a
            href="https://www.youtube.com/@zwiedzajchytrze"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="hover:scale-110 transition-transform"
          >
            <FaYoutube />
          </a>
          <a
            href="https://www.threads.com/@zwiedzajchytrze"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Threads"
            className="hover:scale-110 transition-transform"
          >
            <FaHashtag />
          </a>
          <a
            href="https://www.tiktok.com/@zwiedzajchytrze"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="hover:scale-110 transition-transform"
          >
            <FaTiktok />
          </a>
          <a
            href="https://www.instagram.com/zwiedzajchytrze/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:scale-110 transition-transform"
          >
            <FaInstagram />
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61578581730371"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:scale-110 transition-transform"
          >
            <FaFacebook />
          </a>
        </div>
      </div>
    </footer>
  )
}
