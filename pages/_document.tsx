import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
        <script type="text/javascript">
          function __rdOnLoad() {
            RumDash.init({
              key: "ua4cxM67PwNfhjiaYgHM7D",
              env: "prod",
              /*
              ======================================================================
              Optionally specify 'revision' to track releases' effect on performance
              ======================================================================
              revision: "[RELEASE_VERSION_OR_COMMIT_SHA]",
              */
            })
          }
        </script>
        <script defer type="text/javascript" src="https://cdn.rumdash.io/client.js"></script>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
