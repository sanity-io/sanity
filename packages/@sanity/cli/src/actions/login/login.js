import os from 'os'
import urlParser from 'url'
import open from 'opn'
import chalk from 'chalk'
import crypto from 'crypto'
import EventSource from 'eventsource'
import {parseJson} from '@sanity/util/lib/safeJson'
import getUserConfig from '../../util/getUserConfig'
import canLaunchBrowser from '../../util/canLaunchBrowser'

export default async function login(args, context) {
  const {prompt, output, apiClient} = context
  const client = apiClient({requireUser: false, requireProject: false})

  // Fetch and prompt for login provider to use
  let spin = output.spinner('Fetching providers...').start()
  const {providers} = await client.request({uri: '/auth/providers'})
  spin.stop()
  const provider = await promptProviders(prompt, providers)

  // Open an authentication listener channel and wait for secret
  const iv = crypto.randomBytes(8).toString('hex')
  const es = getAuthChannel(client.config().apiHost, provider, iv)
  const encryptedToken = getAuthToken(es) // This is a promise, will resolve later
  const {secret, url} = await getAuthInfo(es)

  // Open a browser on the login page (or tell the user to)
  const providerUrl = urlParser.parse(url, true)
  providerUrl.query.label = `${os.hostname()} / ${os.platform()}`
  const loginUrl = urlParser.format(providerUrl)

  const shouldLaunchBrowser = canLaunchBrowser()
  const actionText = shouldLaunchBrowser ? 'Opening browser at' : 'Please open a browser at'

  output.print(`\n${actionText} ${loginUrl}\n`)
  spin = output.spinner('Waiting for browser login to complete... Press Ctrl + C to cancel').start()
  open(loginUrl, {wait: false})

  // Wait for a success/error on the listener channel
  let token
  try {
    token = await encryptedToken
    spin.stop()
  } catch (err) {
    spin.stop()
    err.message = `Login failed: ${err.message}`
    throw err
  }

  // Decrypt the token with the secret we received earlier
  const authToken = decryptToken(token, secret, iv)

  // Store the token
  getUserConfig().set({
    authToken: authToken,
    authType: 'normal',
  })

  output.print(chalk.green('Login successful'))
}

function getAuthChannel(baseUrl, provider, iv) {
  const uuid = crypto.randomBytes(16).toString('hex')
  const listenUrl = `${baseUrl}/v1/auth/listen/${provider.name}/${uuid}?iv=${iv}`
  return new EventSource(listenUrl)
}

function getAuthInfo(es) {
  const wantedProps = ['secret', 'url']
  const values = {}
  return new Promise((resolve) => {
    let numProps = 0
    es.addEventListener('message', (msg) => {
      const data = parseJson(msg.data, {})
      if (!wantedProps.includes(data.type)) {
        return
      }

      values[data.type] = data[data.type]
      if (++numProps === wantedProps.length) {
        resolve(values)
      }
    })
  })
}

function getAuthToken(es) {
  return new Promise((resolve, reject) => {
    es.addEventListener('success', (msg) => {
      es.close()
      const data = parseJson(msg.data, {})
      resolve(data.token)
    })

    es.addEventListener('failure', (msg) => {
      es.close()
      const data = parseJson(msg.data, {})
      const error = new Error(data.message)
      Object.keys(data).forEach((key) => {
        error[key] = data[key]
      })
      reject(error)
    })
  })
}

function decryptToken(token, secret, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', secret, iv)
  const dec = decipher.update(token, 'hex', 'utf8')
  return `${dec}${decipher.final('utf8')}`
}

function promptProviders(prompt, providers) {
  if (providers.length === 1) {
    return providers[0]
  }

  return prompt
    .single({
      type: 'list',
      message: 'Login type',
      choices: providers.map((provider) => provider.title),
    })
    .then((provider) => providers.find((prov) => prov.title === provider))
}
