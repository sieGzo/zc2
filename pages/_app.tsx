import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import SessionSync from '../components/SessionSync'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ToasterProvider } from '@/components/Toaster'
import 'leaflet/dist/leaflet.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  return (
    <SessionProvider session={(pageProps as any).session}>
      <ToasterProvider>
        <SessionSync />
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </ToasterProvider>
    </SessionProvider>
  )
}
