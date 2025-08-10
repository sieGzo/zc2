// components/Navbar.tsxx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(v => !v)

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link href="/" prefetch={false} className="hover:text-[#f1861e]" onClick={onClick}>Strona główna</Link>
      <Link href="/blog" prefetch={false} className="hover:text-[#f1861e]" onClick={onClick}>Blog</Link>
      <Link href="/o-mnie" prefetch={false} className="hover:text-[#f1861e]" onClick={onClick}>O mnie</Link>
      <Link href="/kontakt" prefetch={false} className="hover:text-[#f1861e]" onClick={onClick}>Kontakt</Link>
      <Link href="/trails" prefetch={false} className="hover:text-[#f1861e]" onClick={onClick}>Szlaki</Link>
    </>
  )

  const AuthBlock = () => {
    if (loading) return <div className="w-28 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    if (user) {
      return (
        <div className="flex items-center gap-3">
          <Link href="/profil" prefetch={false} className="text-sm hover:underline">
            {(user as any).name || (user as any).username || 'Profil'}
          </Link>
          <button onClick={() => logout()} className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-black">
            Wyloguj
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" prefetch={false} className="px-3 py-1 rounded bg-[#f1861e] text-white hover:bg-orange-600">
          Zaloguj
        </Link>
        <Link href="/register" prefetch={false} className="px-3 py-1 rounded border border-[#f1861e] text-[#f1861e] hover:bg-orange-50">
          Rejestracja
        </Link>
      </div>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" prefetch={false} className="flex items-center gap-3">
          <Image src="/logo.png" alt="Zwiedzaj Chytrze" width={40} height={40} />
          <span className="font-bold text-lg">Zwiedzaj Chytrze</span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          <div className="flex items-center gap-5">
            <NavLinks />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthBlock />
          </div>
        </div>

        <button className="md:hidden p-2" onClick={toggleMenu} aria-label="Menu">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-2 py-2">
            <NavLinks onClick={() => setIsOpen(false)} />
          </div>
          <div className="flex items-center justify-between py-3">
            <ThemeToggle />
            <AuthBlock />
          </div>
        </div>
      )}
    </nav>
  )
}
