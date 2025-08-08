// components/SessionSync.tsx — no redirects, just exposes status changes
'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function SessionSync() {
  const { status } = useSession()
  useEffect(() => {
    // Optional: emit custom event for app state; no router.push here
    window.dispatchEvent(new CustomEvent('auth:status', { detail: status }))
  }, [status])
  return null
}
