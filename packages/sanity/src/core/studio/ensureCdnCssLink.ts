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
 *   When sanity is loaded from the CDN (i.e. `import.meta.url` points at sanity-cdn) AND no
 *   stylesheet pointing at sanity's CSS module URL is already present, this side-effect
 *   creates a `<link rel="stylesheet">` whose URL is derived from `import.meta.url` (so the
 *   CSS version always matches the JS version).
 *
 *   Outside the CDN (consumer-bundled studios via `sanity build`, dev mode, SSR, tests),
 *   this is a no-op — `import.meta.url` won't have a sanity-cdn hostname, and the consumer's
 *   bundler handles CSS via the npm package's `intro` hook in package.config.ts.
 *
 * Idempotency:
 *
 *   The detection looks for any existing `<link rel="stylesheet">` hosted on sanity-cdn
 *   that ends in `/index.css` and whose package segment matches. The package segment is
 *   extracted by parsing the known URL shapes (legacy: right after `/v1/modules/`; by-app:
 *   right before `/index.css`), so a by-app `appId` that happens to equal the package name
 *   does not cause a false-positive. If the CLI runtime script already injected a link, this
 *   fallback skips.
 *
 * @internal
 */

const SANITY_CDN_HOSTNAME = /^sanity-cdn\.[a-z]+$/i

function isSanityCdnUrl(url: URL): boolean {
  return SANITY_CDN_HOSTNAME.test(url.hostname)
}

/**
 * Extracts the package path segment from a CDN CSS URL pathname.
 *
 * Handles both known URL shapes:
 *   Legacy:  /v1/modules/<pkg>/default/<range>/t<ts>/index.css  → segments[3]
 *   By-app:  /v1/modules/by-app/<appId>/t<ts>/<range>/<pkg>/index.css  → segment before index.css
 */
function extractPackageSegment(pathname: string): string | null {
  const segments = pathname.split('/')
  // Expect at least /v1/modules/<segment>/... (indices 0–3)
  if (segments.length < 4 || segments[1] !== 'v1' || segments[2] !== 'modules') return null

  if (segments[3] === 'by-app') {
    // By-app: package is the segment directly before index.css
    return segments[segments.length - 2] || null
  }

  // Legacy: package is immediately after /v1/modules/
  return segments[3] || null
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
 * Inject a `<link rel="stylesheet">` for the package's CSS, derived from the JS module URL.
 *
 * @param moduleUrl - The URL the calling JS module was loaded from (typically `import.meta.url`).
 *                    Must end in a `.mjs` filename for the derivation to work.
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

  // Only act when the JS itself was loaded from sanity-cdn.
  if (!isSanityCdnUrl(url)) return

  // The CLI runtime script (in newer studios) may have already injected this link.
  if (findExistingCssLink(packagePathSegment)) return

  // Replace the trailing /<file>.mjs[?...] with /index.css to derive the CSS URL.
  // The CSS lives at the same module-server base URL as the JS, just a different filename.
  const cssUrl = url.href.replace(/\/[^/]+\.mjs(\?.*)?$/, '/index.css')
  if (cssUrl === url.href) return // No .mjs suffix found — bail rather than guess.

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cssUrl
  document.head.appendChild(link)
}
