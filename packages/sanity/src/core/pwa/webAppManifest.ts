import startCase from 'lodash-es/startCase.js'

import {type WebAppManifest, type WebAppManifestIcon} from './types'

/**
 * Name used for an installed studio that never configured a workspace `title`.
 *
 * @internal
 */
export const DEFAULT_WEB_APP_NAME = 'Sanity Studio'

/**
 * Display modes a Chromium browser accepts as installable. Anything else (`browser`, or an
 * unknown value) means the document is asking to stay in a browser tab.
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable}
 */
const INSTALLABLE_DISPLAY_MODES = new Set([
  'fullscreen',
  'minimal-ui',
  'standalone',
  'window-controls-overlay',
])

/**
 * Chromium requires both a 192px and a 512px icon. A vector icon declared with `sizes="any"`
 * satisfies both.
 */
const REQUIRED_ICON_SIZES = [192, 512]

function toSegments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

/**
 * The scope of the installed app: the shallowest directory containing every workspace, so that
 * navigating between workspaces (and to any studio route) stays inside the installed window.
 *
 * A studio mounted at the origin root scopes to `/`; one mounted at `/studio` scopes to
 * `/studio/`; sibling workspaces at `/studio/prod` and `/studio/staging` share `/studio/`.
 *
 * @internal
 */
export function resolveWebAppScopePath(workspaceBasePaths: string[]): string {
  const segmentLists = workspaceBasePaths.map(toSegments)
  const [first = []] = segmentLists
  const shared: string[] = []

  for (const [index, segment] of first.entries()) {
    if (!segmentLists.every((segments) => segments[index] === segment)) break
    shared.push(segment)
  }

  return shared.length > 0 ? `/${shared.join('/')}/` : '/'
}

/**
 * `start_url` must resolve inside `scope`, and scope matching is a plain prefix comparison. A
 * trailing slash keeps a single-workspace studio mounted at `/studio` (scope `/studio/`) inside
 * its own scope. The workspace matcher accepts the trailing slash — its base path regex ends in
 * `(\/|$)`.
 *
 * @internal
 */
export function resolveWebAppStartPath(workspaceBasePath: string): string {
  return workspaceBasePath.endsWith('/') ? workspaceBasePath : `${workspaceBasePath}/`
}

/**
 * The name to install the studio under.
 *
 * `WorkspaceSummary.title` falls back to the start-cased workspace name, so a studio that
 * configured neither would install as "Default". Fall back to the product name for those, and use
 * the workspace title whenever it carries information (a configured title, or a named workspace in
 * a multi-workspace studio).
 *
 * @internal
 */
export function resolveWebAppName(
  workspace: {name: string; title: string},
  options: {workspaceCount: number},
): string {
  const titleIsDerivedFromName = workspace.title === startCase(workspace.name)

  if (titleIsDerivedFromName && options.workspaceCount < 2) {
    return DEFAULT_WEB_APP_NAME
  }

  return workspace.title
}

/**
 * Resolves every URL member of a manifest against the URL the manifest itself was served from.
 *
 * Relative URLs in a manifest resolve against the manifest's own URL, which is impossible for the
 * `data:` URL the studio serves its manifest as. Absolutising up front keeps icons pointing at the
 * files the host document declared.
 *
 * @internal
 */
export function absolutizeWebAppManifestUrls(
  manifest: WebAppManifest,
  manifestUrl: string,
): WebAppManifest {
  const resolve = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    try {
      return new URL(value, manifestUrl).href
    } catch {
      return undefined
    }
  }

  const absolutized: WebAppManifest = {...manifest}

  for (const member of ['start_url', 'scope', 'id'] as const) {
    const resolved = resolve(manifest[member])
    if (resolved) absolutized[member] = resolved
  }

  if (Array.isArray(manifest.icons)) {
    absolutized.icons = manifest.icons.flatMap((icon) => {
      const src = resolve(icon?.src)
      return src ? [{...icon, src}] : []
    })
  }

  return absolutized
}

