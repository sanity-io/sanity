/**
 * App HTML Document, this is in the _internal package
 * to avoid importing styled-components from sanity pacakge
 */

/* eslint-disable i18next/no-literal-string  -- title is literal for now */
import {type JSX} from 'react'

import {Favicons} from './Favicons'
import {GlobalErrorHandler} from './globalErrorHandler/GlobalErrorHandler'
import {NoJavascript} from './NoJavascript'

/**
 * @internal
 */
export interface BasicDocumentProps {
  entryPath: string
  css?: string[]
  // Currently unused, but kept for potential future use
  // eslint-disable-next-line react/no-unused-prop-types
  basePath?: string
}

const EMPTY_ARRAY: never[] = []

/**
 * This is the equivalent of DefaultDocument for non-studio apps.
 * @internal
 */
export function BasicDocument(props: BasicDocumentProps): JSX.Element {
  const {entryPath, css = EMPTY_ARRAY} = props

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="same-origin" />

        <Favicons />
        <title>Sanity Custom App</title>
        <GlobalErrorHandler />

        {css.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <div id="root" />
        <script type="module" src={entryPath} />
        <NoJavascript />
      </body>
    </html>
  )
}
