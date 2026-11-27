import {type Browser, type Page} from 'playwright'

import {EXPERIMENT} from '../constants'
import {AUTH_PROVIDERS} from '../mock-api/project'
import {getBenchTls} from '../mock-api/tls'
import {createSessionContext, launchBrowser} from '../runner/browser'
import {startSide} from '../runner/servers'
import {scenarioUrl} from '../runner/session/navigation'
import {loginReady} from '../scenarios/load'
import {scenarioFixture} from '../scenarios/types'
import {cdnFileForPath, MODULE_HOST_URL, serveModuleHost} from './moduleHost'

/**
 * The steps of a first visit, in the order a user meets them:
 *
 * - `login`: a cold load while logged out, until the login screen is clickable and quiet.
 * - `afterLogin`: back from the login provider, with the login screen's files in the HTTP
 *   cache, until the structure tool lists its items and the page is quiet.
 * - `authenticated`: a cold load with a stored token (a reload, a return visit).
 */
export type StepName = 'login' | 'afterLogin' | 'authenticated'

export const STEP_NAMES: StepName[] = ['login', 'afterLogin', 'authenticated']

export const STEP_LABELS: Record<StepName, string> = {
  login: '1. Login screen (logged out, cold)',
  afterLogin: '2a. Back from login (on top of step 1)',
  authenticated: '2b. Reload with valid auth (cold)',
}

export interface StepFiles {
  /** Module CDN files the page requested (`index.mjs`, `structure.mjs`, chunks, `index.css`). */
  cdn: string[]
  /** The studio build's own JS (`/static/*.js`). */
  studio: string[]
}

export interface StepsResult {
  steps: Partial<Record<StepName, StepFiles>>
  /** Steps that did not load cleanly, with why. */
  errors: string[]
}

const LOGIN_BUTTON_CSS = `a[href^="${AUTH_PROVIDERS.providers[0].url}"]`
const TOOL_VISIBLE_CSS = '[data-testid^="pane-item-"]'

/** No new request for this long after the milestone counts as quiet. */
const QUIET_MS = 3000
const QUIET_CAP_MS = 30_000
const MILESTONE_TIMEOUT_MS = 90_000
const RESOURCE_BUFFER_SCRIPT = 'performance.setResourceTimingBufferSize(100000)'

async function requestedFiles(page: Page, studioOrigin: string): Promise<StepFiles> {
  const urls = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => entry.name),
  )
  const cdn = new Set<string>()
  const studio = new Set<string>()
  for (const href of urls) {
    const url = new URL(href)
    if (url.origin === MODULE_HOST_URL) {
      const file = cdnFileForPath(url.pathname)
      if (file) cdn.add(file)
    } else if (url.origin === studioOrigin && /^\/static\/.+\.m?js$/.test(url.pathname)) {
      studio.add(url.pathname.slice(1))
    }
  }
  return {cdn: [...cdn].toSorted(), studio: [...studio].toSorted()}
}

async function collectStep(page: Page, studioOrigin: string, selector: string): Promise<StepFiles> {
  await page.locator(selector).first().waitFor({state: 'visible', timeout: MILESTONE_TIMEOUT_MS})
  const deadline = Date.now() + QUIET_CAP_MS
  const count = async () => {
    const files = await requestedFiles(page, studioOrigin)
    return files.cdn.length + files.studio.length
  }
  let last = await count()
  let quietSince = Date.now()
  while (Date.now() - quietSince < QUIET_MS && Date.now() < deadline) {
    await page.waitForTimeout(250)
    const next = await count()
    if (next !== last) {
      last = next
      quietSince = Date.now()
    }
  }
  return requestedFiles(page, studioOrigin)
}

function assertClean(session: {violations: string[]; pageErrors: string[]}): void {
  const problems = [...session.violations, ...session.pageErrors]
  if (problems.length > 0) {
    throw new Error(`The studio did not load cleanly:\n${problems.join('\n')}`)
  }
}

/**
 * Which module CDN files an auto-updating studio requests at each step, served from `cdnDir`
 * by a local module host, with the studio build in `studioDir` (built with
 * SANITY_BENCH_AUTO_UPDATES=true and SANITY_MODULES_HOST pointing at the host).
 */
export async function measureSteps(options: {
  studioDir: string
  cdnDir: string
  browser?: Browser
}): Promise<StepsResult> {
  const tls = await getBenchTls()
  const host = await serveModuleHost({dir: options.cdnDir, tls})
  try {
    const running = await startSide(EXPERIMENT, options.studioDir)
    try {
      const browser = options.browser ?? (await launchBrowser(true, tls.spki))
      try {
        const studioOrigin = new URL(running.studioUrl).origin
        const url = scenarioUrl(running.studioUrl, loginReady)
        running.mock.hub.closeAll()
        running.mock.store.reset()
        running.mock.ledger.reset()
        running.mock.store.seed(scenarioFixture(loginReady))

        const result: StepsResult = {steps: {}, errors: []}
        const loggedOut = await createSessionContext(browser, running.side, running.studioUrl, {
          auth: 'logged-out',
        })
        running.mock.setRequireToken(true)
        try {
          await loggedOut.context.addInitScript(RESOURCE_BUFFER_SCRIPT)
          await loggedOut.page.goto(url, {waitUntil: 'domcontentloaded'})
          const login = await collectStep(loggedOut.page, studioOrigin, LOGIN_BUTTON_CSS)
          assertClean(loggedOut)
          result.steps.login = login
          await loggedOut.page.locator(LOGIN_BUTTON_CSS).first().click()
          const afterLogin = await collectStep(loggedOut.page, studioOrigin, TOOL_VISIBLE_CSS)
          assertClean(loggedOut)
          result.steps.afterLogin = afterLogin
        } catch (error) {
          result.errors.push(
            `logged out: ${error instanceof Error ? error.message : String(error)}`,
          )
        } finally {
          running.mock.setRequireToken(false)
          await loggedOut.context.close()
        }

        const signedIn = await createSessionContext(browser, running.side, running.studioUrl)
        try {
          await signedIn.context.addInitScript(RESOURCE_BUFFER_SCRIPT)
          await signedIn.page.goto(url, {waitUntil: 'domcontentloaded'})
          const authenticated = await collectStep(signedIn.page, studioOrigin, TOOL_VISIBLE_CSS)
          assertClean(signedIn)
          result.steps.authenticated = authenticated
        } catch (error) {
          result.errors.push(
            `authenticated: ${error instanceof Error ? error.message : String(error)}`,
          )
        } finally {
          await signedIn.context.close()
        }
        return result
      } finally {
        if (!options.browser) await browser.close()
      }
    } finally {
      await running.close()
    }
  } finally {
    await host.close()
  }
}
