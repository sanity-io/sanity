import express from 'express'
import * as path from 'path'
import capture from 'error-capture-middleware'
import serve from 'staticr/serve'
import bundles from './bundles'
import quickreload from 'quickreload'

const app = express()

app.use(quickreload({root: path.join(__dirname, '..')}))
app.use(serve(bundles))

app.use(capture.css())
app.use(capture.js())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/*', (req, res) => {
  res.status(200).send(`
    <html>
    <head>
      <meta httpequiv="Content-Type" content="text/html; charset=utf-8"/>
      <title>Testbed</title>
      <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, maximum-scale=1"/>
    </head>
    <body>
    <div id="main"/>
    <script src="/browser/bundle.js" async></script>
    </body>
    </html>
  `)
})

const server = app.listen(process.env.PORT || 3002, () => {
  const host = server.address().address
  const port = server.address().port
  console.log('Demo server listening at http://%s:%s', host, port) // eslint-disable-line no-console
})
