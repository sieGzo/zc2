// components/Navbar.tsx — safe render based on session status
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import AccessPanel from './AccessPanel'
import { Menu, X } from 'lucide-react'
import { FaYoutube, FaHashtag, FaTiktok, FaInstagram, FaFacebook } from 'react-icons/fa'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" prefetch={false} className="flex items-center gap-3">
          <Image src="/logo.png" alt="Zwiedzaj Chytrze" width={40} height={40} />
          <span className="font-bold text-lg">Zwiedzaj Chytrze</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/articles" prefetch={false} className="hover:text-[#f1861e]">Artykuły</Link>
          <Link href="/offers" prefetch={false} className="hover:text-[#f1861e]">Oferty</Link>
          <Link href="/trails" prefetch={false} className="hover:text-[#f1861e]">Szlaki</Link>
          <ThemeToggle />

          {/* Auth block */}
          {loading ? (
            <div className="w-24 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link href="/profil" prefetch={false} className="text-sm hover:underline">
                {(user as any).name || (user as any).username || 'Profil'}
              </Link>
              <button onClick={() => logout()} className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-black">Wyloguj</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" prefetch={false} className="px-3 py-1 rounded bg-[#f1861e] text-white hover:bg-orange-600">Zaloguj</Link>
              <Link href="/register" prefetch={false} className="px-3 py-1 rounded border border-[#f1861e] text-[#f1861e] hover:bg-orange-50">Rejestracja</Link>
            </div>
          )}
        </div>

        <button className="md:hidden p-2" onClick={toggleMenu} aria-label="Menu">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-2">
            <Link href="/articles" prefetch={false} className="py-2">Artykuły</Link>
            <Link href="/offers" prefetch={false} className="py-2">Oferty</Link>
            <Link href="/trails" prefetch={false} className="py-2">Szlaki</Link>
            <ThemeToggle />
            {loading ? (
              <div className="w-24 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : user ? (
              <>
                <Link href="/profil" prefetch={false} className="py-2">Mój profil</Link>
                <button onClick={() => logout()} className="py-2 text-left">Wyloguj</button>
              </>
            ) : (
              <>
                <Link href="/login" prefetch={false} className="py-2">Zaloguj</Link>
                <Link href="/register" prefetch={false} className="py-2">Rejestracja</Link>
              </>
            )}
          </div>

          <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-300 dark:border-gray-700 text-[#f1861e] text-2xl">
            <a href="https://www.youtube.com/@zwiedzajchytrze" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://www.threads.com/@zwiedzajchytrze" target="_blank" rel="noopener noreferrer"><FaHashtag /></a>
            <a href="https://www.tiktok.com/@zwiedzajchytrze" target="_blank" rel="noopener noreferrer"><FaTiktok /></a>
            <a href="https://www.instagram.com/zwiedzajchytrze/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://www.facebook.com/profile.php?id=615" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
          </div>
        </div>
      )}
    </nav>
  )
}
