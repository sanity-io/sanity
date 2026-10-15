interface StashedAuthHashParams {
  sid?: string
  token?: string
  claim?: string
}

declare global {
  /**
   * Set by an inline script that the CLI adds to the studio's `index.html`. It runs before any
   * module, removes the auth params below from the URL hash, and keeps their raw values here so
   * a studio that fails to boot never leaves them in the address bar.
   *
   * The CLI only adds that script when this package's `package.json` sets the
   * `sanityCliCapabilities.authHashStash` marker: bump it if the stash contract changes
   * incompatibly, and never remove this reader while the marker is set.
   */
  var __SANITY_AUTH_HASH_PARAMS__: StashedAuthHashParams | undefined
}

type AuthHashParam = keyof StashedAuthHashParams

const AUTH_HASH_PARAMS: AuthHashParam[] = ['sid', 'token', 'claim']

/**
 * Takes a raw value stashed by the studio's `index.html`, removing it from the stash so it
 * doesn't linger on the global.
 */
export function takeStashedAuthHashParam(name: AuthHashParam): string | undefined {
  const stash = globalThis.__SANITY_AUTH_HASH_PARAMS__
  if (!stash) return undefined
  const value = stash[name]
  delete stash[name]
  return typeof value === 'string' ? value : undefined
}

/**
 * Takes the raw value of a param in the URL hash, wherever it sits in the `&`-separated list, and
 * removes every occurrence of it from the URL and the current history entry, even when the value
 * is invalid.
 */
export function takeHashParam(name: AuthHashParam): string | undefined {
  if (typeof window === 'undefined' || typeof window.location !== 'object') {
    return undefined
  }

  const isParam = (param: string) => param.startsWith(`${name}=`)
  const params = window.location.hash.replace(/^#/, '').split('&')
  const value = params.find(isParam)?.slice(name.length + 1)
  if (value === undefined) {
    return undefined
  }

  const newUrl = new URL(window.location.href)
  newUrl.hash = params.filter((param) => param && !isParam(param)).join('&')
  history.replaceState(null, '', newUrl)

  return value
}

const isAuthParam = (param: string) => AUTH_HASH_PARAMS.some((name) => param.startsWith(`${name}=`))

/**
 * Removes the auth params from a hash string, for code that writes a hash back to the URL from a
 * `history` location cached before the auth modules removed them. A hash without auth params is
 * returned unchanged.
 */
export function removeAuthHashParams(hash: string): string {
  const params = hash.replace(/^#/, '').split('&')
  if (!params.some(isAuthParam)) {
    return hash
  }
  const kept = params.filter((param) => param && !isAuthParam(param))
  return kept.length > 0 ? `#${kept.join('&')}` : ''
}
