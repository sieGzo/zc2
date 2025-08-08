// middleware.ts — minimal anti-loop (no auth guard)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl

  // Block raw /api/auth/signin (without provider)
  if (url.pathname === '/api/auth/signin') {
    url.pathname = '/login'
    url.searchParams.delete('callbackUrl')
    return NextResponse.redirect(url)
  }

  // Strip callbackUrl that points to / or /login (prevents bouncing)
  const cb = url.searchParams.get('callbackUrl')
  if (cb) {
    try {
      const u = new URL(cb, url.origin)
      if (u.pathname === '/' || u.pathname.startsWith('/login')) {
        url.searchParams.delete('callbackUrl')
        return NextResponse.redirect(url)
      }
    } catch {
      if (cb === '/' || cb.includes('/login')) {
        url.searchParams.delete('callbackUrl')
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/static|_next/static|_next/image|favicon.ico).*)'],
}
