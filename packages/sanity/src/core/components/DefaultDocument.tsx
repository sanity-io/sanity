/* eslint-disable i18next/no-literal-string */
import React from 'react'
import {NoJavascript} from './NoJavascript'
import {GlobalErrorHandler} from './globalErrorHandler'
import {Favicons} from './Favicons'

const globalStyles = `
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Regular.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 400;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Italic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Medium.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 500;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-MediumItalic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-SemiBold.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 600;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-SemiBoldItalic.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-Bold.woff2") format("woff2");
  }
  @font-face {
    font-family: Inter;
    font-style: italic;
    font-weight: 700;
    font-display: swap;
    src: url("https://studio-static.sanity.io/Inter-BoldItalic.woff2") format("woff2");
  }
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
  }
`

/**
 * @hidden
 * @beta */
export interface DefaultDocumentProps {
  entryPath: string
  css?: string[]
  basePath?: string
}

const EMPTY_ARRAY: never[] = []

/**
 * @hidden
 * @beta */
export function DefaultDocument(props: DefaultDocumentProps): React.ReactElement {
  const {entryPath, css = EMPTY_ARRAY, basePath = '/'} = props
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="same-origin" />

        <Favicons basePath={basePath} />

        <title>Sanity Studio</title>

        <GlobalErrorHandler />

        {css.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{__html: globalStyles}} />
      </head>
      <body>
        <div id="sanity" />
        <script type="module" src={entryPath} />
        <NoJavascript />
      </body>
    </html>
  )
}
