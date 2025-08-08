// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/', '/login', '/about', '/contact', '/offers', '/articles', '/places', '/trails']

function isPublic(path: string) {
  if (PUBLIC.includes(path)) return true
  if (
    path.startsWith('/api/auth') ||
    path.startsWith('/_next') ||
    path === '/favicon.ico' ||
    path.startsWith('/images')
  ) return true
  return false
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  // A) Utnij callbackUrl jeśli kieruje na /login albo na '/'
  const cb = url.searchParams.get('callbackUrl')
  if (cb) {
    try {
      const u = new URL(cb, url.origin)
      if (u.pathname.startsWith('/login') || u.pathname === '/') {
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

  const hasSession =
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token')

  // B) Zalogowany użytkownik nie powinien siedzieć na /login
  if (pathname === '/login' && hasSession) {
    const to = new URL('/', url.origin) // zmień na '/profil' jeśli wolisz
    return NextResponse.redirect(to)
  }

  // C) Lekka ochrona stron prywatnych (poza publicznymi)
  if (!isPublic(pathname) && !hasSession) {
    const to = new URL('/login', url.origin)
    to.searchParams.set('callbackUrl', pathname + url.search)
    return NextResponse.redirect(to)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/static|_next/static|_next/image|favicon.ico).*)'],
}
