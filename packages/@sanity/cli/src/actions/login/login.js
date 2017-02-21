import fsp from 'fs-promise'
import path from 'path'
import http from 'http'
import url from 'url'
import open from 'opn'
import chalk from 'chalk'
import {parseJson} from '@sanity/util/lib/safeJson'
import debug from '../../debug'
import getUserConfig from '../../util/getUserConfig'

export default async function login(args, context) {
  const {prompt, output, apiClient} = context
  const client = apiClient({requireUser: false, requireProject: false})

  const spin = output.spinner('Fetching providers...').start()
  const {providers} = await client.request({uri: '/auth/providers'})
  spin.stop()

  const provider = await promptProviders(prompt, providers)

  return new Promise((resolve, reject) =>
    loginFlow({provider, ...context}, resolve, reject)
  )
}

function loginFlow({output, provider, apiClient}, resolve, reject) {
  debug('Starting OAuth receiver webserver')
  const client = apiClient({requireUser: false, requireProject: false})
  const spin = output.spinner('Waiting for login flow to complete...')
  const server = http
    .createServer(onServerRequest)
    .listen(0, '127.0.0.1', onListen)

  server.on('connection', socket => socket.unref())

  function onListen() {
    debug('Webserver listening, opening browser')

    const providerUrl = url.parse(provider.url, true)
    providerUrl.query.target = generateUrl('/return')
    providerUrl.query.type = 'token'

    const loginUrl = url.format(providerUrl)
    output.print(`\nOpening browser at ${loginUrl}\n`)
    spin.start()
    open(loginUrl)
  }

  function onServerRequest(req, res) {
    res.setTimeout(1500)
    req.connection.ref()

    if (req.url.indexOf('/return') === 0) {
      debug('Request received, exchanging token for a long-lived one')
      return exchangeToken(req, res)
    }

    res.writeHead(404, {'Content-Type': 'text/plain', 'Connection': 'close'})
    return res.end('File not found', () => {
      req.connection.unref()
    })
  }

  function exchangeToken(req, res) {
    const returnUrl = url.parse(req.url, true)
    const query = returnUrl.query || {}
    const tmpToken = query.fetcher
    const error = query.error ? parseJson(query.error, {}) : null

    if (error) {
      debug('Token exchange failed, error: %s', JSON.stringify(error))
      const err = new Error('OAuth exchange failed')
      return onTokenExchangeError(err, req, res)
    }

    if (!tmpToken) {
      debug(
        'Response did not contain temporary token. Query params: %s',
        JSON.stringify(returnUrl.query || {}, null, 2)
      )
      debug('URL: %s', req.url)
      return onTokenExchangeError(new Error('OAuth exchange failed because of a missing token', req, res))
    }

    return client.request({uri: `/auth/tokens/fetch/${tmpToken}`})
      .then(httpRes => onTokenExchanged(httpRes, req, res))
      .catch(err => onTokenExchangeError(err, req, res))
  }

  async function onTokenExchanged(body, req, res) {
    const token = body.token
    if (!token) {
      const query = url.parse(req.url, true).query || {}
      const error = query.error ? parseJson(query.error, {}) : null

      debug('Token exchange failed, body: %s', JSON.stringify(body))
      if (error) {
        debug('Error details: %s', JSON.stringify(error))
      }

      const err = new Error('Failed to exchange temporary token - no token returned from server')
      onTokenExchangeError(err, req, res)
      return
    }

    // Serve the "login successful"-page
    debug('Token exchange complete, serving page')
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Connection': 'close'})
    const successPage = await fsp.readFile(path.join(__dirname, 'loginResponse.html'), 'utf8')
    res.end(successPage, () => {
      req.connection.unref()

      server.close(() => {
        debug('Server closed')
        resolve()
      })
    })

    // Store the token
    debug('Storing the login token')
    getUserConfig().set({
      authToken: token,
      authType: 'normal'
    })

    spin.stop()
    output.print(chalk.green('Login successful'))
  }

  async function onTokenExchangeError(err, req, res) {
    res.writeHead(500, {'Content-Type': 'text/html; charset=utf-8', 'Connection': 'close'})
    const errorPage = await fsp.readFile(path.join(__dirname, 'loginError.html'), 'utf8')

    res.end(errorPage.replace(/%error%/g, err.message), 'utf8', () => {
      debug('Error page served')
      req.connection.unref()

      server.close(() => {
        debug('Server closed')
        reject(err)
      })
    })

    spin.stop()
  }

  function generateUrl(urlPath) {
    return `http://localhost:${server.address().port}${urlPath}`
  }
}

function promptProviders(prompt, providers) {
  if (providers.length === 1) {
    return providers[0]
  }

  return prompt.single({
    type: 'list',
    message: 'Login type',
    choices: providers.map(provider => provider.title)
  }).then(provider => providers.find(prov => prov.title === provider))
}
