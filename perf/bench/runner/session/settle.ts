import {type Browser} from 'playwright'

import {COMMIT_BUCKET_MS, type SettleEntries} from '../../instrumentation/settleShared'
import {type BenchEntries} from '../../instrumentation/types'
import {type BenchScenario} from '../../scenarios/types'
import {computeSettle, DEFAULT_SETTLE_WINDOW, type SettleWindowConfig} from '../../stats/settle'
import {createSessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {SessionError} from './errors'
import {DEFAULT_SESSION_CONFIG, HERMETICITY_HINT, readCpuMetrics} from './interaction'
import {awaitReadiness, gotoScenario} from './navigation'
import {foldLoafAttribution} from './pageLoad'

/**
 * Settle session: open the scenario, wait for readiness, then measure how
 * long the page takes to go quiet — and whether it ever does. No typing:
 * the mode targets the render-loop bug class (per-render observable
 * identity churn, react-rx v5), whose direct symptom is a page that never
 * reaches quiescence after opening a document. Staying read-only also
 * sidesteps the read-only-interruption machinery entirely.
 *
 * Activity signals, all on the page clock:
 * - React commit buckets from the settle-only init script
 *   (instrumentation/settle.ts) — the primary signal; a loop is one commit
 *   per iteration, visible even when each frame is cheap
 * - Long Animation Frames — expensive loops, with script attribution
 * - `bench:render:*` performance.measure marks emitted by instrumented
 *   workspace components — per-component attribution
 *
 * CPU (CDP TaskDuration) is sampled per poll and reported, but stays out of
 * the quiescence predicate: GC and background timers make it too noisy to
 * gate on (revisit after burn-in).
 *
 * Outcome semantics: "did not settle" and "never became ready" are RESULTS
 * (`settled: false` / `ready: false`), never SessionErrors — a genuine loop
 * must not be retried as a flake or trip the consecutive-failure abort.
 * Broken-scenario tripwires (console/page errors, hermeticity violations)
 * still throw.
 *
 * Limit: a FULLY synchronous infinite loop (one that never yields to the
 * event loop, unlike the react-rx class, which commits and yields thousands
 * of times per second) would stall the poll's page.evaluate — the CI job
 * timeout is the backstop for that theoretical case.
 *
 * Note on absolute numbers: the mock always emits `visibility:
 * 'transaction'`, which routes the preview store down its slow-fetch path —
 * settle time is a bench-internal trend number, not a UX claim.
 */

export interface SettleSessionConfig extends SettleWindowConfig {
  cpuThrottleRate: number
  /** Shorter than the interaction default: not-ready is a reported outcome here. */
  readinessTimeoutMs: number
  /** Poll cadence — also the granularity of settle time (gate floors must exceed it). */
  pollMs: number
}

export const DEFAULT_SETTLE_CONFIG: SettleSessionConfig = {
  cpuThrottleRate: DEFAULT_SESSION_CONFIG.cpuThrottleRate,
  readinessTimeoutMs: 30_000,
  pollMs: 500,
  ...DEFAULT_SETTLE_WINDOW,
}

export interface SettleSessionResult {
  /** The readiness selector matched within the timeout. */
  ready: boolean
  settled: boolean
  /** Readiness → last activity before the quiet window (settled sessions only). */
  settleTimeMs: number | null
  /**
   * React commits observed after readiness (the loop magnitude). For a
   * session that never became ready, counted from navigation start instead —
   * the activity that kept the pane from opening.
   */
  reactCommits: number
  /** Commits per second over the observed window. */
  commitsPerSecond: number
  /** False when the DevTools hook stub failed to attach (contract drift). */
  hookInstalled: boolean
  loafCount: number
  loafBlockingMs: number
  /** Main-thread task time between readiness and the verdict (CDP). */
  cpuAfterReadyMs: number | null
  /** Peak per-poll-window main-thread utilization (0–1+), report-only. */
  peakCpuUtilization: number | null
  /** Render-mark counts per `bench:render:<name>` component. */
  renderMarks: Record<string, number>
  loafAttribution: {sourceUrl: string; functionName: string; totalMs: number}[]
  /**
   * Per-poll activity samples after readiness (the session's shape over
   * time) — what the CLI charts as sparklines. Empty when never ready.
   */
  timeline: SettlePollSample[]
}

export interface SettlePollSample {
  /** End of this poll window, ms since readiness. */
  atMs: number
  /** React commits per second over this window. */
  commitsPerSecond: number
  /** LoAF blocking ms observed in this window. */
  loafBlockingMs: number
  /** Main-thread utilization over this window (0–1+), null if CDP unavailable. */
  cpuUtilization: number | null
}

const RENDER_MARK_PREFIX = 'bench:render:'

interface PolledEntries {
  now: number
  entries: BenchEntries
  settle: SettleEntries
}

export async function runSettleSession(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  settleInstrumentation: string
  config?: Partial<SettleSessionConfig>
}): Promise<SettleSessionResult> {
  const {browser, running, scenario, instrumentation, settleInstrumentation} = options
  const config = {...DEFAULT_SETTLE_CONFIG, ...options.config}

  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenario.fixture())

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context, page} = session

  // Accumulators shared by the ready and not-ready paths.
  let loafCount = 0
  let loafBlockingMs = 0
  let reactCommits = 0
  let hookInstalled = false
  const renderMarks: Record<string, number> = {}
  const allLoafs: {scripts: {sourceUrl: string; functionName: string; duration: number}[]}[] = []

  const drainBoth = async (): Promise<PolledEntries> => {
    const polled = await page.evaluate(() => ({
      now: performance.now(),
      entries: window.__bench?.take() ?? null,
      settle: window.__benchSettle?.take() ?? null,
    }))
    const {now, entries, settle} = polled
    if (!entries) {
      throw new SessionError('page-error', 'instrumentation collector missing (window.__bench)')
    }
    if (!settle) {
      throw new SessionError('page-error', 'settle instrumentation missing (window.__benchSettle)')
    }
    return {now, entries, settle}
  }

  /**
   * Fold a drained poll into the accumulators; returns its activity
   * timestamps plus this window's own counts (for the timeline).
   */
  const accumulate = (
    polled: PolledEntries,
  ): {activity: number[]; commits: number; blockingMs: number} => {
    const activity: number[] = []
    let commits = 0
    let blockingMs = 0
    const {entries, settle} = polled
    hookInstalled = settle.hookInstalled
    for (const bucket of settle.commits) {
      reactCommits += bucket.count
      commits += bucket.count
      // Buckets record commits at their floor (up to COMMIT_BUCKET_MS before
      // the actual commit), which would let the quiet window be satisfied by
      // less true quiet than configured. Use the bucket END (capped at the
      // drain time) so quantization biases toward "not yet settled" instead.
      activity.push(Math.min(bucket.startTime + COMMIT_BUCKET_MS, polled.now))
    }
    for (const loaf of entries.loafs) {
      loafCount += 1
      loafBlockingMs += loaf.blockingDuration
      blockingMs += loaf.blockingDuration
      allLoafs.push({scripts: loaf.scripts})
      activity.push(loaf.startTime + loaf.duration)
    }
    for (const measure of entries.measures) {
      if (!measure.name.startsWith(RENDER_MARK_PREFIX)) continue
      const name = measure.name.slice(RENDER_MARK_PREFIX.length)
      renderMarks[name] = (renderMarks[name] ?? 0) + 1
      activity.push(measure.startTime)
    }
    return {activity, commits, blockingMs}
  }

  try {
    await page.addInitScript(settleInstrumentation)
    await page.addInitScript(instrumentation)
    await gotoScenario(page, running.studioUrl, scenario, config.readinessTimeoutMs)

    let ready = true
    try {
      await awaitReadiness(page, scenario, {timeoutMs: config.readinessTimeoutMs})
    } catch (error) {
      if (!(error instanceof SessionError) || error.reason !== 'readiness-timeout') throw error
      ready = false
    }

    let settled = false
    let settleTimeMs: number | null = null
    let observedMs = 0
    let cpuAfterReadyMs: number | null = null
    let peakCpuUtilization: number | null = null
    const timeline: SettlePollSample[] = []

    if (ready) {
      // Discard boot activity — settle measures what happens after readiness.
      const boot = await drainBoth()
      const readinessAt = boot.now
      let lastPollAt = boot.now
      let lastCpu = await readCpuMetrics(session.cdp)
      const cpuAtReady = lastCpu
      const activityTimestamps: number[] = []

      for (;;) {
        await page.waitForTimeout(config.pollMs)
        // Fail fast on tripwires instead of polling through a broken page.
        if (session.pageErrors.length > 0) {
          throw new SessionError('page-error', session.pageErrors.join('\n'))
        }
        const polled = await drainBoth()
        const poll = accumulate(polled)
        activityTimestamps.push(...poll.activity)

        const cpu = await readCpuMetrics(session.cdp)
        const windowMs = polled.now - lastPollAt
        let cpuUtilization: number | null = null
        if (cpu && lastCpu && windowMs > 0) {
          cpuUtilization = ((cpu.taskDuration - lastCpu.taskDuration) * 1000) / windowMs
          peakCpuUtilization = Math.max(peakCpuUtilization ?? 0, cpuUtilization)
        }
        timeline.push({
          atMs: polled.now - readinessAt,
          commitsPerSecond: windowMs > 0 ? (poll.commits * 1000) / windowMs : 0,
          loafBlockingMs: poll.blockingMs,
          cpuUtilization,
        })
        lastCpu = cpu
        lastPollAt = polled.now

        const verdict = computeSettle({
          activityTimestamps,
          readinessAt,
          nowMs: polled.now,
          config,
        })
        if (verdict.settled || verdict.timedOut) {
          settled = verdict.settled
          settleTimeMs = verdict.settleTimeMs
          observedMs = polled.now - readinessAt
          if (cpu && cpuAtReady) {
            cpuAfterReadyMs = (cpu.taskDuration - cpuAtReady.taskDuration) * 1000
          }
          break
        }
      }
    } else {
      // Never became ready — a hard loop can keep the pane from opening (the
      // customer symptom). Report the activity gathered during the wait; with
      // no readiness anchor there is no settle time.
      const polled = await drainBoth()
      accumulate(polled)
      observedMs = polled.now
    }

    if (session.violations.length > 0) {
      throw new SessionError(
        'hermeticity-violation',
        session.violations.join(', '),
        HERMETICITY_HINT,
      )
    }
    if (session.pageErrors.length > 0) {
      throw new SessionError('page-error', session.pageErrors.join('\n'))
    }
    // Past the tripwires: a not-ready outcome here is the loop symptom, not a
    // broken scenario — misconfigured workspaces/routes leave console errors
    // and threw above.
    if (session.consoleErrors.length > 0) {
      throw new SessionError('console-error', session.consoleErrors.join('\n'), session.httpErrors)
    }

    return {
      ready,
      settled,
      settleTimeMs,
      reactCommits,
      commitsPerSecond: observedMs > 0 ? (reactCommits * 1000) / observedMs : 0,
      hookInstalled,
      loafCount,
      loafBlockingMs,
      cpuAfterReadyMs,
      peakCpuUtilization,
      renderMarks,
      loafAttribution: foldLoafAttribution(allLoafs, 5),
      timeline,
    }
  } finally {
    await context.close()
  }
}
