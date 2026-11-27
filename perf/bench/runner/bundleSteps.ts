import * as fs from 'node:fs'
import path from 'node:path'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'

import {type Browser, type Page} from 'playwright'

import {LOGIN_BUTTON_CSS, loginReady, TOOL_VISIBLE_CSS} from '../scenarios/load'
import {scenarioFixture} from '../scenarios/types'
import {createSessionContext} from './browser'
import {type RunningSide} from './servers'
import {scenarioUrl} from './session/navigation'

const gzip = promisify(zlib.gzip)
const brotli = promisify(zlib.brotliCompress)

/**
 * The steps whose JS this measures, in the order a user meets them:
 *
 * - `login`: a cold load while logged out, until the login screen is
 *   clickable and the page goes quiet.
 * - `afterLogin`: the login click redirects back with a session id, the page
 *   boots again with the login screen's chunks in the HTTP cache, until the
 *   structure tool lists its items and the page goes quiet. `new` is what
 *   this step downloads on top of `login`.
 * - `authenticated`: a cold load with a stored token (a reload, or a return
 *   visit), until the structure tool lists its items and the page goes quiet.
 */
export type BundleStepName = 'login' | 'afterLogin' | 'authenticated'

export interface CompressedSize {
  raw: number
  gzip: number
  brotli: number
}

export interface BundleStepResult {
  /** JS chunks the step's page requested before it went quiet, sorted. */
  paths: string[]
  /** The subset requested by the time the step's milestone was reached. */
  milestonePaths: string[]
  /** Sizes of `paths`. */
  total: CompressedSize
  /** Sizes of `milestonePaths`. */
  milestone: CompressedSize
  /**
   * Sizes of the paths the `login` step had not requested: what returning
   * from the login provider downloads on top of the login screen.
   */
  new?: CompressedSize
}

export type BundleStepsReport = Record<BundleStepName, BundleStepResult>

/** No new JS request for this long after the milestone counts as quiet. */
const QUIET_MS = 3000
/** Give up waiting for quiet after this long (lazy chunks keep trickling in). */
const QUIET_CAP_MS = 30_000
const MILESTONE_TIMEOUT_MS = 90_000

const JS_PATH = /^\/static\/.+\.m?js$/

/** The page's resource timing buffer holds 250 entries by default; a studio fetches more chunks. */
const RESOURCE_BUFFER_SCRIPT = 'performance.setResourceTimingBufferSize(100000)'

/**
 * Exact compressed sizes of a set of chunks, read from the dist the static
 * server serves (gzip and brotli at Node's default levels: gzip 6, brotli 11).
 */
export async function measurePaths(
  distDir: string,
  paths: Iterable<string>,
  cache = new Map<string, CompressedSize>(),
): Promise<CompressedSize> {
  const sum: CompressedSize = {raw: 0, gzip: 0, brotli: 0}
  for (const chunkPath of paths) {
    let size = cache.get(chunkPath)
    if (!size) {
      const contents = await fs.promises.readFile(path.join(distDir, chunkPath))
      size = {
        raw: contents.byteLength,
        gzip: (await gzip(contents)).byteLength,
        brotli: (await brotli(contents)).byteLength,
      }
      cache.set(chunkPath, size)
    }
    sum.raw += size.raw
    sum.gzip += size.gzip
    sum.brotli += size.brotli
  }
  return sum
}

interface JsResource {
  path: string
  /** `performance.now()` of the page when the request started. */
  startTime: number
}

async function jsResources(page: Page, studioOrigin: string): Promise<JsResource[]> {
  const entries = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => ({url: entry.name, startTime: entry.startTime})),
  )
  const resources: JsResource[] = []
  for (const entry of entries) {
    const url = new URL(entry.url)
    if (url.origin === studioOrigin && JS_PATH.test(url.pathname)) {
      resources.push({path: url.pathname, startTime: entry.startTime})
    }
  }
  return resources
}

/**
 * Wait for `selector` (the step's milestone), then until no new JS request
 * has started for QUIET_MS, and split what the page requested into before
 * and after the milestone.
 */
async function collectStep(
  page: Page,
  studioOrigin: string,
  selector: string,
): Promise<{paths: string[]; milestonePaths: string[]}> {
  await page.locator(selector).first().waitFor({state: 'visible', timeout: MILESTONE_TIMEOUT_MS})
  const milestoneAt = await page.evaluate(() => performance.now())

  const deadline = Date.now() + QUIET_CAP_MS
  let count = (await jsResources(page, studioOrigin)).length
  let quietSince = Date.now()
  while (Date.now() - quietSince < QUIET_MS && Date.now() < deadline) {
    await page.waitForTimeout(250)
    const next = (await jsResources(page, studioOrigin)).length
    if (next !== count) {
      count = next
      quietSince = Date.now()
    }
  }

  const resources = await jsResources(page, studioOrigin)
  return {
    paths: [...new Set(resources.map((resource) => resource.path))].sort(),
    milestonePaths: [
      ...new Set(
        resources
          .filter((resource) => resource.startTime <= milestoneAt)
          .map((resource) => resource.path),
      ),
    ].sort(),
  }
}

/**
 * Which JS chunks the studio requests at each step of a first visit (see
 * BundleStepName), against the bench mock, and their exact sizes. The chunk
 * sets are deterministic for a build, so one pass per step is enough.
 */
