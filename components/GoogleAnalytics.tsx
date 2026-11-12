import { useEffect } from 'react'
import Script from 'next/script'

// Google Analytics 4 with Consent Mode v2 (no banner), rendered once from
// pages/_app.tsx so every page is tracked. EEA/UK/CH visitors default to
// denied (cookieless pings); everyone else defaults to granted. The consent
// defaults must be queued before gtag('config').
//
// Commands are queued from the bundle rather than an inline <script> so the
// Content-Security-Policy (next.config.js, pages/_document.tsx) needs no
// 'unsafe-inline' or extra hash. gtag.js waits for the window load event
// (lazyOnload) and replays the queue when it arrives.
//
// Client-side route changes: the GA4 property has enhanced measurement's
// "page changes based on browser history events" on, so gtag.js sends one
// page_view per pushState navigation itself. Sending another from
// routeChangeComplete here would double-count them.
const GA_ID = 'G-L1ETKYXNV4'

const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT',
  'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
]

let queued = false

function queueGtag() {
  // Strict Mode runs effects twice in development; config must go out once.
  if (queued) return
  queued = true
  const w = window as unknown as { dataLayer?: unknown[] }
  const dataLayer = (w.dataLayer = w.dataLayer || [])
  // gtag.js reads the arguments object itself, not an array copy.
  function gtag(..._args: unknown[]) {
    dataLayer.push(arguments)
  }
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    region: CONSENT_REGIONS,
    wait_for_update: 500,
  })
  gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  })
  gtag('js', new Date())
  gtag('config', GA_ID)
}

export function GoogleAnalytics() {
  useEffect(queueGtag, [])
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
}
