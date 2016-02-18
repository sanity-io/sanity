import path from 'path'
import express from 'express'

export function getBaseServer() {
  return express()
}

export function applyStaticRoutes(app, config = {}) {
  const staticPath = config.staticPath || path.join(__dirname, '..', 'public')
  app.use('/static', express.static(staticPath))

  app.get('*', (req, res) => {
    if (req.url.indexOf('/static') === 0) {
      res.status(404).send('File not found')
    } else {
      res.sendFile(path.join(__dirname, 'templates', 'layout.html'))
    }
  })

  return app
}
