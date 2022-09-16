import os from 'os'
import urlParser from 'url'
import crypto from 'crypto'
import open from 'opn'
import chalk from 'chalk'
import EventSource from 'eventsource'
import {parseJson} from '@sanity/util/lib/safeJson'
import getUserConfig from '../../util/getUserConfig'
import canLaunchBrowser from '../../util/canLaunchBrowser'
import {getCliToken} from '../../util/clientWrapper'

export default async function login(args, context) {
  const {prompt, output, apiClient} = context
  const {sso, experimental, open: openFlag, provider: specifiedProvider} = args.extOptions
  const previousToken = getCliToken()
  const hasExistingToken = Boolean(previousToken)

  // Explicitly tell this client not to use a token
  const client = apiClient({requireUser: false, requireProject: false})
    .clone()
    .config({token: undefined})

  // Get the desired authentication provider
  const provider = await getProvider({client, sso, experimental, output, prompt, specifiedProvider})
  if (provider === undefined) {
    output.print(chalk.red('No authentication providers found'))
    return
  }

  // Open an authentication listener channel and wait for secret
  const iv = crypto.randomBytes(8).toString('hex')
  const es = getAuthChannel(client.config().apiHost, provider, iv)
  const encryptedToken = getAuthToken(es) // This is a promise, will resolve later
  const {secret, url} = await getAuthInfo(es)

  // Open a browser on the login page (or tell the user to)
  const providerUrl = urlParser.parse(url, true)
  providerUrl.query.label = `${os.hostname()} / ${os.platform()}`
  const loginUrl = urlParser.format(providerUrl)

  const shouldLaunchBrowser = canLaunchBrowser() && openFlag !== false
  const actionText = shouldLaunchBrowser ? 'Opening browser at' : 'Please open a browser at'

  output.print(`\n${actionText} ${loginUrl}\n`)
  const spin = output
    .spinner('Waiting for browser login to complete... Press Ctrl + C to cancel')
    .start()

  if (shouldLaunchBrowser) {
    open(loginUrl, {wait: false})
  }

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

  // If we had a session previously, attempt to clear it
  if (hasExistingToken) {
    await apiClient({requireUser: true, requireProject: false})
      .clone()
      .config({token: previousToken})
      .request({uri: '/auth/logout', method: 'POST'})
      .catch((err) => {
        const statusCode = err && err.response && err.response.statusCode
        if (statusCode !== 401) {
          output.warn('[warn] Failed to log out existing session')
        }
      })
  }

  output.print(chalk.green('Login successful'))
}

function getAuthChannel(baseUrl, provider, iv) {
  const uuid = crypto.randomBytes(16).toString('hex')
  let listenUrl
  if (provider.type === 'saml') {
    listenUrl = `${baseUrl}/v2021-10-01/auth/saml/listen/${provider.id}/${uuid}?iv=${iv}`
  } else {
    listenUrl = `${baseUrl}/v1/auth/listen/${provider.name}/${uuid}?iv=${iv}`
  }
  return new EventSource(listenUrl)
}

function getAuthInfo(es) {
  const wantedProps = ['secret', 'url']
  const values = {}
  return new Promise((resolve, reject) => {
    let numProps = 0
    es.addEventListener('error', (err) => {
      es.close()
      reject(new Error(`Unable to get authorization info: ${err.message}`))
    })

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

async function getProvider({output, client, sso, experimental, prompt, specifiedProvider}) {
  if (sso) {
    return getSSOProvider({client, prompt, slug: sso})
  }

  // Fetch and prompt for login provider to use
  const spin = output.spinner('Fetching providers...').start()
  let {providers} = await client.request({uri: '/auth/providers'})
  if (experimental) {
    providers = [...providers, {name: 'sso', title: 'SSO'}]
  }
  spin.stop()

  const providerNames = providers.map((prov) => prov.name)

  if (specifiedProvider && providerNames.includes(specifiedProvider)) {
    const provider = providers.find((prov) => prov.name === specifiedProvider)

    if (!provider) {
      throw new Error(`Cannot find login provider with name "${specifiedProvider}"`)
    }

    return provider
  }

  const provider = await promptProviders(prompt, providers)
  if (provider.name === 'sso') {
    const slug = await prompt.single({
      type: 'input',
      message: 'Organization slug:',
    })
    return getSSOProvider({client, prompt, slug})
  }

  return provider
}

async function getSSOProvider({client, prompt, slug}) {
  const providers = await client.withConfig({apiVersion: '2021-10-01'}).request({
    uri: `/auth/organizations/by-slug/${slug}/providers`,
  })

  const enabledProviders = providers.filter((provider) => !provider.disabled)
  if (enabledProviders.length === 0) {
    return undefined
  } else if (enabledProviders.length === 1) {
    return enabledProviders[0]
  }

  const choice = await prompt.single({
    type: 'list',
    message: 'Select SSO provider',
    choices: enabledProviders.map((provider) => provider.name),
  })

  return enabledProviders.find((provider) => provider.name === choice)
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
