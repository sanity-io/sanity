import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
import got from 'got'
import open from 'opn'
import chalk from 'chalk'
import debug from '../../debug'
import getUserConfig from '../../util/getUserConfig'

const baseUrl = 'https://api.sanity.io/v1'
const providersUrl = `${baseUrl}/auth/providers`
const exchangeUrl = `${baseUrl}/auth/tokens/fetch`

export default async function login(args, context) {
  const {prompt, output} = context
  const spin = output.spinner('Fetching providers...').start()
  const {body} = await got(providersUrl, {json: true})
  const providers = body.providers
  spin.stop()

  const provider = await promptProviders(prompt, providers)

  return new Promise((resolve, reject) =>
    loginFlow({provider, ...context}, resolve, reject)
  )
}

function loginFlow({output, provider}, resolve, reject) {
  debug('Starting OAuth receiver webserver')
  const spin = output.spinner('Waiting for login flow to complete...')
  const server = http
    .createServer(onServerRequest)
    .listen(0, '127.0.0.1', onListen)

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
    if (req.url.indexOf('/return') === 0) {
      debug('Request received, exchanging token for a long-lived one')
      return exchangeToken(req, res)
    }

    res.writeHead(404, {'Content-Type': 'text/plain', 'Connection': 'close'})
    return res.end('File not found')
  }

  function exchangeToken(req, res) {
    const returnUrl = url.parse(req.url, true)
    const tmpToken = (returnUrl.query || {}).fetcher
    got(`${exchangeUrl}/${tmpToken}`, {json: true})
      .then(httpRes => onTokenExchanged(httpRes, req, res))
      .catch(err => onTokenExchangeError(err, res))
  }

  function onTokenExchanged(httpRes, req, res) {
    const token = httpRes.body.token
    if (!token) {
      const query = url.parse(req.url, true).query || {}
      const error = query.error ? safeJson(query.error, {}) : {}

      debug('Token exchange failed, body: %s', JSON.stringify(httpRes.body))
      if (error) {
        debug('Error details: %s', JSON.stringify(error))
      }

      const err = new Error('Failed to exchange temporary token - no token returned from server')
      return onTokenExchangeError(err, res)
    }

    // Serve the "login successful"-page
    debug('Token exchange complete, serving page')
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Connection': 'close'})
    fs.createReadStream(path.join(__dirname, 'loginResponse.html')).pipe(res)

    // Store the token
    debug('Storing the login token')
    getUserConfig().set({
      authToken: token,
      authType: 'normal'
    })

    spin.stop()
    output.print(chalk.green('Login successful'))
    server.close(() => debug('Server closed'))
    return resolve()
  }

  function onTokenExchangeError(err, res) {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Connection': 'close'})
    fs.createReadStream(path.join(__dirname, 'loginError.html'))
      .pipe(res)
      .on('finish', () => server.close(() => debug('Server closed')))

    spin.stop()
    reject(err)
  }

  function generateUrl(urlPath) {
    return `http://localhost:${server.address().port}${urlPath}`
  }
}

function safeJson(str, defaultVal) {
  try {
    return JSON.parse(str)
  } catch (err) {
    return defaultVal
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
