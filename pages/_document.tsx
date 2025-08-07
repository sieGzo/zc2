// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pl">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <noscript>
          <style>{`body { overflow-x: hidden !important; }`}</style>
        </noscript>
      </Head>
      <body className="bg-white dark:bg-gray-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
