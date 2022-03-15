import React from 'react'

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
// For legacy sanity support
window.__DEV__ = true;
// Polyfill
window.setImmediate = setTimeout;
`

export function Document(props: {entryPath: string}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="same-origin" />
        <title>Sanity Studio</title>
        <style>{globalStyles}</style>
      </head>
      <body>
        <div id="sanity" />
        <script>{globalScript}</script>
        <script type="module" src={props.entryPath} />
      </body>
    </html>
  )
}
