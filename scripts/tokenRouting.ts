/**
 * Where the `react-devtools-mcp:chrome` launcher may send `STUDIO_AUTH_TOKEN`, as pure functions
 * so the policy is unit-tested (see `tokenRouting.test.ts`) independently of Chrome.
 *
 * - `parseUrl` accepts only absolute http(s) urls without embedded credentials and never reflects
 *   the argument in its errors.
 * - `routeToken` appends `#token=<token>` so the studio signs in on load. Only loopback origins
 *   get it automatically: the fragment is readable by the page's JavaScript, so a non-loopback
 *   `https:` origin needs the explicit `--inject-token` opt-in, and a non-loopback plaintext
 *   `http:` origin (token on the wire) the separately named `--inject-token-insecure-http`.
 */

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])
const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:'])

/**
 * Parses the url to open. Anything that is not an absolute http(s) url is rejected up front, and
 * so is a url with embedded credentials, which would otherwise travel with it everywhere. The
 * errors never reflect the argument itself (it may hold a password, in shapes no redaction
 * reliably catches); they name at most the parsed scheme and host.
 */
export function parseUrl(value: string, example: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`Invalid url: expected an absolute http(s) url such as ${example}`)
  }
  // WHATWG parsing also accepts file:, data:, mailto: and the like, none of which may ever be
  // handed the token
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    const host = url.hostname === '' ? '' : ` (host ${url.hostname})`
    throw new Error(`Invalid url: expected an http(s) url, got the "${url.protocol}" scheme${host}`)
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error(
      `Invalid url for ${url.origin}: credentials in the url (user:password@) are not supported`,
    )
  }
  return url
}

/**
 * The url for messages, rebuilt from origin, path and query so that neither a caller-supplied
 * fragment (`#token=`) nor anything else outside those parts can be echoed.
 */
export function describeUrl(url: URL): string {
  return `${url.origin}${url.pathname}${url.search}${url.hash === '' ? '' : '#…'}`
}

export interface TokenRoutingFlags {
  /** `--inject-token`: also sign in on a non-loopback https origin. */
  injectToken: boolean
  /** `--inject-token-insecure-http`: also sign in on a non-loopback plaintext http origin. */
  injectTokenInsecureHttp: boolean
}

export type TokenRouting =
  | {
      kind: 'open'
      /** The url Chrome ends up on. */
      url: string
      /** Whether `#token=` was appended. */
      signIn: boolean
      /** Why the token was left out even though one is set. */
      notice?: string
    }
  | {
      kind: 'refuse'
      reason: string
    }

/** Decides the url to open for a parsed, validated `url` and the token (if any) to sign in with. */
export function routeToken(
  url: URL,
  token: string | undefined,
  flags: TokenRoutingFlags,
): TokenRouting {
  if (token === undefined || token === '') {
    return {kind: 'open', url: url.href, signIn: false}
  }
  // A bare trailing `#` leaves `hash` empty and counts as no fragment
  if (url.hash !== '') {
    return {
      kind: 'open',
      url: url.href,
      signIn: false,
      notice: 'STUDIO_AUTH_TOKEN was not injected: the url already has a fragment.',
    }
  }

  // Set through the URL object rather than appended to `href`, which keeps a bare trailing `#`
  // and would yield `##token=`
  const signedInUrl = new URL(url.href)
  signedInUrl.hash = `token=${encodeURIComponent(token)}`
  const signedIn: TokenRouting = {kind: 'open', url: signedInUrl.href, signIn: true}
  // The insecure override is the stronger opt-in, so it implies the plain one
  const inject = flags.injectToken || flags.injectTokenInsecureHttp

  if (ALLOWED_PROTOCOLS.has(url.protocol) && LOOPBACK_HOSTS.has(url.hostname)) {
    return signedIn
  }
  if (url.protocol === 'https:') {
    if (inject) {
      return signedIn
    }
    return {
      kind: 'open',
      url: url.href,
      signIn: false,
      notice:
        `STUDIO_AUTH_TOKEN was not injected: ${url.origin} is not a loopback origin. ` +
        'Pass --inject-token to sign in there anyway.',
    }
  }
  if (flags.injectTokenInsecureHttp) {
    return signedIn
  }
  if (inject) {
    return {
      kind: 'refuse',
      reason:
        `Refusing to send STUDIO_AUTH_TOKEN to ${url.origin} over plaintext http. Use an https url, ` +
        'or pass --inject-token-insecure-http instead of --inject-token if you really must.',
    }
  }
  return {
    kind: 'open',
    url: url.href,
    signIn: false,
    notice:
      `STUDIO_AUTH_TOKEN was not injected: ${url.origin} is not a loopback origin and uses ` +
      'plaintext http. Pass --inject-token-insecure-http to sign in there anyway.',
  }
}
