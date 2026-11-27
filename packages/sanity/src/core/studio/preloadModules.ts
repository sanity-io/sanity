import {preloadModule} from 'react-dom'

declare global {
  /**
   * Module specifiers relative to this module, baked in by the bundle build of the auto-updating
   * studio (see `preload` in `package.bundle.ts`); undefined in every other build, e.g. the npm
   * package, dev and test environments.
   */
  var __SANITY_PRELOAD_MODULES__: readonly string[] | undefined
}

const PRELOAD_MODULES =
  typeof __SANITY_PRELOAD_MODULES__ === 'undefined' ? undefined : __SANITY_PRELOAD_MODULES__

/**
 * Asks the browser to fetch the lazy modules every studio needs right after boot, so they load
 * in parallel instead of one `import()` at a time. Does nothing outside of the auto-updating
 * studio bundle, which is the only build that has a list.
 *
 * A module's URL base is the URL of the response that delivered it, so the specifiers resolve
 * against the module host the CDN redirects to, never against the redirecting URL. A preload that
 * follows a cross-origin redirect fails in WebKit, so a specifier that is not a plain relative
 * path to the same origin as this module is skipped.
 */
export function preloadStudioModules(): void {
  if (!PRELOAD_MODULES) return

  const base = new URL(import.meta.url)
  for (const specifier of PRELOAD_MODULES) {
    if (!specifier.startsWith('./')) continue
    const url = new URL(specifier, base)
    if (url.origin !== base.origin) continue
    preloadModule(url.href, {as: 'script', crossOrigin: 'anonymous'})
  }
}
