// components/Toaster.tsx
'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Kind = 'success' | 'error' | 'info'
type Toast = { id: number; text: string; kind: Kind; ttl: number }

const Ctx = createContext<{ push: (text: string, kind?: Kind) => void } | null>(null)

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])

  // dodaj toast
  const push = useCallback((text: string, kind: Kind = 'info') => {
    setItems((old) => [...old, { id: Date.now() + Math.random(), text, kind, ttl: 2600 }])
  }, [])

  // auto-usuwanie
  useEffect(() => {
    if (!items.length) return
    const t = setInterval(() => {
      setItems((old) => old
        .map(i => ({ ...i, ttl: i.ttl - 200 }))
        .filter(i => i.ttl > 0))
    }, 200)
    return () => clearInterval(t)
  }, [items.length])

  const value = useMemo(() => ({ push }), [push])

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* kontener toasta */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
        <ul className="flex flex-col gap-2">
          {items.map(({ id, text, kind }) => (
            <li
              key={id}
              role="status"
              aria-live="polite"
              className={[
                'pointer-events-auto rounded-lg px-4 py-2 text-sm shadow',
                'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border',
                kind === 'success' ? 'border-emerald-300 dark:border-emerald-600' :
                kind === 'error'   ? 'border-red-300 dark:border-red-600' :
                                     'border-gray-200 dark:border-gray-700'
              ].join(' ')}
            >
              {text}
            </li>
          ))}
        </ul>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToasterProvider>')
  return {
    info:   (t: string) => ctx.push(t, 'info'),
    success:(t: string) => ctx.push(t, 'success'),
    error:  (t: string) => ctx.push(t, 'error'),
  }
}
