import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="en">
    <Head>
    <script id="runRdOnLoad" dangerouslySetInnerHTML={{ 
          __html: `
            function __rdOnLoad() {
              RumDash.init({
                key: "ua4cxM67PwNfhjiaYgHM7D",
                env: "prod",
                // Optionally specify 'revision' to track releases' effect on performance
                // revision: "[RELEASE_VERSION_OR_COMMIT_SHA]",
              });
            }
          `
        }} />
      <Script
        src="https://cdn.rumdash.io/client.js" 
        strategy="afterInteractive" 
      />
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-L1ETKYXNV4" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', 'G-L1ETKYXNV4');
        `}
      </Script>
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
  )
}
