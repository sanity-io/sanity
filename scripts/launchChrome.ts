/**
 * Launches Chrome with its remote debugging (Chrome DevTools Protocol) port open and loads a
 * studio in it, so `chrome-devtools-mcp` can attach with `--browserUrl=http://127.0.0.1:<port>`
 * and expose the React DevTools tools registered by `react-devtools-cdt-mcp`
 * (`ENABLE_REACT_DEVTOOLS_MCP=true`, see dev/test-studio/sanity.cli.ts).
 *
 * Usage: `pnpm react-devtools-mcp:chrome [url] [--headless] [--port=9222] [-- <extra chrome args>]`
 *
 * - `url` defaults to the test studio's `/test` workspace. When `STUDIO_AUTH_TOKEN` is set and
 *   the url has no hash, the studio is opened with `#token=<token>` so it signs in on load (the
 *   studio consumes the token and strips it from the address bar). The token never appears in
 *   Chrome's argv or in this script's output: Chrome is started on a one-time redirect served
 *   from an ephemeral loopback server, which forwards it to the tokenized url.
 * - `CHROME_PATH` overrides the Chrome executable that is used.
 * - The profile lives in `node_modules/.cache/react-devtools-mcp/chrome-profile` and is reused
 *   across runs. Chrome stays open after this script exits; stop it with `kill <pid>`.
 */
import {spawn} from 'node:child_process'
import {randomBytes} from 'node:crypto'
import {once} from 'node:events'
import {accessSync, constants, mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import path from 'node:path'
import process from 'node:process'
import {setTimeout as sleep} from 'node:timers/promises'
import {parseArgs} from 'node:util'

const DEFAULT_URL = 'http://localhost:3333/test'
const DEFAULT_PORT = 9222
const STARTUP_TIMEOUT_MS = 30_000
const REPO_ROOT = path.resolve(import.meta.dirname, '..')

interface Options {
  url: string
  port: number
  headless: boolean
  chromeArgs: string[]
}

function parsePort(value: string): number {
  const port = /^\d+$/.test(value) ? Number(value) : Number.NaN
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid --port "${value}": expected an integer between 1 and 65535`)
  }
  return port
}

function parseOptions(argv: string[]): Options {
  const passthroughIndex = argv.indexOf('--')
  const ownArgs = passthroughIndex === -1 ? argv : argv.slice(0, passthroughIndex)
  const chromeArgs = passthroughIndex === -1 ? [] : argv.slice(passthroughIndex + 1)

  const {values, positionals} = parseArgs({
    args: ownArgs,
    allowPositionals: true,
    options: {
      headless: {type: 'boolean', default: false},
      port: {type: 'string', default: String(DEFAULT_PORT)},
    },
  })

  if (positionals.length > 1) {
    throw new Error(`Expected at most one url argument, got ${positionals.length}`)
  }

  return {
    url: positionals[0] ?? DEFAULT_URL,
    port: parsePort(values.port),
    headless: values.headless,
    chromeArgs,
  }
}

function isExecutable(file: string): boolean {
  try {
    accessSync(file, constants.X_OK)
    return true
  } catch {
    return false
  }
}

function findChrome(): string {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH
  }

  let candidates: string[]
  if (process.platform === 'darwin') {
    candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ]
  } else if (process.platform === 'win32') {
    candidates = [
      process.env['PROGRAMFILES'],
      process.env['PROGRAMFILES(X86)'],
      process.env['LOCALAPPDATA'],
    ]
      .filter((dir): dir is string => Boolean(dir))
      .map((dir) => path.join(dir, 'Google', 'Chrome', 'Application', 'chrome.exe'))
  } else {
    const names = [
      'google-chrome',
      'google-chrome-stable',
      'chromium',
      'chromium-browser',
      'chrome',
    ]
    const dirs = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean)
    candidates = names.flatMap((name) => dirs.map((dir) => path.join(dir, name)))
  }

  const chrome = candidates.find(isExecutable)
  if (!chrome) {
    throw new Error(
      'Could not find a Chrome executable. Install Google Chrome or set CHROME_PATH to the binary.',
    )
  }
  return chrome
}

/** Reads the `Browser` field of Chrome's `/json/version` response. */
function getBrowserName(versionInfo: unknown): string {
  if (
    typeof versionInfo === 'object' &&
    versionInfo !== null &&
    'Browser' in versionInfo &&
    typeof versionInfo.Browser === 'string'
  ) {
    return versionInfo.Browser
  }
  return 'Chrome'
}

/** The browser name when a DevTools endpoint answers on `port`, `null` otherwise. */
async function probeDevTools(port: number): Promise<string | null> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`)
    return response.ok ? getBrowserName(await response.json()) : null
  } catch {
    return null
  }
}

// oxlint-disable no-await-in-loop -- sequential polling of Chrome's debugging endpoint is intentional
async function waitForDevTools(port: number, chromeExited: () => boolean): Promise<string> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    const browserName = await probeDevTools(port)
    if (browserName !== null) {
      return browserName
    }
    if (chromeExited()) {
      throw new Error(
        'Chrome exited before opening its debugging port. A Chrome using the react-devtools-mcp ' +
          'profile is probably already running without one; close it and retry.',
      )
    }
    await sleep(250)
  }
  throw new Error(
    `Chrome did not open http://127.0.0.1:${port} within ${STARTUP_TIMEOUT_MS / 1000}s`,
  )
}
// oxlint-enable no-await-in-loop

