import { createHash } from 'crypto'
import { Html, Head, Main, NextScript, type DocumentProps } from 'next/document'
import { getTurbopackChunkGroupBootstrap } from 'next/dist/server/get-page-files'
import { htmlEscapeJsonString } from 'next/dist/shared/lib/htmlescape'

/* Script half of the Content-Security-Policy, per page.

   Turbopack production builds put one inline bootstrap <script> on every page
   (NextScript's getInlineBootstrapScript). Its text is known here, so the page
   allows exactly that script by hash instead of 'unsafe-inline'. The header
   policy in next.config.js carries every other directive; browsers enforce
   both, so inline scripts need to pass this one. scripts/check-csp.mjs fails
   the build if a page ships an inline script this hash doesn't cover. */
function scriptSrc({ buildManifest, __NEXT_DATA__ }: DocumentProps): string | null {
  if (process.env.NODE_ENV !== 'production') return null
  const { pagesChunkGroupBootstrapParams: params, chunkLoadingGlobal } = buildManifest as typeof buildManifest & {
    pagesChunkGroupBootstrapParams?: Parameters<typeof getTurbopackChunkGroupBootstrap>[0]
    chunkLoadingGlobal?: string
  }
  const sources = ["'self'", 'https://www.googletagmanager.com']
  if (params && chunkLoadingGlobal) {
    const bootstrap = getTurbopackChunkGroupBootstrap(params, chunkLoadingGlobal, ['/_app', __NEXT_DATA__.page])
    if (bootstrap) {
      const hash = createHash('sha256').update(htmlEscapeJsonString(bootstrap)).digest('base64')
      sources.push(`'sha256-${hash}'`)
    }
  }
  return `script-src ${sources.join(' ')}`
}

export default function Document(props: DocumentProps) {
  const csp = scriptSrc(props)
  return (
    <Html lang="en" dir="ltr">
    <Head>
      {csp ? <meta httpEquiv="Content-Security-Policy" content={csp} /> : null}
      <meta name="theme-color" content="#070b14" />
      <link rel="icon" href="/favicon.ico" sizes="32x32" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
  )
}
