/**
 * Launches Chrome with its remote debugging (Chrome DevTools Protocol) port open and loads a
 * studio in it, so `chrome-devtools-mcp` can attach with `--browserUrl=http://127.0.0.1:<port>`
 * and expose the React DevTools tools registered by `react-devtools-cdt-mcp`
 * (`ENABLE_REACT_DEVTOOLS_MCP=true`, see dev/test-studio/sanity.cli.ts).
 *
 * Usage: `pnpm react-devtools-mcp:chrome [url] [--headless] [--port=9222] [-- <extra chrome args>]`
 *
 * - `url` defaults to the test studio's `/test` workspace. When `STUDIO_AUTH_TOKEN` is set and
 *   the url has no hash, `#token=<token>` is appended so the studio signs in on load (the studio
 *   consumes it and strips it from the address bar). The token is never printed.
 * - `CHROME_PATH` overrides the Chrome executable that is used.
 * - The profile lives in `node_modules/.cache/react-devtools-mcp/chrome-profile` and is reused
 *   across runs. Chrome stays open after this script exits; stop it with `kill <pid>`.
 */
import {spawn} from 'node:child_process'
import {accessSync, constants, mkdirSync} from 'node:fs'
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

  const port = Number(values.port)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid --port value "${values.port}"`)
  }
  if (positionals.length > 1) {
    throw new Error(`Expected at most one url argument, got ${positionals.length}`)
  }

  return {url: positionals[0] ?? DEFAULT_URL, port, headless: values.headless, chromeArgs}
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

// oxlint-disable no-await-in-loop -- sequential polling of Chrome's debugging endpoint is intentional
async function waitForDevTools(port: number): Promise<string> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  let lastError = 'no response yet'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) {
        return getBrowserName(await response.json())
      }
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await sleep(250)
  }
  throw new Error(
    `Chrome did not open http://127.0.0.1:${port} within ${STARTUP_TIMEOUT_MS / 1000}s (${lastError})`,
  )
}
// oxlint-enable no-await-in-loop

/** Appends `#token=<STUDIO_AUTH_TOKEN>` so the studio signs in on load. */
function withAuthToken(url: string): {url: string; usedToken: boolean} {
  const token = process.env.STUDIO_AUTH_TOKEN
  if (!token || url.includes('#')) {
    return {url, usedToken: false}
  }
  return {url: `${url}#token=${encodeURIComponent(token)}`, usedToken: true}
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  const chrome = findChrome()
  const userDataDir = path.join(
    REPO_ROOT,
    'node_modules',
    '.cache',
    'react-devtools-mcp',
    'chrome-profile',
  )
  mkdirSync(userDataDir, {recursive: true})

  const hasDisplay = Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY)
  const headless = options.headless || (process.platform === 'linux' && !hasDisplay)
  const {url, usedToken} = withAuthToken(options.url)

  const args = [
    `--remote-debugging-port=${options.port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    ...(headless ? ['--headless=new'] : []),
    // Chrome refuses to run its sandbox as root (containers, some CI runners)
    ...(process.platform === 'linux' && process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    ...options.chromeArgs,
    url,
  ]

  const child = spawn(chrome, args, {detached: true, stdio: 'ignore'})
  child.unref()
  // When Chrome is already running with this profile, the new process hands the URL over to
  // it and exits; the running instance keeps serving the debugging port.
  let handedOver = false
  child.once('exit', () => {
    handedOver = true
  })

  const browserName = await waitForDevTools(options.port)
  const browserUrl = `http://127.0.0.1:${options.port}`

  console.log(`${browserName} is listening on ${browserUrl}${headless ? ' (headless)' : ''}`)
  console.log(`Opened ${options.url}${usedToken ? ' (signed in with STUDIO_AUTH_TOKEN)' : ''}`)
  console.log(
    handedOver ? 'Reused the Chrome instance that was already running' : `Chrome pid: ${child.pid}`,
  )
  console.log('')
  console.log('Attach chrome-devtools-mcp to it with:')
  console.log(
    `  pnpm --filter sanity-test-studio exec chrome-devtools start --categoryExperimentalThirdParty=true --browserUrl=${browserUrl}`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
