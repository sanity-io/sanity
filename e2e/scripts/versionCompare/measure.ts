import {type Browser, type BrowserContextOptions} from '@playwright/test'

import {applyThrottle, type ThrottleProfile} from './throttle'

/**
 * What marks a page as ready, evaluated in the page on every DOM mutation. The first time it
 * holds, `performance.now()` is stored, which is measured from the start of the navigation, so
 * the page's own clock is the only one involved.
 *
 * The checks avoid anything specific to one major: a visible provider link on the login screen,
 * and a visible link inside the navbar's tool menu.
 */
const READY_PREDICATES = {
  login: `() => {
    const isVisible = (el) => el.getClientRects().length > 0
    const heading = [...document.querySelectorAll('h1, h2')].some((el) => /Choose login provider/.test(el.textContent))
    return heading && [...document.querySelectorAll('a[href*="/auth/"]')].some(isVisible)
  }`,
  tools: `() => {
    const menu = document.querySelector('[data-testid="tool-collapse-menu"]')
    return !!menu && [...menu.querySelectorAll('a[href]')].some((el) => el.getClientRects().length > 0 && el.textContent.trim() !== '')
  }`,
}

export type ReadyKind = keyof typeof READY_PREDICATES

function readyScript(kind: ReadyKind): string {
  return `(() => {
    const isReady = (${READY_PREDICATES[kind]})
    const check = () => {
      if (window.__readyAt === undefined && isReady()) window.__readyAt = performance.now()
    }
    new MutationObserver(check).observe(document, {attributes: true, childList: true, subtree: true})
    check()
  })()`
}

export interface Sample {
  /** Milliseconds from navigation start until the page was ready. */
  readyMs: number
  /** Request paths of every JS file loaded until then. */
  scriptPaths: string[]
}

export interface SampleOptions {
  kind: ReadyKind
  /** Seeds the studio's auth token the way the e2e suite does. */
  auth?: {projectId: string; token: string}
  browser: Browser
  path: string
  /** Network and CPU emulation applied before the navigation; none when omitted. */
  throttle?: ThrottleProfile
  timeoutMs?: number
  url: string
}

const JS_PATH = /\.m?js$/

/** Loads `path` in a fresh browser context (cold cache, no shared storage) and times it. */
export async function takeSample(options: SampleOptions): Promise<Sample> {
  const {auth, browser, kind, path, throttle, timeoutMs = 120_000, url} = options
  const contextOptions: BrowserContextOptions = {
    reducedMotion: 'reduce',
    viewport: {height: 1000, width: 1728},
  }
  if (auth) {
    contextOptions.storageState = {
      cookies: [],
      origins: [
        {
          localStorage: [
            {
              name: `__studio_auth_token_${auth.projectId}`,
              value: JSON.stringify({time: new Date().toISOString(), token: auth.token}),
            },
          ],
          origin: url,
        },
      ],
    }
  }

  const context = await browser.newContext(contextOptions)
  try {
    const page = await context.newPage()
    await applyThrottle(
      await context.newCDPSession(page),
      throttle ?? {cpuThrottle: 1, network: null},
    )
    const scriptPaths: string[] = []
    let collecting = true
    page.on('response', (response) => {
      const {origin, pathname} = new URL(response.url())
      // Only the studio's own files: the index page also loads a script from Sanity's CDN.
      if (collecting && origin === new URL(url).origin && JS_PATH.test(pathname)) {
        scriptPaths.push(pathname)
      }
    })
    await page.addInitScript(readyScript(kind))
    await page.goto(`${url}${path}`, {waitUntil: 'commit'})
    try {
      await page.waitForFunction(() => (window as {__readyAt?: number}).__readyAt !== undefined, {
        polling: 'raf',
        timeout: timeoutMs,
      })
    } catch (error) {
      const body = await page.evaluate(() => document.body?.innerText.slice(0, 300) ?? '')
      throw new Error(`The page never became ready (${kind}). Page text: ${JSON.stringify(body)}`, {
        cause: error,
      })
    }
    collecting = false
    const readyMs = await page.evaluate(() => (window as {__readyAt?: number}).__readyAt!)
    return {readyMs, scriptPaths}
  } finally {
    await context.close()
  }
}
