import React from 'react'
import {Favicons} from './Favicons'

const globalStyles = `
html {
  background-color: #f1f3f6;
}
html,
body,
#sanity {
  height: 100%;
}
body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
}`

const globalScript = `
// Polyfill
window.setImmediate = setTimeout;
`

export interface DocumentProps {
  entryPath: string
  basePath?: string
}

export function DefaultDocument(props: DocumentProps) {
  const {entryPath, basePath = '/'} = props
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="same-origin" />

        <Favicons basePath={basePath} />

        <title>Sanity Studio</title>
        <style>{globalStyles}</style>
      </head>
      <body>
        <div id="sanity" />
        <script>{globalScript}</script>
        <script type="module" src={entryPath} />
      </body>
    </html>
  )
}
