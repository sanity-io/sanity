import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
import got from 'got'
import open from 'opn'
import chalk from 'chalk'
import getUserConfig from '../../util/getUserConfig'

const baseUrl = 'https://api.sanity.io/v1'
const providersUrl = `${baseUrl}/auth/providers`
const exchangeUrl = `${baseUrl}/auth/tokens/fetch`

export default {
  name: 'auth',
  command: 'auth',
  describe: 'Authenticates against the Sanity.io API',
  handler: ({print, error, prompt, spinner}) => {
    const spin = spinner('Fetching providers...').start()

    return got(providersUrl, {json: true})
    .then(res => res.body.providers)
    .then(providers => promptProviders(prompt, providers))
    .then(provider => new Promise((resolve, reject) => {
      spin.stop()

      const server = http
        .createServer(onServerRequest)
        .listen(0, '127.0.0.1', onListen)

      function onListen() {
        const providerUrl = url.parse(provider.url, true)
        providerUrl.query.target = generateUrl('/return')
        providerUrl.query.type = 'token'

        const loginUrl = url.format(providerUrl)
        print(`Openening browser at ${loginUrl}`)
        open(loginUrl)
      }

      function onServerRequest(req, res) {
        if (req.url.indexOf('/return') === 0) {
          return exchangeToken(req, res)
        }

        res.writeHead(404, {'Content-Type': 'text/plain'})
        return res.end('File not found')
      }

      function exchangeToken(req, res) {
        const returnUrl = url.parse(req.url, true)
        const tmpToken = (returnUrl.query || {}).fetcher
        got(`${exchangeUrl}/${tmpToken}`, {json: true})
          .then(httpRes => onTokenExchanged(httpRes, res))
          .catch(onTokenExchangeError)
      }

      function onTokenExchanged({body}, res) {
        const token = body.token
        if (!token) {
          return onTokenExchangeError(new Error(
            'Failed to exchange temporary token - no token returned from server'
          ))
        }

        // Close the login page
        fs.createReadStream(path.join(__dirname, 'logoutPage.html')).pipe(res)

        // Store the token
        getUserConfig().set('authToken', token)

        print(chalk.green('Authentication successful'))
        server.close(() => resolve())
      }

      function onTokenExchangeError(err) {
        server.close(() => reject(err))
      }

      function generateUrl(urlPath) {
        return `http://localhost:${server.address().port}${urlPath}`
      }
    }))
  }
}

function promptProviders(prompt, providers) {
  if (providers.length === 1) {
    return providers[0]
  }

  return prompt([{
    type: 'list',
    message: 'Login type',
    name: 'provider',
    choices: providers.map(provider => provider.title)
  }]).then(answers => providers.find(
    prov => prov.title === answers.provider
  ))
}
