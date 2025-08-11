'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MdOutlineContrast } from 'react-icons/md'
import { BsTextParagraph, BsTypeBold, BsLink45Deg } from 'react-icons/bs'
import { PiTextAa, PiTextColumnsBold } from 'react-icons/pi'
import { FaUniversalAccess } from 'react-icons/fa'

type Opt = { icon: JSX.Element; label: string; cls: string }

const OPTIONS: Opt[] = [
  { icon: <MdOutlineContrast className="min-w-[20px]" />, label: 'Kontrast', cls: 'contrast' },
  { icon: <PiTextAa className="min-w-[20px]" />, label: 'Rozmiar tekstu', cls: 'large-font' },
  { icon: <PiTextColumnsBold className="min-w-[20px]" />, label: 'Odstępy między znakami', cls: 'letter-spacing' },
  { icon: <BsTypeBold className="min-w-[20px]" />, label: 'Zmiana czcionki', cls: 'font-alt' },
  { icon: <BsTextParagraph className="min-w-[20px]" />, label: 'Odstępy między wierszami', cls: 'line-spacing' },
  { icon: <BsLink45Deg className="min-w-[20px]" />, label: 'Wyraźne linki', cls: 'underline-links' },
]

export default function AccessPanel() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement | null>(null)

  // wczytaj zapisane ustawienia
  useEffect(() => {
    const saved = localStorage.getItem('a11y-classes')
    const list: string[] = saved ? JSON.parse(saved) : []
    const set = new Set(list)
    setActive(set)
    // zsynchronizuj z body
    list.forEach(c => document.body.classList.add(c))
  }, [])

  const persist = (set: Set<string>) => {
    localStorage.setItem('a11y-classes', JSON.stringify(Array.from(set)))
  }

  const toggleClass = (cls: string) => {
    const next = new Set(active)
    if (next.has(cls)) {
      next.delete(cls)
      document.body.classList.remove(cls)
    } else {
      next.add(cls)
      document.body.classList.add(cls)
      if (cls === 'contrast') {
        // wyłącz dark na <html>, żeby tryby się nie gryzły
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
        next.delete('dark')
      }
    }
    setActive(next)
    persist(next)
  }


  // zamykanie po kliknięciu poza i ESC + ustaw fokus po otwarciu
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)

    // focus pierwszy przycisk po otwarciu
    const firstBtn = panelRef.current?.querySelector('button[role="menuitemcheckbox"]') as HTMLButtonElement | null
    firstBtn?.focus()

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // ułatwka do sprawdzania czy dana klasa aktywna
  const isOn = useMemo(() => (cls: string) => active.has(cls), [active])

  return (
    <div className="relative z-[2100]">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[#f1861e] text-2xl hover:scale-110 transition"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Dostępność"
      >
        <FaUniversalAccess />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Panel dostępności"
          className="
            absolute
            left-1/2 -translate-x-1/2
            mt-2 w-[90vw] sm:w-72
            max-h-[70vh] overflow-auto
            rounded-xl shadow-2xl
            bg-white dark:bg-gray-800 backdrop-blur-md
            text-sm text-gray-800 dark:text-gray-100
            p-4 space-y-2 border border-gray-300 dark:border-gray-700
            z-[2150]
          "
        >
          {OPTIONS.map(({ icon, label, cls }) => (
            <button
              key={cls}
              role="menuitemcheckbox"
              aria-checked={isOn(cls)}
              onClick={() => toggleClass(cls)}
              className="
                flex items-center gap-2
                hover:underline
                whitespace-normal break-words
                w-full text-left
                py-2
              "
            >
              {icon} {label}
            </button>
          ))}

          <hr className="my-2 border-gray-200 dark:border-gray-700" />

          <button
            onClick={() => {
              // usuń wszystkie a11y klasy
              const next = new Set<string>()
              OPTIONS.forEach(o => document.body.classList.remove(o.cls))
              setActive(next)
              persist(next)
              setOpen(false)
            }}
            className="w-full text-left py-2 font-semibold text-[#f1861e] hover:underline"
          >
            Resetuj ustawienia
          </button>
        </div>
      )}
    </div>
  )
}
