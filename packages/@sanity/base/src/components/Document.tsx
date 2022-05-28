import React, {useMemo} from 'react'
import generateScriptLoader from '../util/generateScriptLoader'
import uncaughtErrorHandler from '../util/uncaughtErrorHandler'
import AppLoadingScreen from './AppLoadingScreen'
import NoJavascript from './NoJavascript'

export interface DocumentAsset {
  path: string
  hash?: string
}

export interface DocumentProps {
  basePath?: string
  charset?: string
  lang?: string
  title?: string
  viewport?: string
  loading?: React.ReactNode
  staticPath?: string
  favicons?: DocumentAsset[]
  stylesheets?: DocumentAsset[]
  scripts?: DocumentAsset[]
}

const DEFAULT_FAVICONS: DocumentAsset[] = [{path: 'favicon.ico'}]

export default function Document(props: DocumentProps) {
  const {
    basePath: basePathProp = '',
    charset = 'utf-8',
    title = 'Sanity',
    viewport = 'width=device-width, initial-scale=1, viewport-fit=cover',
    lang = 'en',
    loading = 'Connecting to Sanity.io',
    staticPath: staticPathProp = '/static',
    favicons: faviconsProp = DEFAULT_FAVICONS,
    stylesheets: stylesheetsProp = [],
    scripts: scriptsProp = [],
  } = props

  const basePath = basePathProp.replace(/\/+$/, '')
  const staticPath = `${basePath}${staticPathProp}`

  const stylesheets = useMemo(
    () =>
      stylesheetsProp.map((item) => (
        <link key={item.path} rel="stylesheet" href={assetUrl(staticPath, item)} />
      )),
    [stylesheetsProp, staticPath]
  )

  const subresources = useMemo(
    () =>
      scriptsProp.map((item) => (
        <link key={item.path} rel="subresource" href={assetUrl(staticPath, item)} />
      )),
    [scriptsProp, staticPath]
  )

  const scripts = useMemo(() => scriptsProp.map((item) => assetUrl(staticPath, item)), [
    scriptsProp,
    staticPath,
  ])

  const scriptLoader = useMemo(() => generateScriptLoader(scripts), [scripts])
  const errorHandler = useMemo(() => uncaughtErrorHandler(), [])

  const favicons = useMemo(
    () =>
      faviconsProp.map((item) => (
        <link key={item.path} rel="icon" href={assetUrl(staticPath, item)} />
      )),
    [faviconsProp, staticPath]
  )

  return (
    <html lang={lang}>
      <head>
        <meta charSet={charset} />
        <title>{title}</title>
        <meta name="viewport" content={viewport} />
        <meta name="robots" content="noindex" />
        <meta name="referrer" content="same-origin" />
        <style>{`html {background-color: #f1f3f6;}`}</style>
        {stylesheets}
        {subresources}
        {favicons}
      </head>
      <body id="sanityBody">
        <div id="sanity">
          <AppLoadingScreen text={loading} />
          <NoJavascript />
        </div>

        {/* eslint-disable react/no-danger */}
        <script dangerouslySetInnerHTML={{__html: errorHandler}} />
        <script dangerouslySetInnerHTML={{__html: scriptLoader}} />
        {/* eslint-enable react/no-danger */}
      </body>
    </html>
  )
}

function assetUrl(staticPath: string, item: DocumentAsset) {
  const isAbsolute = item.path.match(/^https?:\/\//)

  if (isAbsolute) {
    return item.path
  }

  const base = `${staticPath}/${item.path}`

  if (!item.hash) {
    return base
  }

  const hasQuery = base.indexOf('?') !== -1
  const separator = hasQuery ? '&' : '?'

  return `${base}${separator}${item.hash}`
}