export async function measureBundleSteps(options: {
  browser: Browser
  running: RunningSide
  distDir: string
}): Promise<BundleStepsReport> {
  const {browser, running, distDir} = options
  const studioOrigin = new URL(running.studioUrl).origin
  const url = scenarioUrl(running.studioUrl, loginReady)
  const cache = new Map<string, CompressedSize>()

  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenarioFixture(loginReady))

  const loggedOut = await createSessionContext(browser, running.side, running.studioUrl, {
    auth: 'logged-out',
  })
  running.mock.setRequireToken(true)
  let login: {paths: string[]; milestonePaths: string[]}
  let afterLogin: {paths: string[]; milestonePaths: string[]}
  try {
    await loggedOut.context.addInitScript(RESOURCE_BUFFER_SCRIPT)
    await loggedOut.page.goto(url, {waitUntil: 'domcontentloaded'})
    login = await collectStep(loggedOut.page, studioOrigin, LOGIN_BUTTON_CSS)
    await loggedOut.page.locator(LOGIN_BUTTON_CSS).first().click()
    afterLogin = await collectStep(loggedOut.page, studioOrigin, TOOL_VISIBLE_CSS)
    assertHermetic(loggedOut)
  } finally {
    running.mock.setRequireToken(false)
    await loggedOut.context.close()
  }

  const signedIn = await createSessionContext(browser, running.side, running.studioUrl)
  let authenticated: {paths: string[]; milestonePaths: string[]}
  try {
    await signedIn.context.addInitScript(RESOURCE_BUFFER_SCRIPT)
    await signedIn.page.goto(url, {waitUntil: 'domcontentloaded'})
    authenticated = await collectStep(signedIn.page, studioOrigin, TOOL_VISIBLE_CSS)
    assertHermetic(signedIn)
  } finally {
    await signedIn.context.close()
  }

  const loginPaths = new Set(login.paths)
  const result = async (step: {
    paths: string[]
    milestonePaths: string[]
  }): Promise<BundleStepResult> => ({
    ...step,
    total: await measurePaths(distDir, step.paths, cache),
    milestone: await measurePaths(distDir, step.milestonePaths, cache),
  })

  return {
    login: await result(login),
    afterLogin: {
      ...(await result(afterLogin)),
      new: await measurePaths(
        distDir,
        afterLogin.paths.filter((chunkPath) => !loginPaths.has(chunkPath)),
        cache,
      ),
    },
    authenticated: await result(authenticated),
  }
}

function assertHermetic(session: {
  violations: string[]
  pageErrors: string[]
  consoleErrors: string[]
}): void {
  const problems = [...session.violations, ...session.pageErrors, ...session.consoleErrors]
  if (problems.length > 0) {
    throw new Error(`The studio did not load cleanly:\n${problems.join('\n')}`)
  }
}

const STEP_LABELS: Record<BundleStepName, string> = {
  login: '1. Login screen (logged out, cold)',
  afterLogin: '2a. Back from login (cache primed by step 1)',
  authenticated: '2b. Reload with valid auth (cold)',
}

const KB = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`

function compare(before: number, after: number): string {
  const diff = after - before
  if (before === 0) {
    return `${KB(before)} → ${KB(after)} (${after === 0 ? '+0.0%' : 'new'})`
  }
  const percent = (diff / before) * 100
  const sign = diff > 0 ? '+' : ''
  return `${KB(before)} → ${KB(after)} (${sign}${percent.toFixed(1)}%)`
}

interface Row {
  step: string
  kind: string
  size: CompressedSize
  chunks: number
}

function rows(report: BundleStepsReport): Row[] {
  const list: Row[] = []
  const loginPaths = new Set(report.login.paths)
  for (const step of Object.keys(STEP_LABELS) as BundleStepName[]) {
    const result = report[step]
    const label = STEP_LABELS[step]
    list.push({step: label, kind: 'until quiet', size: result.total, chunks: result.paths.length})
    list.push({
      step: label,
      kind: 'until milestone',
      size: result.milestone,
      chunks: result.milestonePaths.length,
    })
    if (result.new) {
      list.push({
        step: label,
        kind: 'new downloads',
        size: result.new,
        chunks: result.paths.filter((chunkPath) => !loginPaths.has(chunkPath)).length,
      })
    }
  }
  return list
}

/** A markdown table of a report, or of a before/after pair when `baseline` is given. */
export function formatBundleSteps(report: BundleStepsReport, baseline?: BundleStepsReport): string {
  const lines = [
    '| Step | JS | Chunks | Raw | Gzip | Brotli |',
    '| :--- | :--- | ---: | ---: | ---: | ---: |',
  ]
  const before = baseline ? rows(baseline) : undefined
  rows(report).forEach(({step, kind, size, chunks}, index) => {
    const previous = before?.[index]
    lines.push(
      previous
        ? `| ${step} | ${kind} | ${previous.chunks} → ${chunks} | ${compare(previous.size.raw, size.raw)} | ${compare(previous.size.gzip, size.gzip)} | ${compare(previous.size.brotli, size.brotli)} |`
        : `| ${step} | ${kind} | ${chunks} | ${KB(size.raw)} | ${KB(size.gzip)} | ${KB(size.brotli)} |`,
    )
  })
  return lines.join('\n')
}
