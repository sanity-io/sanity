/* eslint-disable i18next/no-literal-string  -- title is literal for now */
import {Favicons} from './Favicons'
import {GlobalErrorHandler} from './globalErrorHandler'
import {NoJavascript} from './NoJavascript'

/**
 * @hidden
 * @beta */
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
 * @hidden
 * @beta */
export function BasicDocument(props: BasicDocumentProps): React.JSX.Element {
  const {entryPath, css = EMPTY_ARRAY} = props

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="same-origin" />

        <Favicons />
        <title>Sanity CORE App</title>
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
