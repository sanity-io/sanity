import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Notes
  Changing the hostname or port number might require a new CORS-entry to be added.

Options
  --port <port> TCP port to start server on. [default: 3333]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity start --host=0.0.0.0
  sanity start --port=1942
`

export default {
  name: 'start',
  signature: '[--port <port>] [--host <host>]',
  description: 'Starts a web server for the Content Studio',
  action: lazyRequire(require.resolve('../../actions/start/startAction')),
  helpText,
}
