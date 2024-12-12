import http, {type Server} from 'node:http'
import os from 'node:os'

import {type SanityClient} from '@sanity/client'
import open from 'open'

import {debug as debugIt} from '../../debug'
import {
  type CliApiClient,
  type CliCommandArguments,
  type CliCommandContext,
  type CliPrompter,
} from '../../types'
import {canLaunchBrowser} from '../../util/canLaunchBrowser'
import {getCliToken} from '../../util/clientWrapper'
import {TELEMETRY_CONSENT_CONFIG_KEY} from '../../util/createTelemetryStore'
import {getUserConfig} from '../../util/getUserConfig'
import {LoginTrace} from './login.telemetry'
import {type LoginProvider, type ProvidersResponse, type SamlLoginProvider} from './types'

const callbackEndpoint = '/callback'

const debug = debugIt.extend('auth')
const callbackPorts = [4321, 4000, 3003, 1234, 8080, 13333]

const platformNames: Record<string, string | undefined> = {
  aix: 'AIX',
  android: 'Android',
  darwin: 'MacOS',
  freebsd: 'FreeBSD',
  linux: 'Linux',
  openbsd: 'OpenBSD',
  sunos: 'SunOS',
  win32: 'Windows',
}

export interface LoginFlags {
  experimental?: boolean
  open?: boolean
  provider?: string
  sso?: string
}

interface TokenDetails {
  token: string
  label: string
}

export async function login(
  args: CliCommandArguments<LoginFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {prompt, output, apiClient, telemetry} = context
  const {sso, experimental, open: openFlag, provider: specifiedProvider} = args.extOptions
  const previousToken = getCliToken()
  const hasExistingToken = Boolean(previousToken)

  const trace = telemetry.trace(LoginTrace)
  trace.start()

  // Explicitly tell this client not to use a token
  const client = apiClient({requireUser: false, requireProject: false})
    .clone()
    .config({token: undefined})

  // Get the desired authentication provider
  const provider = await getProvider({client, sso, experimental, output, prompt, specifiedProvider})

  trace.log({step: 'selectProvider', provider: provider?.name})

  if (provider === undefined) {
    throw new Error('No authentication providers found')
  }

  // Initiate local listen server for OAuth callback
  const apiHost = client.config().apiHost || 'https://api.sanity.io'
  const {server, token: tokenPromise} = await startServerForTokenCallback({apiHost, apiClient})
  trace.log({step: 'waitForToken'})

  const serverUrl = server.address()
  if (!serverUrl || typeof serverUrl === 'string') {
    // Note: `serverUrl` is string only when binding to unix sockets,
    // thus we can safely assume Something Is Wrong™ if it's a string
    throw new Error('Failed to start auth callback server')
  }

  // Build a login URL that redirects back back to OAuth flow on success
  const loginUrl = new URL(provider.url)
  const platformName = os.platform()
  const platform = platformName in platformNames ? platformNames[platformName] : platformName
  const hostname = os.hostname().replace(/\.(local|lan)$/g, '')

  loginUrl.searchParams.set('type', 'token')
  loginUrl.searchParams.set('label', `${hostname} / ${platform}`)
  loginUrl.searchParams.set('origin', `http://localhost:${serverUrl.port}${callbackEndpoint}`)

  // Open a browser on the login page (or tell the user to)
  const shouldLaunchBrowser = canLaunchBrowser() && openFlag !== false
  const actionText = shouldLaunchBrowser ? 'Opening browser at' : 'Please open a browser at'

  output.print(`\n${actionText} ${loginUrl.href}\n`)
  const spin = output
    .spinner('Waiting for browser login to complete... Press Ctrl + C to cancel')
    .start()

  if (shouldLaunchBrowser) {
    open(loginUrl.href)
  }

  // Wait for a success/error on the HTTP callback server
  let authToken: string
  try {
    authToken = (await tokenPromise).token
    spin.stop()
  } catch (err) {
    spin.stop()
    trace.error(err)
    err.message = `Login failed: ${err.message}`
    throw err
  } finally {
    server.close()
    server.unref()
  }

  // Store the token
  getUserConfig().set({
    authToken: authToken,
    authType: 'normal',
  })

  // Clear cached telemetry consent
  getUserConfig().delete(TELEMETRY_CONSENT_CONFIG_KEY)

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

  output.success('Login successful')
  trace.complete()
}

