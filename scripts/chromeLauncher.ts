/**
 * The launcher behind `pnpm react-devtools-mcp:chrome` (`./launchChrome.ts` is the entry that
 * runs it). Kept free of side effects at import time so `chromeLauncher.test.ts` can exercise
 * the parts that guard `STUDIO_AUTH_TOKEN`: the one-shot loopback redirect, the rule that a
 * listener on the debugging port is only told about that redirect once it has been authenticated
 * as the launcher's own Chrome, and the cleanup when a launch fails halfway. The policies the
 * orchestration relies on are pure modules of their own (`./tokenRouting.ts`, `./chromeArgs.ts`,
 * `./chromeEnvironment.ts`, `./devtoolsEndpoint.ts`).
 */
import {spawn} from 'node:child_process'
import {randomBytes} from 'node:crypto'
import {once} from 'node:events'
import {
  accessSync,
  closeSync,
  constants,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import {createServer} from 'node:http'
import path from 'node:path'
import process from 'node:process'
import {setTimeout as sleep} from 'node:timers/promises'
import {parseArgs} from 'node:util'

import {buildChromeArgs, checkPassthroughArgs} from './chromeArgs'
import {chromeEnvironment} from './chromeEnvironment'
import {
  announcedBrowserEndpoint,
  blankPageEndpoint,
  getBrowserName,
  isAnnouncedBrowser,
  isEndpointAt,
  type LauncherState,
  parseLauncherState,
} from './devtoolsEndpoint'
import {describeUrl, parseUrl, routeToken} from './tokenRouting'

const DEFAULT_URL = 'http://localhost:3333/test'
const DEFAULT_PORT = 9222
const STARTUP_TIMEOUT_MS = 30_000
const PROBE_TIMEOUT_MS = 2_000
const REPO_ROOT = path.resolve(import.meta.dirname, '..')
const CACHE_DIR = path.join(REPO_ROOT, 'node_modules', '.cache', 'react-devtools-mcp')
const USER_DATA_DIR = path.join(CACHE_DIR, 'chrome-profile')
/** The stderr of the Chrome from the last successful launch; launches in progress use their own file. */
const CHROME_STDERR_LOG = path.join(CACHE_DIR, 'chrome-stderr.log')
const LAUNCHER_STATE = path.join(CACHE_DIR, 'launcher.json')
const LAUNCH_LOCK = path.join(CACHE_DIR, 'launch.lock')
/** A launch lock older than this whose owner cannot be confirmed alive is taken over. */
const LOCK_STALE_MS = 60_000

export interface Options {
  url: URL
  port: number
  headless: boolean
  injectToken: boolean
  injectTokenInsecureHttp: boolean
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
  checkPassthroughArgs(chromeArgs)

  const {values, positionals} = parseArgs({
    args: ownArgs,
    allowPositionals: true,
    options: {
      'headless': {type: 'boolean', default: false},
      'port': {type: 'string', default: String(DEFAULT_PORT)},
      'inject-token': {type: 'boolean', default: false},
      'inject-token-insecure-http': {type: 'boolean', default: false},
    },
  })

  if (positionals.length > 1) {
    throw new Error(`Expected at most one url argument, got ${positionals.length}`)
  }

  return {
    url: parseUrl(positionals[0] ?? DEFAULT_URL, DEFAULT_URL),
    port: parsePort(values.port),
    headless: values.headless,
    injectToken: values['inject-token'] || values['inject-token-insecure-http'],
    injectTokenInsecureHttp: values['inject-token-insecure-http'],
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

/** What answers `/json/version` on `port` (`{versionInfo}`), or `null` when nothing does. */
async function probeDevTools(port: number): Promise<{versionInfo: unknown} | null> {
  try {
    // A port that accepts the connection but never answers must not stall the startup timeout
    const response = await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
    return response.ok ? {versionInfo: await response.json()} : null
  } catch {
    return null
  }
}

/**
 * Opens a file of its own for this launch's Chrome stderr, so the announcement read from it can
 * only be this Chrome's whatever else runs at the same time. Files left by earlier launches that
 * never succeeded are removed first. `promote` renames the file to `CHROME_STDERR_LOG` once the
 * launch has succeeded (Chrome keeps writing to the same inode; on a platform that refuses the
 * rename, the per-launch name stays).
 */
function openChromeStderr(): {fd: number; path: string; promote: () => void} {
  mkdirSync(CACHE_DIR, {recursive: true, mode: 0o700})
  for (const name of readdirSync(CACHE_DIR)) {
    if (name.startsWith('chrome-stderr.') && name !== 'chrome-stderr.log') {
      rmSync(path.join(CACHE_DIR, name), {force: true})
    }
  }
  const file = path.join(CACHE_DIR, `chrome-stderr.${randomBytes(4).toString('hex')}.log`)
  return {
    fd: openSync(file, 'w', 0o600),
    path: file,
    promote: () => {
      try {
        renameSync(file, CHROME_STDERR_LOG)
      } catch {
        // Keep the per-launch file
      }
    },
  }
}

/** The contents of a Chrome stderr file; empty when nothing has been written. */
function readChromeStderr(file: string): string {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

/** Records the Chrome a launch ended up with, for `findRunningChrome` on later runs. */
function writeLauncherState(state: LauncherState): void {
  writeFileSync(LAUNCHER_STATE, JSON.stringify(state), {mode: 0o600})
}

function readLauncherState(): LauncherState | null {
  try {
    return parseLauncherState(readFileSync(LAUNCHER_STATE, 'utf8'))
  } catch {
    return null
  }
}

/** Whether a process with `pid` exists (signal 0 probes without delivering anything). */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    // EPERM: it exists but belongs to someone else, which is still "alive"
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/**
 * Whether the launch lock at `lockDir` can be taken over. A recorded owner decides: alive means
 * wait, gone means take over. Only a lock with no readable owner (the directory exists but the
 * pid has not been written, or never was) is judged by age, so a run that is merely slow or
 * paused keeps its lock.
 */
function isLockStale(lockDir: string): boolean {
  let age: number
  try {
    age = Date.now() - statSync(lockDir).mtimeMs
  } catch {
    return true // gone already
  }
  let owner: number | null = null
  try {
    const recorded = Number(readFileSync(path.join(lockDir, 'pid'), 'utf8'))
    if (Number.isInteger(recorded) && recorded > 0) {
      owner = recorded
    }
  } catch {
    // Not written yet, or never written
  }
  if (owner !== null) {
    return !isProcessAlive(owner)
  }
  return age > LOCK_STALE_MS
}

/**
 * Takes a lock directory judged stale out of the way. Several contenders can judge the same
 * directory stale at once; renaming is atomic, so exactly one of them moves it and the others
 * find nothing there and go round again. The one that moved it looks at what it got, because the
 * path may have been replaced between the check and the rename: a directory whose owner is in
 * fact alive is put back where it was. (If a new lock has appeared at the path in the meantime,
 * the put-back fails and the displaced owner runs unlocked; that needs three contenders racing
 * within microseconds right after a crashed run, and costs nothing beyond what Chrome's own
 * one-instance-per-profile handover does, since stderr files are per launch and only the Chrome
 * that actually started records state.)
 */
export function reclaimStaleLock(lockDir: string): void {
  const claimed = `${lockDir}.stale-${randomBytes(4).toString('hex')}`
  try {
    renameSync(lockDir, claimed)
  } catch {
    return // another contender was first
  }
  if (isLockStale(claimed)) {
    rmSync(claimed, {recursive: true, force: true})
    return
  }
  try {
    renameSync(claimed, lockDir)
  } catch {
    rmSync(claimed, {recursive: true, force: true})
  }
}

/**
 * Runs `fn` while holding the launch lock, so two launcher runs cannot both miss the probe and
 * start two Chromes. There is one lock, not one per port: the profile and the state record are
 * shared by every port, and Chrome runs one instance per profile anyway. The lock is a directory
 * (`mkdir` is atomic) holding the owner's pid; a lock whose owner is gone — or that never
 * recorded one and is older than `LOCK_STALE_MS` — is reclaimed through `reclaimStaleLock`.
 * Waits up to `waitMs` for a live owner to finish.
 */
export async function withLaunchLock<T>(
  fn: () => Promise<T>,
  waitMs = STARTUP_TIMEOUT_MS,
): Promise<T> {
  mkdirSync(CACHE_DIR, {recursive: true, mode: 0o700})
  const lockDir = LAUNCH_LOCK
  const deadline = Date.now() + waitMs
  while (true) {
    try {
      mkdirSync(lockDir, {mode: 0o700})
      writeFileSync(path.join(lockDir, 'pid'), String(process.pid), {mode: 0o600})
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }
    }
    if (isLockStale(lockDir)) {
      reclaimStaleLock(lockDir)
      continue
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `Another launcher run holds the launch lock (${lockDir}); wait for it to finish, or ` +
          'remove that directory if it is left over from a crash.',
      )
    }
    // oxlint-disable-next-line no-await-in-loop -- polling for the lock is sequential by nature
    await sleep(100)
  }
  try {
    return await fn()
  } finally {
    rmSync(lockDir, {recursive: true, force: true})
  }
}

// oxlint-disable no-await-in-loop -- sequential polling of Chrome's debugging endpoint is intentional
/**
 * Waits until the Chrome just started has announced its browser target on its stderr file and
 * that same browser answers on the debugging port; fails when Chrome fails (`getFailure`), when
 * something else holds the port or when the timeout passes. Resolves with the browser name and
 * the announced target.
 */
async function waitForChrome(
  port: number,
  stderrFile: string,
  getFailure: () => Error | null,
): Promise<{browserName: string; endpoint: string}> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  const stop = 'Stop that listener or pick another --port, then rerun.'
  while (Date.now() < deadline) {
    const failure = getFailure()
    if (failure !== null) {
      throw failure
    }
    const announced = announcedBrowserEndpoint(readChromeStderr(stderrFile))
    if (announced !== null) {
      // Chrome falls back to another loopback address when the one it was told is taken
      if (!isEndpointAt(announced, '127.0.0.1', port)) {
        throw new Error(
          `Chrome could not bind http://127.0.0.1:${port}: something else is listening there, ` +
            `so it opened ${announced} instead and was stopped again. ${stop}`,
        )
      }
      const probed = await probeDevTools(port)
      if (probed !== null) {
        if (isAnnouncedBrowser(announced, probed.versionInfo)) {
          return {browserName: getBrowserName(probed.versionInfo), endpoint: announced}
        }
        throw new Error(
          `Another DevTools endpoint answers on http://127.0.0.1:${port}, not the Chrome that ` +
            `was just started (and stopped again). ${stop}`,
        )
      }
    }
    await sleep(250)
  }
  throw new Error(
    `Chrome did not open http://127.0.0.1:${port} within ${STARTUP_TIMEOUT_MS / 1000}s`,
  )
}
// oxlint-enable no-await-in-loop

export interface Redirect {
  /** Loopback url for Chrome to open; it carries no part of the target url. */
  url: string
  /** Resolves once Chrome has fetched the redirect. */
  served: Promise<void>
  close: () => void
}

/**
 * Serves a one-shot `302` to the target url from an ephemeral loopback server. Chrome is told
 * to open the loopback url instead of the target itself, so `#token=` is never part of a
 * `Page.navigate` command or a `/json/new` request to the debugging port: the token leaves this
 * process only in the response to a request the authenticated Chrome makes itself. The server is
 * bound to 127.0.0.1, answers the redirect exactly once (a 128-bit random path, `404` for
 * everything else, no body), and lives only until that first fetch or the startup timeout.
 */
export async function startRedirect(targetUrl: string): Promise<Redirect> {
  const secretPath = `/${randomBytes(16).toString('hex')}`
  const server = createServer()
  let redirected = false
  const served = new Promise<void>((resolve) => {
    server.on('request', (request, response) => {
      if (redirected || request.method !== 'GET' || request.url !== secretPath) {
        response.writeHead(404, {Connection: 'close'}).end()
        return
      }
      redirected = true
      response
        .writeHead(302, {'Location': targetUrl, 'Cache-Control': 'no-store', 'Connection': 'close'})
        // Resolve only once the response has been flushed, so closing the server afterwards
        // cannot cut the socket before Chrome has the redirect
        .end(() => resolve())
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

/** A Chrome whose debugging endpoint has been authenticated as the launcher's own. */
export interface Launched {
  browserName: string
  /** Undefined when the browser was already running. */
  pid?: number
  /** Stops the Chrome this run started; absent for a reused browser, which is left alone. */
  stop?: () => void
  /** Opens `url` in this Chrome, through its debugging endpoint. */
  open: (url: string) => Promise<void>
}

/** Opens `url` in a new tab of the browser already serving `browserUrl`. */
async function openInRunningBrowser(
  browserUrl: string,
  url: string,
  timeoutMs: number,
): Promise<void> {
  // Chrome reads the url from the raw query string and unescapes it, so encoding keeps `&`,
  // `?` and `#` inside `url` intact
  const response = await fetch(`${browserUrl}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) {
    throw new Error(
      `The browser listening on ${browserUrl} refused to open a new tab (HTTP ${response.status})`,
    )
  }
}

/** Sends one Chrome DevTools Protocol command over a target's websocket and awaits its reply. */
async function sendCdpCommand(
  wsUrl: string,
  method: string,
  params: Record<string, unknown>,
  timeoutMs: number,
): Promise<void> {
  const socket = new WebSocket(wsUrl)
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Chrome did not answer ${method} within ${timeoutMs / 1000}s`)),
        timeoutMs,
      )
      const fail = (message: string) => {
        clearTimeout(timer)
        reject(new Error(message))
      }
      socket.onopen = () => socket.send(JSON.stringify({id: 1, method, params}))
      socket.onerror = () => fail(`Could not connect to Chrome's DevTools endpoint at ${wsUrl}`)
      socket.onclose = () => fail(`Chrome closed its DevTools endpoint before answering ${method}`)
      socket.onmessage = (event) => {
        const reply: unknown = JSON.parse(String(event.data))
        if (typeof reply !== 'object' || reply === null || !('id' in reply) || reply.id !== 1) {
          return
        }
        if ('error' in reply) {
          fail(`Chrome rejected ${method}: ${JSON.stringify(reply.error)}`)
          return
        }
        clearTimeout(timer)
        socket.onclose = null
        resolve()
      }
    })
  } finally {
    socket.onclose = null
    socket.close()
  }
}

/**
 * Navigates the `about:blank` page a freshly started Chrome opens with to `url`, over CDP. The
 * url thereby travels only to the endpoint that was just authenticated, never through argv.
 */
export async function openInFreshChrome(
  browserUrl: string,
  url: string,
  timeoutMs: number,
): Promise<void> {
  const response = await fetch(`${browserUrl}/json/list`, {signal: AbortSignal.timeout(timeoutMs)})
  if (!response.ok) {
    throw new Error(
      `The Chrome listening on ${browserUrl} did not list its pages (HTTP ${response.status})`,
    )
  }
  const page = blankPageEndpoint(await response.json())
  if (page === null) {
    throw new Error(`The Chrome listening on ${browserUrl} has no blank page to open the url in`)
  }
  await sendCdpCommand(page, 'Page.navigate', {url}, timeoutMs)
}

/**
 * Starts Chrome on a blank page and resolves once it has announced itself and its port answers
 * as that same browser. The studio url is opened afterwards through `Launched.open`.
 */
async function launchChrome(options: Options, timeoutMs: number): Promise<Launched> {
  // Resolved here rather than up front: opening a tab in a running browser needs no executable
  const chrome = findChrome()
  // The profile holds the signed-in session, so only its owner gets to read it
  mkdirSync(USER_DATA_DIR, {recursive: true, mode: 0o700})

  const args = buildChromeArgs({
    port: options.port,
    userDataDir: USER_DATA_DIR,
    headless: options.headless,
    // Chrome refuses to run its sandbox as root (containers, some CI runners)
    noSandbox: process.platform === 'linux' && process.getuid?.() === 0,
    passthrough: options.chromeArgs,
  })

  // Chrome announces `DevTools listening on ws://…/devtools/browser/<uuid>` on stderr; that
  // line, written by the process itself into a file only it writes to, is what tells its
  // endpoint apart from any other
  const stderr = openChromeStderr()
  const child = spawn(chrome, args, {
    detached: true,
    stdio: ['ignore', 'ignore', stderr.fd],
    env: chromeEnvironment(process.env),
  })
  closeSync(stderr.fd)
  child.unref()
  let failure: Error | null = null
  // A spawn that fails (stale CHROME_PATH, missing binary) emits `error` and no `exit`; without a
  // listener Node would terminate on it instead of reaching main().catch
  child.once('error', (error) => {
    failure ??= new Error(`Could not start Chrome at ${chrome}: ${error.message}`)
  })
  child.once('exit', () => {
    // Chrome runs one instance per profile: a second one hands over to the first and exits
    const running = readLauncherState()
    const hint =
      running !== null && running.port !== options.port && isProcessAlive(running.pid)
        ? `The launcher's Chrome is already running on port ${running.port}; use ` +
          `--port=${running.port}, or stop it (kill ${running.pid}) and retry.`
        : 'A Chrome using the react-devtools-mcp profile is probably already running without ' +
          'one; close it and retry.'
    failure ??= new Error(`Chrome exited before opening its debugging port. ${hint}`)
  })

  const stop = () => {
    child.kill()
  }
  try {
    const {browserName, endpoint} = await waitForChrome(options.port, stderr.path, () => failure)
    if (child.pid !== undefined) {
      writeLauncherState({pid: child.pid, port: options.port, endpoint})
    }
    stderr.promote()
    const browserUrl = `http://127.0.0.1:${options.port}`
    return {
      browserName,
      pid: child.pid,
      stop,
      open: (url) => openInFreshChrome(browserUrl, url, timeoutMs),
    }
  } catch (error) {
    // A Chrome that is not serving the promised endpoint is not left behind
    stop()
    throw error
  }
}

/** What `findRunningChrome` consults besides the port; replaceable in tests. */
export interface RunningChromeDeps {
  readState: () => LauncherState | null
  isProcessAlive: (pid: number) => boolean
  /** How long the running browser gets to open a tab. */
  timeoutMs: number
}

const defaultRunningChromeDeps: RunningChromeDeps = {
  readState: readLauncherState,
  isProcessAlive,
  timeoutMs: STARTUP_TIMEOUT_MS,
}

/**
 * The launcher's own Chrome when it is already listening on `port`, `null` when nothing
 * listens. Anything else on the port is refused: the launcher would otherwise hand it the
 * redirect url, and fetching that yields the token in its `Location`. "Own" means the Chrome
 * recorded by the last successful launch is still running and the listener advertises the
 * browser target that Chrome announced; the running process is what keeps a later squatter
 * from replaying a target it observed while that Chrome was up.
 */
export async function findRunningChrome(
  port: number,
  deps: RunningChromeDeps = defaultRunningChromeDeps,
): Promise<Launched | null> {
  const probed = await probeDevTools(port)
  if (probed === null) {
    return null
  }
  const state = deps.readState()
  const isOwnChrome =
    state !== null &&
    state.port === port &&
    deps.isProcessAlive(state.pid) &&
    isAnnouncedBrowser(state.endpoint, probed.versionInfo)
  if (!isOwnChrome) {
    throw new Error(
      `Something is already listening on http://127.0.0.1:${port}, but it is not the Chrome ` +
        'this launcher started (that Chrome is no longer running, or the listener does not ' +
        'advertise its browser target). The launcher only opens urls in the Chrome it started ' +
        'itself; stop that process or pick another --port.',
    )
  }
  const browserUrl = `http://127.0.0.1:${port}`
  return {
    browserName: getBrowserName(probed.versionInfo),
    open: (url) => openInRunningBrowser(browserUrl, url, deps.timeoutMs),
  }
}

async function waitForRedirect(redirect: Redirect, timeoutMs: number): Promise<void> {
  // Exiting before Chrome has fetched the redirect would leave it on a dead loopback url
  const abortTimeout = new AbortController()
  const timeout = sleep(timeoutMs, undefined, {signal: abortTimeout.signal}).then(() => {
    throw new Error(`Chrome did not open the url within ${timeoutMs / 1000}s`)
  })
  try {
    await Promise.race([redirect.served, timeout])
  } finally {
    abortTimeout.abort()
  }
}

/** Everything `run` reaches outside its own process; replaceable in tests. */
export interface RunDeps {
  findRunningChrome: (port: number) => Promise<Launched | null>
  launchChrome: (options: Options, timeoutMs: number) => Promise<Launched>
  /** Serializes "probe the port, else launch" across concurrent launcher runs. */
  withLaunchLock: <T>(fn: () => Promise<T>) => Promise<T>
  startRedirect: (targetUrl: string) => Promise<Redirect>
  /** How long Chrome gets to start, open the url and fetch the redirect. */
  startupTimeoutMs: number
  log: (line: string) => void
  warn: (line: string) => void
}

const defaultRunDeps: RunDeps = {
  findRunningChrome,
  launchChrome,
  withLaunchLock,
  startRedirect,
  startupTimeoutMs: STARTUP_TIMEOUT_MS,
  log: console.log,
  warn: console.warn,
}

/**
 * The whole run: parse `argv`, decide whether and how the token travels (`./tokenRouting.ts`),
 * get hold of an authenticated Chrome (the running one, or a fresh one started on a blank page)
 * and only then create the one-shot redirect and open it through that Chrome's debugging
 * endpoint. Neither the token nor the redirect url is ever on a command line. A Chrome started
 * here is stopped again when the url could not be opened or the redirect was never fetched, so
 * a failed run leaves no process behind; a reused browser is never touched.
 */
export async function run(
  argv: string[],
  env: NodeJS.ProcessEnv,
  deps: RunDeps = defaultRunDeps,
): Promise<void> {
  const options = parseOptions(argv)
  const hasDisplay = Boolean(env.DISPLAY || env.WAYLAND_DISPLAY)
  options.headless ||= process.platform === 'linux' && !hasDisplay
  const browserUrl = `http://127.0.0.1:${options.port}`

  const routing = routeToken(options.url, env.STUDIO_AUTH_TOKEN, options)
  if (routing.kind === 'refuse') {
    throw new Error(routing.reason)
  }
  if (routing.notice) {
    deps.warn(routing.notice)
  }
  // The launcher's own Chrome already serving the port gets the url as a new tab; a second
  // Chrome on the same profile would only hand the url over to it (headed) or exit without
  // opening it (headless), and its short-lived pid would be meaningless to report. Either way
  // the Chrome is authenticated before the redirect exists, so nothing else ever has it. The
  // lock keeps a concurrent run from launching alongside, or from reading this launch's
  // announcement as its own.
  const launched = await deps.withLaunchLock(
    async () =>
      (await deps.findRunningChrome(options.port)) ??
      (await deps.launchChrome(options, deps.startupTimeoutMs)),
  )

  let redirect: Redirect
  try {
    redirect = await deps.startRedirect(routing.url)
  } catch (error) {
    launched.stop?.()
    throw error
  }
  try {
    try {
      await launched.open(redirect.url)
      await waitForRedirect(redirect, deps.startupTimeoutMs)
    } catch (error) {
      // A Chrome started by this run must not outlive a run that failed; a reused browser is
      // left alone
      launched.stop?.()
      throw error
    }
    const {browserName, pid} = launched

    // A reused browser's mode is unknown; --headless only describes a Chrome started here
    const mode = pid !== undefined && options.headless ? ' (headless)' : ''
    deps.log(`${browserName} is listening on ${browserUrl}${mode}`)
    deps.log(
      `Opened ${describeUrl(options.url)}${routing.signIn ? ' (signed in with STUDIO_AUTH_TOKEN)' : ''}`,
    )
    deps.log(
      pid === undefined
        ? `Reused the browser that was already listening on ${browserUrl}`
        : `Chrome pid: ${pid}`,
    )
    deps.log('')
    deps.log('Attach chrome-devtools-mcp to it with:')
    deps.log(
      `  pnpm --filter sanity-test-studio exec chrome-devtools start --categoryExperimentalThirdParty=true --browserUrl=${browserUrl}`,
    )
  } finally {
    redirect.close()
  }
}
