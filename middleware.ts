// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Ścieżki publiczne – bez wymogu sesji
const PUBLIC_PATHS = new Set([
  '/', '/login', '/about', '/contact', '/offers', '/articles', '/places', '/trails',
])

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) return true
  return false
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req

  // 1) Ucinamy pętlę: jeśli callbackUrl celuje w /login → zamień na '/'
  const cb = nextUrl.searchParams.get('callbackUrl')
  if (cb) {
    try {
      const u = new URL(cb, nextUrl.origin)
      if (u.pathname.startsWith('/login')) {
        nextUrl.searchParams.set('callbackUrl', '/')
        return NextResponse.redirect(nextUrl)
      }
    } catch {
      if (cb.includes('/login')) {
        nextUrl.searchParams.set('callbackUrl', '/')
        return NextResponse.redirect(nextUrl)
      }
    }
  }

  // 2) Przykład „lekkiej” ochrony prywatnych stron (opcjonalnie)
  //    Jeżeli dodasz pełny auth-guard, rozpoznaj sesję po ciasteczku next-auth.session-token
  const pathname = nextUrl.pathname
  if (!isPublicPath(pathname)) {
    const hasSession =
      cookies.has('next-auth.session-token') || // dev
      cookies.has('__Secure-next-auth.session-token') // prod https
    if (!hasSession) {
      const url = new URL('/login', nextUrl.origin)
      url.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/static|_next/static|_next/image|favicon.ico).*)'],
}
