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
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm relative z-[100] overflow-visible">
      <div className="w-full max-w-screen-xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Zwiedzaj Chytrze Logo"
            width={40}
            height={40}
            priority
            unoptimized
            className="w-10 h-auto md:w-14"
          />
          <span className="text-base md:text-xl lg:text-2xl font-bold text-[#f1861e] leading-tight break-words">
            Zwiedzaj<br className="md:hidden" /> Chytrze
          </span>
        </Link>

        {/* Access buttons */}
        <div className="flex items-center gap-4 absolute top-4 right-4 md:static md:ml-auto z-[110]">
          <ThemeToggle />
          <AccessPanel />
          <button onClick={toggleMenu} className="md:hidden text-[#f1861e] focus:outline-none">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-6 text-center whitespace-nowrap">
          <Link href="/" className="px-3 py-1 text-gray-800 dark:text-gray-200 hover:underline">Strona główna</Link>
          <Link href="/blog" className="px-3 py-1 text-gray-800 dark:text-gray-200 hover:underline">Blog</Link>
          <Link href="/o-mnie" className="px-3 py-1 text-gray-800 dark:text-gray-200 hover:underline">O mnie</Link>
          <Link href="/kontakt" className="px-3 py-1 text-gray-800 dark:text-gray-200 hover:underline">Kontakt</Link>

          {user ? (
            <>
              <span className="px-3 py-1 text-[#f1861e]">Witaj {user.username}!</span>
              <Link href="/profil" className="px-3 py-1 text-[#f1861e] hover:underline">Mój profil</Link>
              <button
                onClick={logout}
                className="px-3 py-1 border border-red-400 text-red-500 rounded hover:bg-red-100 transition"
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 min-w-[120px] text-center border-2 border-[#f1861e] text-[#f1861e] rounded-full font-semibold hover:bg-[#f1861e] hover:text-white transition-colors"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 min-w-[120px] text-center border-2 border-gray-400 text-gray-700 dark:text-gray-300 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Zarejestruj się
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 pb-6 pt-4 space-y-3 text-center shadow-md transition-all duration-300 z-[90]">
          <Link href="/" onClick={closeMenu} className="block text-gray-800 dark:text-gray-200 hover:underline">Strona główna</Link>
          <Link href="/blog" onClick={closeMenu} className="block text-gray-800 dark:text-gray-200 hover:underline">Blog</Link>
          <Link href="/o-mnie" onClick={closeMenu} className="block text-gray-800 dark:text-gray-200 hover:underline">O mnie</Link>
          <Link href="/kontakt" onClick={closeMenu} className="block text-gray-800 dark:text-gray-200 hover:underline">Kontakt</Link>

          {user ? (
            <>
              <p className="text-[#f1861e]">Witaj, {user.username}</p>
              <Link href="/profil" onClick={closeMenu} className="block text-[#f1861e] hover:underline">Mój profil</Link>
              <button
                onClick={() => {
                  logout()
                  closeMenu()
                }}
                className="w-full px-4 py-2 border border-red-400 text-red-500 rounded hover:bg-red-100 transition"
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeMenu}
                className="block px-4 py-2 border-2 border-[#f1861e] text-[#f1861e] rounded-full font-semibold hover:bg-[#f1861e] hover:text-white transition-colors"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="block px-4 py-2 border-2 border-gray-400 text-gray-700 dark:text-gray-300 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Zarejestruj się
              </Link>
            </>
          )}

          <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-300 dark:border-gray-700 text-[#f1861e] text-2xl">
            <a href="https://www.youtube.com/@zwiedzajchytrze" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://www.threads.com/@zwiedzajchytrze" target="_blank" rel="noopener noreferrer"><FaHashtag /></a>
            <a href="https://www.tiktok.com/@zwiedzajchytrze" target="_blank" rel="noopener noreferrer"><FaTiktok /></a>
            <a href="https://www.instagram.com/zwiedzajchytrze/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://www.facebook.com/profile.php?id=61578581730371" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
          </div>
        </div>
      )}
    </nav>
  )
}
