import '@/styles/globals.css'
import '@/styles/theme.css'
import type { AppProps } from 'next/app'
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'

// Hanken Grotesk for display and UI; JetBrains Mono only for package names,
// commands and code.
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sans.variable} ${mono.variable} c-root`}>
      <Component {...pageProps} />
    </div>
  )
}