function startServerForTokenCallback(options: {
  apiHost: string
  apiClient: CliApiClient
}): Promise<{token: Promise<TokenDetails>; server: Server}> {
  const {apiHost, apiClient} = options
  const domain = apiHost.includes('.sanity.work') ? 'www.sanity.work' : 'www.sanity.io'

  const attemptPorts = callbackPorts.slice()
  let callbackPort = attemptPorts.shift()

  let resolveToken: (resolvedToken: TokenDetails | PromiseLike<TokenDetails>) => void
  let rejectToken: (reason: Error) => void
  const tokenPromise = new Promise<TokenDetails>((resolve, reject) => {
    resolveToken = resolve
    rejectToken = reject
  })

  return new Promise((resolve, reject) => {
    const server = http.createServer(async function onCallbackServerRequest(req, res) {
      function failLoginRequest(code = '') {
        res.writeHead(303, 'See Other', {
          Location: `https://${domain}/login/error${code ? `?error=${code}` : ''}`,
        })
        res.end()
        server.close()
      }

      const url = new URL(req.url || '/', `http://localhost:${callbackPort}`)
      if (url.pathname !== callbackEndpoint) {
        res.writeHead(404, 'Not Found', {'Content-Type': 'text/plain'})
        res.write('404 Not Found')
        res.end()
        return
      }

      const absoluteTokenUrl = url.searchParams.get('url')
      if (!absoluteTokenUrl) {
        failLoginRequest()
        return
      }

      const tokenUrl = new URL(absoluteTokenUrl)
      if (!tokenUrl.searchParams.has('sid')) {
        failLoginRequest('NO_SESSION_ID')
        return
      }

      let token: TokenDetails
      try {
        token = await apiClient({requireUser: false, requireProject: false})
          .clone()
          .request({uri: `/auth/fetch${tokenUrl.search}`})
      } catch (err) {
        failLoginRequest('UNRESOLVED_SESSION')
        rejectToken(err)
        return
      }

      res.writeHead(303, 'See Other', {Location: `https://${domain}/login/success`})
      res.end()
      server.close()
      resolveToken(token)
    })

    server.on('listening', function onCallbackListen() {
      // Once the server is successfully listening on a port, we can return the promise.
      // We'll then await the _token promise_, while the server is running in the background.
      resolve({token: tokenPromise, server})
    })

    server.on('error', function onCallbackServerError(err) {
      if ('code' in err && err.code === 'EADDRINUSE') {
        callbackPort = attemptPorts.shift()
        if (!callbackPort) {
          reject(new Error('Failed to find port number to bind auth callback server to'))
          return
        }

        debug('Port busy, trying %d', callbackPort)
        server.listen(callbackPort)
      } else {
        reject(err)
      }
    })

    debug('Starting callback server on port %d', callbackPort)
    server.listen(callbackPort)
  })
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
}): Promise<LoginProvider | undefined> {
  if (sso) {
    return getSSOProvider({client, prompt, slug: sso})
  }

  // Fetch and prompt for login provider to use
  const spin = output.spinner('Fetching providers...').start()
  let {providers} = await client.request<ProvidersResponse>({uri: '/auth/providers'})
  if (experimental) {
    providers = [...providers, {name: 'sso', title: 'SSO', url: '_not_used_'}]
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
  const providers = await client
    .withConfig({apiVersion: '2021-10-01'})
    .request<SamlLoginProvider[]>({
      uri: `/auth/organizations/by-slug/${slug}/providers`,
    })

  const enabledProviders = providers.filter((candidate) => !candidate.disabled)
  if (enabledProviders.length === 0) {
    return undefined
  }

  if (enabledProviders.length === 1) {
    return samlProviderToLoginProvider(enabledProviders[0])
  }

  const choice = await prompt.single({
    type: 'list',
    message: 'Select SSO provider',
    choices: enabledProviders.map((provider) => provider.name),
  })

  const foundProvider = enabledProviders.find((provider) => provider.name === choice)
  return foundProvider ? samlProviderToLoginProvider(foundProvider) : undefined
}

async function promptProviders(
  prompt: CliPrompter,
  providers: LoginProvider[],
): Promise<LoginProvider> {
  if (providers.length === 1) {
    return providers[0]
  }

  const provider = await prompt.single({
    type: 'list',
    message: 'Please log in or create a new account',
    choices: providers.map((choice) => choice.title),
  })

  return providers.find((prov) => prov.title === provider) || providers[0]
}

function samlProviderToLoginProvider(saml: SamlLoginProvider): LoginProvider {
  return {
    name: saml.name,
    title: saml.name,
    url: saml.loginUrl,
  }
}
