import path from 'path'
import {getProdServer, getDevServer} from '@sanity/server'
import isProduction from '../../util/isProduction'
import getConfig from '../../util/getConfig'
import thenify from 'thenify'

export default {
  name: 'start',
  signature: 'start',
  description: 'Starts a webserver that serves Sanity',
  action: ({print, options}) => {
    const config = getConfig(options.cwd).get('server')
    const getServer = isProduction ? getProdServer : getDevServer
    const server = getServer({
      staticPath: resolveStaticPath(options.cwd, config)
    })

    const {port, hostname} = config
    return thenify(server.listen.bind(server))(port, hostname)
      .then(() => print(`Server listening on ${hostname}:${port}`))
      .catch(getGracefulDeathHandler(config))
  }
}

function resolveStaticPath(cwd, config) {
  const {staticPath} = config
  return path.isAbsolute(staticPath)
    ? staticPath
    : path.resolve(path.join(cwd, staticPath))
}

function getGracefulDeathHandler(config) {
  return function gracefulDeath(err) {
    if (err.code === 'EADDRINUSE') {
      throw new Error('Port number for Sanity server is already in use, configure `server.port` in `sanity.json`')
    }

    if (err.code === 'EACCES') {
      const help = config.port < 1024
        ? 'port numbers below 1024 requires root privileges'
        : `do you have access to listen to the given hostname (${config.hostname})?`

      throw new Error(`Sanity server does not have access to listen to given port - ${help}`)
    }

    throw err
  }
}
