import PropTypes from 'prop-types'
import React from 'react'
import generateScriptLoader from '../util/generateScriptLoader'
import AppLoadingScreen from './AppLoadingScreen'
import NoJavascript from './NoJavascript'

function assetUrl(staticPath, item) {
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

function Document(props) {
  const basePath = props.basePath.replace(/\/+$/, '')
  const staticPath = `${basePath}${props.staticPath}`

  const stylesheets = props.stylesheets.map(item => (
    <link key={item.path} rel="stylesheet" href={assetUrl(staticPath, item)} />
  ))

  const subresources = props.scripts.map(item => (
    <link key={item.path} rel="subresource" href={assetUrl(staticPath, item)} />
  ))

  const scripts = props.scripts.map(item => assetUrl(staticPath, item))
  const scriptLoader = generateScriptLoader(scripts)

  const favicons = props.favicons.map((item, index) => (
    <link {...item} key={item.path} rel={item.rel || 'icon'} href={assetUrl(staticPath, item)} />
  ))

  return (
    <html>
      <head>
        <meta charSet={props.charset} />
        <title>{props.title}</title>
        <meta name="viewport" content={props.viewport} />
        {stylesheets}
        {subresources}
        {favicons}
      </head>
      <body id="sanityBody">
        <div id="sanity">
          <AppLoadingScreen text={props.loading} />
          <NoJavascript />
        </div>

        {/* eslint-disable react/no-danger */}
        <script dangerouslySetInnerHTML={{__html: scriptLoader}} />
        {/* eslint-enable react/no-danger */}
      </body>
    </html>
  )
}

const asset = PropTypes.shape({
  path: PropTypes.string.isRequired,
  hash: PropTypes.string
})

Document.defaultProps = {
  basePath: '',
  charset: 'utf-8',
  title: 'Sanity',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  loading: 'Connecting to Sanity.io',
  staticPath: '/static',
  favicons: [
    {path: 'favicon-16x16.png', type: 'image/png', sizes: '16x16'},
    {path: 'favicon-32x32.png', type: 'image/png', sizes: '32x32'},
    {path: 'favicon-64x64.png', type: 'image/png', sizes: '64x64'},
    {path: 'favicon-96x96.png', type: 'image/png', sizes: '96x96'},
    {path: 'favicon-mask.svg', type: 'image/svg+xml', rel: 'mask-icon', color: '#f43'},
    {path: 'favicon.ico', type: 'image/x-icon'}
  ],
  stylesheets: [],
  scripts: []
}

Document.propTypes = {
  basePath: PropTypes.string,
  charset: PropTypes.string,
  title: PropTypes.string,
  viewport: PropTypes.string,
  loading: PropTypes.node,
  staticPath: PropTypes.string,
  favicons: PropTypes.arrayOf(asset),
  stylesheets: PropTypes.arrayOf(asset),
  scripts: PropTypes.arrayOf(asset)
}

export default Document
