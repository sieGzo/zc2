// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '../hooks/useAuth'
import SessionSync from '../components/SessionSync'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        <SessionSync />
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </AuthProvider>
    </SessionProvider>
  )
}
