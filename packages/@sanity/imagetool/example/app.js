const express = require('express')
const path = require('path')
const fs = require('fs')
const serve = require('staticr/serve')
const capture = require('error-capture-middleware')

const app = express()

app.use(require('quickreload')())
app.use(serve(require('./static-routes/browserify')))
app.use(serve(require('./static-routes/css')))
app.use(capture.css())
app.use(capture.js())

app.use(express.static(path.join(__dirname, 'public')))
app.use('/*', (req, res) => {
  res.type('text/html').send(fs.readFileSync(path.join(__dirname, 'public', 'index.html')))
})

const server = app.listen(3000, () => {
  const host = server.address().address
  const port = server.address().port
  console.log('Demo server listening at http://%s:%s', host, port) // eslint-disable-line no-console
})
