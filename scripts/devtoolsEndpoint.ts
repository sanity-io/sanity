/**
 * Tells the Chrome that `launchChrome.ts` started apart from anything else that answers on its
 * debugging port, as pure functions so the rule is unit-tested (see `devtoolsEndpoint.test.ts`).
 *
 * The launcher hands the running browser a redirect url whose `Location` header carries
 * `STUDIO_AUTH_TOKEN`, so it must not do that for an arbitrary process that bound the port
 * first (any local user can bind 127.0.0.1:9222) and merely answers `/json/version` the way
 * Chrome does. Chrome announces its browser target, `ws://127.0.0.1:<port>/devtools/browser/<uuid>`
 * with a uuid drawn at every start, on its own stderr — which the launcher captures — and
 * advertises the same url as `webSocketDebuggerUrl` in `/json/version`. A listener is the
 * launcher's Chrome only when the two agree and the process recorded for that launch is still
 * running: the target is public to anything that could reach the port while Chrome was up, so
 * the live process is what keeps a later squatter from replaying it.
 */

const DEVTOOLS_LISTENING = /DevTools listening on (ws:\/\/\S+)/g

/**
 * The browser target url Chrome announced on stderr, the last one when it was restarted into the
 * same log; `null` when the log holds no announcement.
 */
export function announcedBrowserEndpoint(stderr: string): string | null {
  let endpoint: string | null = null
  for (const match of stderr.matchAll(DEVTOOLS_LISTENING)) {
    endpoint = match[1]
  }
  return endpoint
}

/** The browser target url a DevTools endpoint advertises in `/json/version`, if it does. */
export function advertisedBrowserEndpoint(versionInfo: unknown): string | null {
  if (
    typeof versionInfo === 'object' &&
    versionInfo !== null &&
    'webSocketDebuggerUrl' in versionInfo &&
    typeof versionInfo.webSocketDebuggerUrl === 'string'
  ) {
    return versionInfo.webSocketDebuggerUrl
  }
  return null
}

/** `/devtools/browser/<uuid>` of a browser target url, `null` for anything else. */
export function browserTargetPath(endpoint: string | null): string | null {
  if (endpoint === null) {
    return null
  }
  try {
    const {protocol, pathname} = new URL(endpoint)
    return (protocol === 'ws:' || protocol === 'wss:') && pathname.startsWith('/devtools/browser/')
      ? pathname
      : null
  } catch {
    return null
  }
}

/**
 * Whether a browser target url is served from `hostname` on `port`. Chrome announces the
 * address it actually bound, which is not the one it was told when that one was taken.
 */
export function isEndpointAt(endpoint: string, hostname: string, port: number): boolean {
  try {
    const url = new URL(endpoint)
    // `URL` drops the scheme's default port (`ws://host:80/` → `port === ''`)
    const endpointPort = url.port === '' ? (url.protocol === 'wss:' ? 443 : 80) : Number(url.port)
    return url.hostname === hostname && endpointPort === port
  } catch {
    return false
  }
}

/** What the launcher records about the Chrome it started, for later reuse. */
export interface LauncherState {
  pid: number
  port: number
  /** The browser target url that Chrome announced on stderr. */
  endpoint: string
}

/** Parses the launcher's state file; `null` for anything that is not a complete record. */
export function parseLauncherState(json: string): LauncherState | null {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    return null
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'pid' in value &&
    typeof value.pid === 'number' &&
    Number.isInteger(value.pid) &&
    value.pid > 0 &&
    'port' in value &&
    typeof value.port === 'number' &&
    'endpoint' in value &&
    typeof value.endpoint === 'string' &&
    browserTargetPath(value.endpoint) !== null
  ) {
    return {pid: value.pid, port: value.port, endpoint: value.endpoint}
  }
  return null
}

/**
 * Whether the endpoint that answered `/json/version` is the Chrome that announced `announced` on
 * stderr. Only the target path is compared: Chrome echoes the request's `Host` header into the
 * advertised url, so the host and port differ between the announcement and the answer.
 */
export function isAnnouncedBrowser(announced: string | null, versionInfo: unknown): boolean {
  const announcedPath = browserTargetPath(announced)
  return (
    announcedPath !== null &&
    announcedPath === browserTargetPath(advertisedBrowserEndpoint(versionInfo))
  )
}

/**
 * The page-target websocket url of the `about:blank` page in a `/json/list` answer — the page
 * a Chrome started by the launcher opens with — or `null` when there is none.
 */
export function blankPageEndpoint(targets: unknown): string | null {
  if (!Array.isArray(targets)) {
    return null
  }
  for (const target of targets) {
    if (
      typeof target === 'object' &&
      target !== null &&
      'type' in target &&
      target.type === 'page' &&
      'url' in target &&
      target.url === 'about:blank' &&
      'webSocketDebuggerUrl' in target &&
      typeof target.webSocketDebuggerUrl === 'string'
    ) {
      return target.webSocketDebuggerUrl
    }
  }
  return null
}

/** The `Browser` field of `/json/version`, for display. */
export function getBrowserName(versionInfo: unknown): string {
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
