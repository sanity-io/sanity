
import app from './app'

const server = app.listen(process.env.PORT || 3002, () => {
  const host = server.address().address
  const port = server.address().port
  console.log('Demo server listening at http://%s:%s', host, port) // eslint-disable-line no-console
})
