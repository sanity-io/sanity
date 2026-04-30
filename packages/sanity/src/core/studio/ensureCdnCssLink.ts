/**
 * Fallback CSS injection for old auto-update studios.
 *
 * Background:
 *
 *   Studios that were `sanity deploy`'d with an older CLI (before CSS-over-the-wire support
 *   was added) have a static HTML where the inline `<head>` runtime script does not know
 *   about CSS — it only handles the import map. When that HTML auto-updates the JS to a
 *   sanity version that has CSS extracted (and where the CDN bundle's CSS imports are
 *   stripped via the strip-css-imports plugin), the result is broken styling: no `<link>`
 *   tag was emitted, and the JS doesn't import the CSS itself.
 *
 *   Newer studios (built with the CSS-aware CLI) get a `<link rel="stylesheet">` injected
 *   at page load by the runtime script in the static HTML, so they don't need this fallback.
 *
 * What this does:
 *
 *   When sanity is loaded from the modules CDN (i.e. `import.meta.url` points at
 *   modules.sanity-cdn) AND no stylesheet pointing at sanity's CSS module URL is already
 *   present, this side-effect creates a `<link rel="stylesheet">` whose URL is derived from
 *   the `sanity-cdn` import map entry. That keeps CSS requests on the public redirect route.
 *
 *   Outside the CDN (consumer-bundled studios via `sanity build`, dev mode, SSR, tests),
 *   this is a no-op — `import.meta.url` won't have a modules.sanity-cdn hostname, and the
 *   consumer's bundler handles CSS via the npm package's `intro` hook in package.config.ts.
 *
 * Idempotency:
 *
 *   The detection looks for any existing `<link rel="stylesheet">` hosted on sanity-cdn
 *   that ends in `/index.css` and whose package segment matches. If the CLI runtime script
 *   already injected a link, this fallback skips.
 *
 * @internal
 */

const MODULES_SANITY_CDN_HOSTNAME = /^modules\.sanity-cdn\.[a-z]+$/i
const SANITY_CDN_HOSTNAME = /^sanity-cdn\.[a-z]+$/i

function isModulesSanityCdnUrl(url: URL): boolean {
  return MODULES_SANITY_CDN_HOSTNAME.test(url.hostname)
}

function isSanityCdnUrl(url: URL): boolean {
  return SANITY_CDN_HOSTNAME.test(url.hostname)
}

/**
 * Extracts the package path segment from a CDN CSS URL pathname.
 *
 * Handles both known sanity-cdn URL shapes:
 *   Legacy:  /v1/modules/<pkg>/default/<range>/t<ts>/index.css  → segments[3]
 *   By-app:  /v1/modules/by-app/<appId>/t<ts>/<range>/<pkg>/index.css  → segment before index.css
 */
function extractPackageSegment(pathname: string): string | null {
  const segments = pathname.split('/')
  // Expect at least /v1/modules/<segment>/... (indices 0-3)
  if (segments.length < 4 || segments[1] !== 'v1' || segments[2] !== 'modules') return null

  if (segments[3] === 'by-app') {
    return segments[segments.length - 2] || null
  }

  return segments[3] || null
}

/**
 * Converts a package path segment to a package specifier.
 * E.g. `@sanity__vision` → `@sanity/vision` (double underscores become slashes).
 */
function packagePathSegmentToSpecifier(packagePathSegment: string): string {
  return packagePathSegment.replace(/__/g, '/')
}

function findImportMapModuleUrl(packageSpecifier: string): URL | null {
  const importMapEntries = document.querySelectorAll('script[type="importmap"]')

  for (const entry of importMapEntries) {
    let importMap: {imports?: Record<string, string>}
    try {
      importMap = JSON.parse(entry.textContent || '{}')
    } catch {
      continue
    }

    const moduleUrl = importMap.imports?.[packageSpecifier]
    if (!moduleUrl) continue

    try {
      const url = new URL(moduleUrl, document.baseURI)
      if (isSanityCdnUrl(url)) return url
    } catch {
      continue
    }
  }

  return null
}

function deriveCssUrlFromImportMap(packagePathSegment: string): string | null {
  const importMapUrl = findImportMapModuleUrl(packagePathSegmentToSpecifier(packagePathSegment))
  if (!importMapUrl) return null

  const cssUrl = new URL(importMapUrl.href)
  cssUrl.pathname = `${cssUrl.pathname.replace(/\/$/, '')}/index.css`
  cssUrl.search = ''
  cssUrl.hash = ''

  if (extractPackageSegment(cssUrl.pathname) !== packagePathSegment) return null

  return cssUrl.href
}

function findExistingCssLink(packagePathSegment: string): HTMLLinkElement | null {
  const head = document.head
  if (!head) return null

  const links = head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  for (const link of links) {
    let url: URL
    try {
      url = new URL(link.href)
    } catch {
      continue
    }
    if (!isSanityCdnUrl(url)) continue
    if (!url.pathname.endsWith('/index.css')) continue
    if (extractPackageSegment(url.pathname) === packagePathSegment) return link
  }
  return null
}

/**
 * Inject a `<link rel="stylesheet">` for the package's CSS, derived from the current import map.
 *
 * @param moduleUrl - The URL the calling JS module was loaded from (typically `import.meta.url`).
 *                    Used to verify that the module was loaded from modules.sanity-cdn.
 * @param packagePathSegment - The path segment that identifies the package in the CSS URL —
 *                             `sanity` for `sanity`, `@sanity__vision` for `@sanity/vision`.
 *
 * @internal
 */
export function ensureCdnCssLink(moduleUrl: string, packagePathSegment: string): void {
  if (typeof document === 'undefined') return

  let url: URL
  try {
    url = new URL(moduleUrl)
  } catch {
    return
  }

  // Only act when the JS itself was loaded from the modules CDN.
  if (!isModulesSanityCdnUrl(url)) return

  // The CLI runtime script (in newer studios) may have already injected this link.
  if (findExistingCssLink(packagePathSegment)) return

  const cssUrl = deriveCssUrlFromImportMap(packagePathSegment)
  if (!cssUrl) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cssUrl
  document.head.appendChild(link)
}