function parseIconSizes(sizes: string | undefined): {any: boolean; pixels: number[]} {
  if (!sizes) return {any: false, pixels: []}

  const tokens = sizes.toLowerCase().split(/\s+/).filter(Boolean)

  return {
    any: tokens.includes('any'),
    pixels: tokens.flatMap((token) => {
      const [width, height] = token.split('x')
      const size = Number(width)
      return width === height && Number.isFinite(size) ? [size] : []
    }),
  }
}

/**
 * Whether a manifest already satisfies the members Chromium requires to offer an install. Used to
 * decide whether the studio should take the document's manifest over: a host document that already
 * declares an installable manifest is left alone.
 *
 * @internal
 */
export function isInstallableWebAppManifest(manifest: WebAppManifest): boolean {
  const hasName = typeof manifest.name === 'string' || typeof manifest.short_name === 'string'
  const hasStartUrl = typeof manifest.start_url === 'string' && manifest.start_url !== ''
  const hasDisplay =
    (typeof manifest.display === 'string' && INSTALLABLE_DISPLAY_MODES.has(manifest.display)) ||
    (Array.isArray(manifest.display_override) &&
      manifest.display_override.some(
        (mode) => typeof mode === 'string' && INSTALLABLE_DISPLAY_MODES.has(mode),
      ))

  const icons = Array.isArray(manifest.icons) ? manifest.icons : []
  const hasIcons = REQUIRED_ICON_SIZES.every((required) =>
    icons.some((icon) => {
      if (icon?.purpose && !icon.purpose.split(/\s+/).includes('any')) return false
      const {any, pixels} = parseIconSizes(icon?.sizes)
      return any || pixels.some((size) => size >= required)
    }),
  )

  return (
    hasName &&
    hasStartUrl &&
    hasDisplay &&
    hasIcons &&
    manifest.prefer_related_applications !== true
  )
}

/** @internal */
export interface CreateWebAppManifestOptions {
  /** Icons to advertise, already absolute. */
  icons: WebAppManifestIcon[]
  /** Colour of the studio background, used for the splash screen and window chrome. */
  themeColor?: string
  /** Name to install the studio under. */
  name: string
  /** Absolute origin the studio is served from, eg `https://acme.sanity.studio`. */
  origin: string
  /** Path of the scope the installed app captures, eg `/` or `/studio/`. */
  scopePath: string
  /** Path the installed app opens at, eg `/` or `/production/`. */
  startPath: string
}

/**
 * Builds the manifest for the active workspace.
 *
 * @internal
 */
export function createWebAppManifest(options: CreateWebAppManifestOptions): WebAppManifest {
  const {icons, name, origin, scopePath, startPath, themeColor} = options

  return {
    // An explicit `id` keeps the installed app stable if `start_url` ever changes, and makes each
    // workspace of a multi-workspace studio installable as its own app.
    id: new URL(startPath, origin).href,
    name,
    short_name: name,
    start_url: new URL(startPath, origin).href,
    scope: new URL(scopePath, origin).href,
    // The studio has no in-app back control, but standalone windows still expose history
    // navigation through the window menu and the platform's back gesture/shortcut.
    display: 'standalone',
    ...(themeColor ? {background_color: themeColor, theme_color: themeColor} : {}),
    icons,
  }
}

/**
 * Merges the studio's manifest with the one the host document declared. Members the host set win,
 * so a studio that authored its own `static/manifest.webmanifest` keeps its name, icons and
 * colours while still gaining the members it was missing.
 *
 * @internal
 */
export function mergeWebAppManifest(
  studioManifest: WebAppManifest,
  hostManifest: WebAppManifest | undefined,
): WebAppManifest {
  if (!hostManifest) return studioManifest

  const defined = Object.fromEntries(
    Object.entries(hostManifest).filter(([, value]) => {
      if (value === undefined || value === null) return false
      return !Array.isArray(value) || value.length > 0
    }),
  )

  return {...studioManifest, ...defined}
}

/**
 * Serialises a manifest as a `data:` URL so it can be rendered declaratively as
 * `<link rel="manifest" href={…}>` — no build step, and the manifest can describe the workspace
 * that is actually active.
 *
 * @internal
 */
export function toWebAppManifestDataUrl(manifest: WebAppManifest): string {
  return `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`
}
