'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // pozycja panelu (portal + fixed, zakotwiczony do przycisku)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  // init z localStorage
  useEffect(() => {
    const saved = localStorage.getItem('a11y-classes')
    const list: string[] = saved ? JSON.parse(saved) : []
    const set = new Set(list)
    setActive(set)

    list.forEach(c => {
      if (c === 'large-font') {
        document.documentElement.classList.add(c) // html.large-font (wspierane w global.css)
      } else {
        document.body.classList.add(c)
      }
    })
  }, [])

  const persist = (set: Set<string>) => {
    localStorage.setItem('a11y-classes', JSON.stringify(Array.from(set)))
  }

  const toggleClass = (cls: string) => {
    const next = new Set(active)
    const willEnable = !next.has(cls)

    const add = (el: Element, c: string) => el.classList.add(c)
    const remove = (el: Element, c: string) => el.classList.remove(c)

    if (cls === 'large-font') {
      willEnable ? add(document.documentElement, cls) : remove(document.documentElement, cls)
    } else {
      willEnable ? add(document.body, cls) : remove(document.body, cls)
    }

    if (willEnable) {
      next.add(cls)
      // kontrast wyłącza dark na html (żeby się nie gryzło)
      if (cls === 'contrast') {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    } else {
      next.delete(cls)
    }

    setActive(next)
    persist(next)
  }

  const isOn = useMemo(() => (cls: string) => active.has(cls), [active])

  // oblicz pozycję panelu względem przycisku (fixed + portal)
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const gap = 8 // odległość pod przyciskiem
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, 12), // środek przycisku, z lekkim marginesem
      window.innerWidth - 12
    )
    const top = Math.min(rect.bottom + gap, window.innerHeight - 12)
    setCoords({ top, left })
  }, [open])

  // klik poza / ESC / focus first
  useEffect(() => {
    if (!open) return

    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return
      const target = e.target as Node
      if (!panelRef.current.contains(target) && !btnRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)

    // focus pierwszego elementu po wyrenderowaniu
    const id = window.setTimeout(() => {
      const firstBtn = panelRef.current?.querySelector('button[role="menuitemcheckbox"]') as HTMLButtonElement | null
      firstBtn?.focus()
    }, 0)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(id)
    }
  }, [open])

  return (
    <div className="relative z-[2100]">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="text-[#f1861e] text-2xl hover:scale-110 transition"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="access-panel"
        aria-label="Dostępność"
      >
        <FaUniversalAccess />
      </button>

      {open && coords &&
        createPortal(
          <div
            id="access-panel"
            ref={panelRef}
            role="menu"
            aria-label="Panel dostępności"
            // fixed + portal => brak problemów z overflow/transform
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: 'translateX(-50%)',
            }}
            className="
              w-[90vw] sm:w-72 max-h-[70vh] overflow-auto rounded-xl shadow-2xl
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
                className="flex items-center gap-2 hover:underline whitespace-normal break-words w-full text-left py-2"
              >
                {icon} {label}
              </button>
            ))}

            <hr className="my-2 border-gray-200 dark:border-gray-700" />

            <button
              onClick={() => {
                const next = new Set<string>()
                OPTIONS.forEach(o => {
                  document.body.classList.remove(o.cls)
                  document.documentElement.classList.remove(o.cls)
                })
                setActive(next)
                persist(next)
                setOpen(false)
                btnRef.current?.focus()
              }}
              className="w-full text-left py-2 font-semibold text-[#f1861e] hover:underline"
            >
              Resetuj ustawienia
            </button>
          </div>,
          document.body
        )
      }
    </div>
  )
}
