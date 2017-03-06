import path from 'path'
import express from 'express'
import React from 'react'
import ReactDOM from 'react-dom/server'
import requireUncached from 'require-uncached'
import {resolveParts} from '@sanity/resolver'

const docPart = 'part:@sanity/base/document'
const initPart = 'part:@sanity/server/initializer'

const getDefaultModule = mod => {
  return mod && mod.__esModule ? mod.default : mod
}

const assetify = (assetPath, hashes) => ({
  path: assetPath,
  hash: hashes[assetPath]
})

const getDocumentComponent = basePath =>
  resolveParts({basePath}).then(res => {
    const part = res.implementations[docPart]
    if (!part) {
      throw new Error(`Part '${docPart}' is not implemented by any plugins, are you missing @sanity/base?`)
    }

    return getDefaultModule(
      requireUncached(part[0].path)
    )
  })

export function getBaseServer() {
  return express()
}

export function getDocumentElement({basePath, hashes}, props = {}) {
  const assetHashes = hashes || {}
  return getDocumentComponent(basePath)
    .then(Document =>
      React.createElement(Document, Object.assign({
        stylesheets: ['css/main.css'].map(item => assetify(item, assetHashes)),
        scripts: [
          'js/vendor.bundle.js',
          'js/app.bundle.js'
        ].map(item => assetify(item, assetHashes))
      }, props))
    )
}

export function applyStaticRoutes(app, config = {}) {
  const staticPath = config.staticPath || path.join(__dirname, '..', 'public')
  app.use('/static', express.static(staticPath))

  app.get('*', (req, res) => {
    if (req.url.indexOf('/static') === 0) {
      return res.status(404).send('File not found')
    }

    return getDocumentElement(config)
      .then(doc => res.send(`<!doctype html>${ReactDOM.renderToStaticMarkup(doc)}`))
      .catch(err => {
        console.error(err.stack) // eslint-disable-line no-console

        res
          .set('Content-Type', 'text/plain')
          .status(500)
          .send(err.stack)
      })
  })

  return app
}

export function callInitializers(config) {
  resolveParts({config}).then(res => {
    const parts = res.implementations[initPart]
    if (!parts) {
      return
    }

    res.implementations[initPart]
      .map(part => getDefaultModule(require(part.path)))
      .forEach(initializer => initializer(config))
  })
}
