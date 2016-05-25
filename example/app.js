import browserifyBundles from './browserify-bundles'
import capture from 'error-capture-middleware'
import devErrorHandler from 'dev-error-handler'
import express from 'express'
import Layout from './components/Layout'
import path from 'path'
import quickreload from 'quickreload'
import React from 'react'
import ReactDOM from 'react-dom/server'
import serve from 'staticr/serve'

const app = express()

app.use(quickreload({root: '../'}))

app.use(serve([
  browserifyBundles
]))

app.use(capture.css())
app.use(capture.js())

app.use(express.static(path.join(__dirname, 'public')))

app.get('/*', (req, res) => {
  res.status(200).send(
    `<!doctype html>${ReactDOM.renderToStaticMarkup(React.createElement(Layout))}`
  )
})

app.use(devErrorHandler)

export default app
