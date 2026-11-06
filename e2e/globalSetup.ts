import {
  type BrowserContextOptions,
  type BrowserType,
  chromium,
  firefox,
  type FullConfig,
  type FullProject,
  webkit,
} from '@playwright/test'

const INIT_TIMEOUT_MS = 120000
const FALLBACK_URL = 'http://localhost:3333/'

const BROWSER_TYPES = {chromium, firefox, webkit}

interface WarmupTarget {
  browserType: BrowserType
  baseURL: string
  contextOptions: BrowserContextOptions | undefined
}

function escapeRegExp(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Matches the way Playwright itself resolves `--project`: case insensitively,
 * with `*` as a wildcard.
 */
function matchesProjectName(pattern: string, name: string): boolean {
  const lowerPattern = pattern.toLocaleLowerCase()
  const lowerName = name.toLocaleLowerCase()

  if (!lowerPattern.includes('*')) {
    return lowerPattern === lowerName
  }

  return new RegExp(`^${lowerPattern.split('*').map(escapeRegExp).join('.*')}$`).test(lowerName)
}

/**
 * `--project` is variadic, so every following token that is not a flag is a
 * project name (`--project firefox`, `--project=firefox`, `--project a b`).
 */
function parseProjectFilter(argv: readonly string[]): string[] {
  const names: string[] = []
  let collecting = false

  for (const arg of argv) {
    if (arg.startsWith('--project=')) {
      names.push(arg.slice('--project='.length))
      collecting = false
    } else if (arg === '--project') {
      collecting = true
    } else if (arg.startsWith('-')) {
      collecting = false
    } else if (collecting) {
      names.push(arg)
    }
  }

  return names
}

function resolveProject(config: FullConfig, argv: readonly string[]): FullProject {
  const patterns = parseProjectFilter(argv)
  const selected = config.projects.find((project) =>
    patterns.some((pattern) => matchesProjectName(pattern, project.name)),
  )

  // Without a `--project` filter Playwright runs every project, starting with
  // the first one — so that is the one worth warming up.
  return selected ?? config.projects[0]
}

/**
 * Picks the browser and the studio workspace to warm up.
 *
 * Playwright passes global setup the full, *unfiltered* project list, so
 * `config.projects[0]` is Chromium even on a `--project firefox` run. Resolving
 * the selected project instead keeps the warm-up on the browser and the
 * workspace the specs actually use (each project has its own `basePath` and
 * dataset), and keeps CI shards down to a single browser download.
 */
export function resolveWarmupTarget(config: FullConfig, argv: readonly string[]): WarmupTarget {
  const project = resolveProject(config, argv)
  const {baseURL = FALLBACK_URL, browserName, defaultBrowserType, contextOptions} = project.use

  return {
    browserType: BROWSER_TYPES[browserName ?? defaultBrowserType ?? 'chromium'],
    baseURL,
    contextOptions,
  }
}

/**
 * Global setup for all end-to-end tests.
 * Because the development server can be ready to receive requests but has not
 * precompiled javascript, we want to wait here until the initial bundle is ready.
 *
 * This way, each test suite do not have the init penalty and have to deal with
 * the very different timeouts for the first and subsequent requests.
 *
 * @param config - The full Playwright configuration
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const {browserType, baseURL, contextOptions} = resolveWarmupTarget(config, process.argv)
  const browser = await browserType.launch()

  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()

  await Promise.all([
    // CI is slow to start, make sure we wait long enough
    page.waitForResponse('*/**/users/me*', {timeout: INIT_TIMEOUT_MS}),
    // This action triggers the request
    page.goto(baseURL, {timeout: INIT_TIMEOUT_MS}),
  ])

  await browser.close()
}