interface Redirect {
  /** Loopback url for Chrome to open; it carries no part of the target url. */
  url: string
  /** Resolves once Chrome has fetched the redirect. */
  served: Promise<void>
  close: () => void
}

/**
 * Serves a one-time `302` to the target url from an ephemeral loopback server. Chrome opens the
 * loopback url instead of the target itself, which keeps `#token=` out of Chrome's command line
 * (readable through `ps` and `/proc/<pid>/cmdline` for the browser's lifetime) and out of the
 * `/json/new` request that the reuse path sends to the running browser.
 */
async function startRedirect(targetUrl: string): Promise<Redirect> {
  const secretPath = `/${randomBytes(16).toString('hex')}`
  const server = createServer()
  const served = new Promise<void>((resolve) => {
    server.on('request', (request, response) => {
      if (request.method !== 'GET' || request.url !== secretPath) {
        response.writeHead(404, {Connection: 'close'}).end()
        return
      }
      response
        .writeHead(302, {'Location': targetUrl, 'Cache-Control': 'no-store', 'Connection': 'close'})
        .end()
      resolve()
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  // Never keep the process alive on this server's account
  server.unref()

  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('Could not start the loopback redirect')
  }
  return {
    url: `http://127.0.0.1:${address.port}${secretPath}`,
    served,
    close: () => {
      server.close()
      server.closeAllConnections()
    },
  }
}

interface Launched {
  browserName: string
  /** Undefined when the url was opened in a browser that was already running. */
  pid?: number
}

/** Opens `url` in a new tab of the browser already serving `browserUrl`. */
async function openInRunningBrowser(
  browserUrl: string,
  browserName: string,
  url: string,
): Promise<Launched> {
  // Chrome reads the url from the raw query string and unescapes it, so encoding keeps `&`,
  // `?` and `#` inside `url` intact
  const response = await fetch(`${browserUrl}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  })
  if (!response.ok) {
    throw new Error(
      `The browser listening on ${browserUrl} refused to open a new tab (HTTP ${response.status})`,
    )
  }
  return {browserName}
}

/** Starts Chrome on `url` and resolves once its debugging port answers. */
async function launchChrome(chrome: string, options: Options, url: string): Promise<Launched> {
  const userDataDir = path.join(
    REPO_ROOT,
    'node_modules',
    '.cache',
    'react-devtools-mcp',
    'chrome-profile',
  )
  mkdirSync(userDataDir, {recursive: true})

  const args = [
    `--remote-debugging-port=${options.port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    ...(options.headless ? ['--headless=new'] : []),
    // Chrome refuses to run its sandbox as root (containers, some CI runners)
    ...(process.platform === 'linux' && process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    ...options.chromeArgs,
    url,
  ]

  const child = spawn(chrome, args, {detached: true, stdio: 'ignore'})
  child.unref()
  let chromeExited = false
  child.once('exit', () => {
    chromeExited = true
  })

  const browserName = await waitForDevTools(options.port, () => chromeExited)
  return {browserName, pid: child.pid}
}

async function waitForRedirect(redirect: Redirect): Promise<void> {
  // Exiting before Chrome has fetched the redirect would leave it on a dead loopback url
  const abortTimeout = new AbortController()
  const timeout = sleep(STARTUP_TIMEOUT_MS, undefined, {signal: abortTimeout.signal}).then(() => {
    throw new Error(`Chrome did not open the url within ${STARTUP_TIMEOUT_MS / 1000}s`)
  })
  try {
    await Promise.race([redirect.served, timeout])
  } finally {
    abortTimeout.abort()
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  const chrome = findChrome()
  const hasDisplay = Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY)
  options.headless ||= process.platform === 'linux' && !hasDisplay
  const browserUrl = `http://127.0.0.1:${options.port}`

  const token = process.env.STUDIO_AUTH_TOKEN
  const signIn = token !== undefined && token !== '' && !options.url.includes('#')
  const targetUrl = signIn ? `${options.url}#token=${encodeURIComponent(token)}` : options.url
  const redirect = await startRedirect(targetUrl)

  try {
    // A browser already serving the port gets the url as a new tab; a second Chrome on the
    // same profile would only hand the url over to it (headed) or exit without opening it
    // (headless), and its short-lived pid would be meaningless to report.
    const runningBrowser = await probeDevTools(options.port)
    const {browserName, pid} =
      runningBrowser === null
        ? await launchChrome(chrome, options, redirect.url)
        : await openInRunningBrowser(browserUrl, runningBrowser, redirect.url)
    await waitForRedirect(redirect)

    console.log(
      `${browserName} is listening on ${browserUrl}${options.headless ? ' (headless)' : ''}`,
    )
    console.log(`Opened ${options.url}${signIn ? ' (signed in with STUDIO_AUTH_TOKEN)' : ''}`)
    console.log(
      pid === undefined
        ? `Reused the browser that was already listening on ${browserUrl}`
        : `Chrome pid: ${pid}`,
    )
    console.log('')
    console.log('Attach chrome-devtools-mcp to it with:')
    console.log(
      `  pnpm --filter sanity-test-studio exec chrome-devtools start --categoryExperimentalThirdParty=true --browserUrl=${browserUrl}`,
    )
  } finally {
    redirect.close()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
