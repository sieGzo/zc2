'use client'
import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'

export default function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const [token, setToken] = useState<string | null>(null)

  return (
    <div className="flex justify-center">
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={(token) => {
          setToken(token)
          onVerify(token)
        }}
        onExpire={() => {
          setToken(null)
          onVerify("")
        }}
      />
    </div>
  )
}
