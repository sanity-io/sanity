import path from 'path'
import express from 'express'

export function getBaseServer() {
  return express()
}

export function applyStaticRoutes(app) {
  app.use('/static', express.static(path.join(__dirname, '..', 'public')))

  app.get('*', (req, res) => {
    if (req.url.indexOf('/static') === 0) {
      res.status(404).send('File not found')
    } else {
      res.sendFile(path.join(__dirname, 'templates', 'layout.html'))
    }
  })

  return app
}
