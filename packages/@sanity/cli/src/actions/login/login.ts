import os from 'os'
import crypto from 'crypto'
import open from 'open'
import chalk from 'chalk'
import EventSource from 'eventsource'
import type {SanityClient} from '@sanity/client'
import {getCliToken} from '../../util/clientWrapper'
import {getUserConfig} from '../../util/getUserConfig'
import {canLaunchBrowser} from '../../util/canLaunchBrowser'
import {CliCommandArguments, CliCommandContext, CliPrompter} from '../../types'
import type {
  EventWithMessage,
  ListenFailureMessage,
  ListenMessageData,
  ListenToken,
  LoginProvider,
  ProvidersResponse,
} from './types'

export interface LoginFlags {
  experimental?: boolean
  open?: boolean
  provider?: string
  sso?: string
}

export async function login(
  args: CliCommandArguments<LoginFlags>,
  context: CliCommandContext
): Promise<void> {
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
  const apiHost = client.config().apiHost || 'https://api.sanity.io'
  const iv = crypto.randomBytes(8).toString('hex')
  const es = getAuthChannel(apiHost, provider, iv)
  const encryptedToken = getAuthToken(es) // This is a promise, will resolve later
  const {secret, url} = await getAuthInfo(es)

  // Open a browser on the login page (or tell the user to)
  const providerUrl = new URL(url)
  providerUrl.searchParams.set('label', `${os.hostname()} / ${os.platform()}`)
  const loginUrl = providerUrl.href

  const shouldLaunchBrowser = canLaunchBrowser() && openFlag !== false
  const actionText = shouldLaunchBrowser ? 'Opening browser at' : 'Please open a browser at'

  output.print(`\n${actionText} ${loginUrl}\n`)
  const spin = output
    .spinner('Waiting for browser login to complete... Press Ctrl + C to cancel')
    .start()

  if (shouldLaunchBrowser) {
    open(loginUrl)
  }

  // Wait for a success/error on the listener channel
  let token: string
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

function getAuthChannel(baseUrl: string, provider: LoginProvider, iv: string): EventSource {
  const uuid = crypto.randomBytes(16).toString('hex')
  let listenUrl
  if (provider.type === 'saml') {
    listenUrl = `${baseUrl}/v2021-10-01/auth/saml/listen/${provider.id}/${uuid}?iv=${iv}`
  } else {
    listenUrl = `${baseUrl}/v1/auth/listen/${provider.name}/${uuid}?iv=${iv}`
  }
  return new EventSource(listenUrl)
}

function getAuthInfo(es: EventSource): Promise<{secret: string; url: string}> {
  const values = {secret: '', url: ''}
  return new Promise((resolve, reject) => {
    es.addEventListener('error', (err: MessageEvent | EventWithMessage) => {
      es.close()
      const message = 'message' in err && typeof err.message === 'string' ? err.message : ''
      reject(new Error(`Unable to get authorization info: ${message}`))
    })

    es.addEventListener('message', (msg) => {
      const data = parseJson<ListenMessageData | null>(msg.data, null)
      if (!data || !('type' in data)) {
        return
      }

      if (data.type === 'secret') {
        values.secret = data.secret
      } else if (data.type === 'url') {
        values.url = data.url
      } else {
        return
      }

      if (values.secret && values.url) {
        resolve(values)
      }
    })
  })
}

function getAuthToken(es: EventSource): Promise<string> {
  return new Promise((resolve, reject) => {
    es.addEventListener('success', (msg) => {
      es.close()
      const data = parseJson<ListenToken | null>(msg.data, null)
      if (!data || !data.token) {
        reject(new Error('Failed to get token from `success`-message'))
        return
      }

      resolve(data.token)
    })

    es.addEventListener('failure', (msg) => {
      es.close()

      const data = parseJson<ListenFailureMessage>(msg.data, {
        type: 'error',
        message: 'Unknown error',
      })

      reject(new Error(data.message))
    })
  })
}

function decryptToken(token: string, secret: string, iv: string) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', secret, iv)
  const dec = decipher.update(token, 'hex', 'utf8')
  return `${dec}${decipher.final('utf8')}`
}

async function getProvider({
  output,
  client,
  sso,
  experimental,
  prompt,
  specifiedProvider,
}: {
  output: CliCommandContext['output']
  client: SanityClient
  sso?: string
  experimental?: boolean
  prompt: CliPrompter
  specifiedProvider?: string
}) {
  if (sso) {
    return getSSOProvider({client, prompt, slug: sso})
  }

  // Fetch and prompt for login provider to use
  const spin = output.spinner('Fetching providers...').start()
  let {providers} = await client.request<ProvidersResponse>({uri: '/auth/providers'})
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

async function getSSOProvider({
  client,
  prompt,
  slug,
}: {
  client: SanityClient
  prompt: CliPrompter
  slug: string
}): Promise<LoginProvider | undefined> {
  const providers = await client.withConfig({apiVersion: '2021-10-01'}).request<LoginProvider[]>({
    uri: `/auth/organizations/by-slug/${slug}/providers`,
  })

  const enabledProviders = providers.filter((candidate) => !candidate.disabled)
  if (enabledProviders.length === 0) {
    return undefined
  }

  if (enabledProviders.length === 1) {
    return enabledProviders[0]
  }

  const choice = await prompt.single({
    type: 'list',
    message: 'Select SSO provider',
    choices: enabledProviders.map((provider) => provider.name),
  })

  return enabledProviders.find((provider) => provider.name === choice)
}

async function promptProviders(
  prompt: CliPrompter,
  providers: LoginProvider[]
): Promise<LoginProvider> {
  if (providers.length === 1) {
    return providers[0]
  }

  const provider = await prompt.single({
    type: 'list',
    message: 'Login type',
    choices: providers.map((choice) => choice.title),
  })

  return providers.find((prov) => prov.title === provider) || providers[0]
}

function parseJson<T = any>(json: string, defaultVal: T): T {
  try {
    return JSON.parse(json)
  } catch (err) {
    return defaultVal
  }
}
