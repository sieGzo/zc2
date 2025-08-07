'use client'

import { useState } from 'react'
import { MdOutlineContrast } from 'react-icons/md'
import { BsTextParagraph, BsTypeBold, BsLink45Deg } from 'react-icons/bs'
import { PiTextAa, PiTextColumnsBold } from 'react-icons/pi'
import { FaUniversalAccess } from 'react-icons/fa'

export default function AccessPanel() {
  const [open, setOpen] = useState(false)

  const toggleClass = (className: string) => {
    document.body.classList.toggle(className)
  }

  return (
    <div className="relative z-[95]">
      <button
        onClick={() => setOpen(!open)}
        className="text-[#f1861e] text-2xl hover:scale-110 transition"
        aria-label="Dostępność"
      >
        <FaUniversalAccess />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 sm:w-72 rounded-xl shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-sm text-gray-800 dark:text-gray-100 p-4 space-y-2 border border-gray-300 dark:border-gray-700 z-[100]">
          {[
            { icon: <MdOutlineContrast className="min-w-[20px]" />, label: 'Kontrast', class: 'contrast' },
            { icon: <PiTextAa className="min-w-[20px]" />, label: 'Rozmiar tekstu', class: 'large-font' },
            { icon: <PiTextColumnsBold className="min-w-[20px]" />, label: 'Odstępy między znakami', class: 'letter-spacing' },
            { icon: <BsTypeBold className="min-w-[20px]" />, label: 'Zmiana czcionki', class: 'font-alt' },
            { icon: <BsTextParagraph className="min-w-[20px]" />, label: 'Odstępy między wierszami', class: 'line-spacing' },
            { icon: <BsLink45Deg className="min-w-[20px]" />, label: 'Wyraźne linki', class: 'underline-links' },
          ].map(({ icon, label, class: className }) => (
            <button
              key={className}
              onClick={() => toggleClass(className)}
              className="flex items-center gap-2 hover:underline whitespace-nowrap w-full text-left"
            >
              {icon} {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
