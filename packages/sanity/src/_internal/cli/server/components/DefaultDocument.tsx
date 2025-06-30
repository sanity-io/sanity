/* eslint-disable i18next/no-literal-string */

import {black, white} from '@sanity/color'

import {Favicons} from './Favicons'
import {GlobalErrorHandler} from './globalErrorHandler/GlobalErrorHandler'
import {NoJavascript} from './NoJavascript'

const globalStyles = `
  html {
    @media (prefers-color-scheme: dark) {
      background-color: ${black.hex};
    }
    @media (prefers-color-scheme: light) {
      background-color: ${white.hex};
    }
  }
  html,
  body,
  #sanity {
    height: 100%;
  }
  body {
    margin: 0;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
`

/**
 * @hidden
 * @beta
 */
export interface DefaultDocumentProps {
  entryPath: string
  css?: string[]

  // Currently unused, but kept for potential future use
  // eslint-disable-next-line react/no-unused-prop-types
  basePath?: string
}

const EMPTY_ARRAY: never[] = []

/**
 * @internal
 */
export function DefaultDocument(props: DefaultDocumentProps): React.JSX.Element {
  const {entryPath, css = EMPTY_ARRAY} = props

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

        <Favicons />

        <title>Sanity Studio</title>

        <GlobalErrorHandler />

        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{__html: globalStyles}} />

        {css.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>

      <body>
        <div id="sanity" />
        <script type="module" src={entryPath} />
        <NoJavascript />
      </body>
    </html>
  )
}
