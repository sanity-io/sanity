import process from 'node:process'

import {type Browser, type Locator, type Page} from 'playwright'

import {type BenchEntries} from '../../instrumentation/types'
import {type BenchScenario, type InteractionTarget} from '../../scenarios/types'
import {median} from '../../stats/quantiles'
import {createSessionContext, type SessionContext} from '../browser'
import {type RunningSide} from '../servers'

/** Characters cycled through while typing (letters + digits only). */
export const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * The Event Timing API cannot observe interactions faster than this (spec
 * minimum durationThreshold). Keystrokes that produce no entry are recorded
 * at this floor value — "at or below the observability floor" — the same
 * rule on both sides, so comparisons stay fair (see README).
 */
export const OBSERVABILITY_FLOOR_MS = 16

export interface SessionConfig {
  warmupKeystrokes: number
  measuredKeystrokes: number
  /** Isolated-metric cadence — must exceed worst expected latency. */
  isolatedCadenceMs: number
  burstKeystrokes: number
  /** "Sustained typing" cadence (report-only secondary metric). */
  burstCadenceMs: number
  cpuThrottleRate: number
  readinessTimeoutMs: number
  /** Max wait for the mock's document to match everything typed. */
  readbackTimeoutMs: number
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  warmupKeystrokes: 8,
  measuredKeystrokes: 32,
  isolatedCadenceMs: 100,
  burstKeystrokes: 24,
  burstCadenceMs: 40,
  cpuThrottleRate: 4,
  readinessTimeoutMs: 60_000,
  readbackTimeoutMs: 20_000,
}

export interface FieldSamples {
  label: string
  /** Per-keystroke keydown→paint latencies (ms), isolated cadence. */
  samples: number[]
  /** Keystrokes that produced no Event Timing entry (faster than the floor). */
  belowFloorCount: number
  /** Latencies from the fast burst (report-only). */
  burstSamples: number[]
  burstBelowFloorCount: number
}

export interface ReadOnlyInterruptions {
  /**
   * Times the form transiently flipped read-only mid-typing and the session
   * paused until it recovered. Real studio behavior — editState re-inits
   * emit a `ready: false` SWR-cached state after commits (editState.ts
   * `ready: !fromCache` + publishReplay/refCount teardown), during which the
   * form silently swallows keystrokes. Tracked as its own regression metric.
   */
  count: number
  totalMs: number
}

/** Request-ledger totals for the whole session window (report-only). */
export interface SessionRequests {
  byClass: Record<string, {count: number; bytesIn: number; bytesOut: number}>
  total: number
}

/** Main-thread CPU-ms deltas over the measured fields (CDP Performance). */
export interface SessionCpu {
  taskMs: number
  scriptMs: number
  layoutMs: number
  styleMs: number
}

/** Post-GC memory snapshot at end of session (CDP, report-only). */
export interface SessionMemory {
  heapMb: number
  domNodes: number
  listeners: number
}

export interface InteractionSessionResult {
  fields: FieldSamples[]
  /** Time-to-first-editable-field (ms from navigation start), if captured. */
  timeToEditableMs: number | null
  readOnlyInterruptions: ReadOnlyInterruptions
  /** Total LoAF blocking time during the measured windows. */
  blockingMs: number
  /** Top blocking-script attributions across the session. */
  loafAttribution: {sourceUrl: string; functionName: string; totalMs: number}[]
  requests: SessionRequests
  cpu: SessionCpu | null
  memory: SessionMemory | null
}

export type SessionFailureReason =
  | 'readiness-timeout'
  | 'probe-timeout'
  | 'page-error'
  | 'console-error'
  | 'hermeticity-violation'
  | 'sample-count-mismatch'
  | 'readback-mismatch'
  | 'unexpected-endpoint'

export class SessionError extends Error {
  constructor(
    public reason: SessionFailureReason,
    message: string,
    public diagnostics: string[] = [],
  ) {
    super(`[${reason}] ${message}`)
    this.name = 'SessionError'
  }
}

/**
 * How-to-resolve instructions attached as diagnostics to the two failure
 * reasons a product PR can cause by adding a request. Printed with every
 * retry so the developer (or agent) reading the log gets the fix, not just
 * the symptom.
 */
export const UNEXPECTED_ENDPOINT_HINT = [
  'The studio called an API endpoint the bench mock does not implement (mock drift).',
  'Fix in the same PR that adds the request: implement the endpoint in perf/bench/mock-api/createServer.ts,',
  'or, if the studio degrades gracefully when it 404s, allowlist it in UNIMPLEMENTED_BUT_GRACEFUL in perf/bench/mock-api/ledger.ts.',
  'Verify with: pnpm build:bench && pnpm bench:test -- --scenario singleString --sessions 2',
]

export const HERMETICITY_HINT = [
  'The page contacted a non-local host the bench does not recognize.',
  'Fix in the same PR that adds the request: in perf/bench/runner/browser.ts, either add the host to',
  'SILENCED_EXTERNAL (safe to abort) or synthesize a response with route.fulfill (response affects behavior).',
  'Verify with: pnpm build:bench && pnpm bench:test -- --scenario singleString --sessions 2',
]

export async function drainEntries(page: Page): Promise<BenchEntries> {
  // Two rAFs so trailing presentation work is attributed, then drain
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
  await page.waitForTimeout(200)
  const entries = await page.evaluate(() => window.__bench?.take() ?? null)
  if (!entries) {
    throw new SessionError('page-error', 'instrumentation collector missing (window.__bench)')
  }
  return entries
}

/**
 * Group Event Timing entries into per-interaction latencies: several entries
 * (keydown/keyup, pointerdown/pointerup/click) share one interactionId, and
 * the interaction's latency is the max duration across them — the same rule
 * web-vitals INP uses. Entries with interactionId 0 aren't interactions.
 */
export function interactionMaxDurations(entries: BenchEntries): number[] {
  const byInteraction = new Map<number, number>()
  for (const event of entries.events) {
    if (event.interactionId > 0) {
      byInteraction.set(
        event.interactionId,
        Math.max(byInteraction.get(event.interactionId) ?? 0, event.duration),
      )
    }
  }
  return [...byInteraction.values()]
}

/**
 * Map Event Timing entries to per-keystroke latencies: group by
 * interactionId (keydown/keyup of one press share an id), take the max
 * duration per interaction, and account for unobservably fast keystrokes at
 * the floor (see OBSERVABILITY_FLOOR_MS).
 */
function toLatencies(
  entries: BenchEntries,
  sentKeystrokes: number,
): {samples: number[]; belowFloorCount: number} {
  const observed = interactionMaxDurations(entries)
  if (observed.length > sentKeystrokes) {
    throw new SessionError(
      'sample-count-mismatch',
      `observed ${observed.length} interactions for ${sentKeystrokes} keystrokes`,
    )
  }
  const belowFloorCount = sentKeystrokes - observed.length
  return {
    samples: observed.concat(Array(belowFloorCount).fill(OBSERVABILITY_FLOOR_MS)),
    belowFloorCount,
  }
}

function fieldInput(page: Page, target: InteractionTarget): Locator {
  if (target.kind === 'pte') {
    return page
      .locator(`[data-testid="field-${target.fieldPath}"] [contenteditable="true"]`)
      .first()
  }
  return page
    .locator(
      `[data-testid="field-${target.fieldPath}"] input[type="text"], ` +
        `[data-testid="field-${target.fieldPath}"] textarea`,
    )
    .first()
}

/**
 * Focus a field for typing. PTE renders its contenteditable only after the
 * field is activated by clicking it (dev/efps measureFpsForPte did the same
 * dance), so click the field root first, then the editable itself.
 */
export async function focusField(
  page: Page,
  target: InteractionTarget,
  timeout: number,
): Promise<Locator> {
  if (target.kind === 'pte') {
    const fieldRoot = page.locator(`[data-testid="field-${target.fieldPath}"]`)
    await fieldRoot.waitFor({state: 'visible', timeout})
    await fieldRoot.click()
  }
  const input = fieldInput(page, target)
  await input.waitFor({state: 'visible', timeout})
  await input.click()
  return input
}

/**
 * How many characters of `typed` are missing from `text` once the field's
 * pre-typing `baseline` content is accounted for — a multiset comparison
 * (order-insensitive, multiplicity-aware). The fixture text would otherwise
 * mask dropped keystrokes: it already contains most letters.
 */
function countMissingCharacters(text: string, baseline: string, typed: string): number {
  const available = new Map<string, number>()
  for (const character of text) {
    available.set(character, (available.get(character) ?? 0) + 1)
  }
  for (const character of baseline) {
    const remaining = available.get(character) ?? 0
    if (remaining > 0) {
      available.set(character, remaining - 1)
    }
  }
  let missing = 0
  for (const character of typed) {
    const remaining = available.get(character) ?? 0
    if (remaining > 0) {
      available.set(character, remaining - 1)
    } else {
      missing += 1
    }
  }
  return missing
}

/** Read a dot-separated path off a document. */
function getAtPath(doc: Record<string, unknown> | null, dottedPath: string): unknown {
  let value: unknown = doc
  for (const segment of dottedPath.split('.')) {
    if (value === null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[segment]
  }
  return value
}

// Note: evaluate callbacks below are single-expression arrows on purpose —
// tsx's esbuild transform injects `__name` helpers into multi-statement
// function bodies, which don't exist in the page scope.
const isFormReadOnly = () =>
  document.querySelector('[data-testid="form-view"]')?.getAttribute('data-read-only') === 'true'

export async function typeKeystrokes(
  page: Page,
  count: number,
  cadenceMs: number,
  offset: number,
  interruptions: ReadOnlyInterruptions,
): Promise<string> {
  let typed = ''
  for (let i = 0; i < count; i++) {
    // The form transiently flips read-only after commits and silently
    // swallows keystrokes while it lasts (see ReadOnlyInterruptions). Pause
    // rather than type into the void — the wait is not keystroke latency.
    // (The pre-keystroke check happens before keydown, so it never inflates
    // the measured interaction; its cost is symmetric on both sides.)
    if (await page.evaluate(isFormReadOnly)) {
      const waitStart = Date.now()
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="form-view"]')?.getAttribute('data-read-only') !==
          'true',
        undefined,
        {timeout: 30_000, polling: 50},
      )
      interruptions.count += 1
      interruptions.totalMs += Date.now() - waitStart
    }
    const character = CHARACTERS[(offset + i) % CHARACTERS.length]
    await page.keyboard.press(character)
    typed += character
    await page.waitForTimeout(cadenceMs)
  }
  return typed
}

/**
 * One interaction session: boot the studio to an editable form, then for
 * every measured field of the scenario (one page load amortized across
 * fields): warmup → isolated-cadence measured burst → fast burst. All
 * timing comes from the in-page Event Timing observer; the runner only
 * orchestrates. See the README for the full lifecycle contract.
 */
export async function runInteractionSession(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  config?: Partial<SessionConfig>
}): Promise<InteractionSessionResult> {
  const {browser, running, scenario, instrumentation} = options
  const config = {
    ...DEFAULT_SESSION_CONFIG,
    ...options.config,
    // Scenario keystroke overrides (see BenchScenario.keystrokes) — applied
    // after caller config so a scenario's counts always win on both sides
    ...(scenario.keystrokes?.warmup !== undefined && {
      warmupKeystrokes: scenario.keystrokes.warmup,
    }),
    ...(scenario.keystrokes?.measured !== undefined && {
      measuredKeystrokes: scenario.keystrokes.measured,
    }),
    ...(scenario.keystrokes?.burst !== undefined && {
      burstKeystrokes: scenario.keystrokes.burst,
    }),
  }
  const draftId = `drafts.${scenario.documentId}`

  // Fresh state, in-process — no HTTP round-trips to our own mock
  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenario.fixture())

  // Pre-typing field text, needed by the Portable Text readback (typed
  // characters are validated as a delta over the seeded content)
  const seededDocument = running.mock.store.get(draftId)
  const baselineTexts = new Map<string, string>()
  for (const target of scenario.interactions) {
    if (target.kind === 'pte') {
      baselineTexts.set(
        target.fieldPath,
        target.readbackText?.(seededDocument ?? {_id: draftId, _type: scenario.documentType}) ??
          String(getAtPath(seededDocument, target.fieldPath) ?? ''),
      )
    }
  }

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context, page} = session

  try {
    await page.addInitScript(instrumentation)

    await page.goto(
      `${running.studioUrl}/${scenario.workspace ?? scenario.name}/intent/edit/id=${encodeURIComponent(scenario.documentId)};type=${encodeURIComponent(scenario.documentType)}`,
      {waitUntil: 'domcontentloaded', timeout: config.readinessTimeoutMs},
    )

    // Readiness: the form claims to be editable…
    await page
      .locator('[data-testid="form-view"]:not([data-read-only="true"])')
      .waitFor({state: 'visible', timeout: config.readinessTimeoutMs})
      .catch(() => {
        throw new SessionError('readiness-timeout', 'form-view never became editable', [
          ...session.consoleErrors,
          ...session.pageErrors,
        ])
      })

    // …and a probe keystroke actually lands (the editability oracle). The
    // time-to-editable measure is emitted from inside the page on the input event, so
    // it's on the page clock with no polling slack. Fields may start with
    // content, so "landed" means the value grew past its initial length.
    const firstField = scenario.interactions[0]
    const probeTarget = await focusField(page, firstField, config.readinessTimeoutMs)
    const initialLength = await probeTarget.evaluate(
      (el) =>
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
          ? el.value
          : (el.textContent ?? '')
        ).length,
    )
    await probeTarget.evaluate((el) => {
      el.addEventListener('input', () => performance.measure('bench:time-to-editable'), {
        once: true,
      })
    })
    // Deliberately outside CHARACTERS: the probe stays in the document but is
    // excluded from the typed run, so a probe from the typing alphabet would
    // hand the multiset readback one spare character that masks exactly one
    // dropped keystroke of the same letter
    const probeChar = '~'
    await page.keyboard.press(probeChar)
    await page
      .waitForFunction(
        ({selectorInfo, minLength}) => {
          const field = document.querySelector(selectorInfo)
          if (!field) return false
          const input = field.querySelector(
            'input[type="text"], textarea, [contenteditable="true"]',
          )
          const value =
            input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement
              ? input.value
              : (input?.textContent ?? '')
          return value.length > minLength
        },
        {selectorInfo: `[data-testid="field-${firstField.fieldPath}"]`, minLength: initialLength},
        {timeout: 15_000},
      )
      .catch(() => {
        throw new SessionError('probe-timeout', 'probe keystroke never landed', [
          ...session.consoleErrors,
          ...session.pageErrors,
        ])
      })

    // Boot noise (and the time-to-editable measure) drained here
    const bootEntries = await drainEntries(page)
    const timeToEditableMs =
      bootEntries.measures.find((measure) => measure.name === 'bench:time-to-editable')?.duration ??
      null

    // CPU counters: cumulative main-thread task-time deltas across the
    // measured fields (report-only resources bucket)
    const cpuStart = await readCpuMetrics(session.cdp)

    const fields: FieldSamples[] = []
    let blockingMs = 0
    const attribution = new Map<
      string,
      {sourceUrl: string; functionName: string; totalMs: number}
    >()
    const interruptions: ReadOnlyInterruptions = {count: 0, totalMs: 0}
    const typedPerField = new Map<string, string>()
    let characterOffset = 0 // the probe char is not from CHARACTERS

    for (const target of scenario.interactions) {
      // Fast-fail: a page that already threw or logged an error will fail
      // the session-level invariants at the end anyway — don't spend the
      // remaining fields' typing time (~2 minutes per retry) to find out
      if (session.pageErrors.length > 0) {
        throw new SessionError('page-error', session.pageErrors.join('\n'))
      }
      if (session.consoleErrors.length > 0) {
        throw new SessionError(
          'console-error',
          session.consoleErrors.join('\n'),
          session.httpErrors,
        )
      }

      await focusField(page, target, 30_000)

      // Warmup — typed, then discarded
      const warmupTyped = await typeKeystrokes(
        page,
        config.warmupKeystrokes,
        config.isolatedCadenceMs,
        characterOffset,
        interruptions,
      )
      characterOffset += config.warmupKeystrokes
      await drainEntries(page)

      // Isolated-cadence measured window
      const measuredTyped = await typeKeystrokes(
        page,
        config.measuredKeystrokes,
        config.isolatedCadenceMs,
        characterOffset,
        interruptions,
      )
      characterOffset += config.measuredKeystrokes
      const measuredEntries = await drainEntries(page)
      const isolated = toLatencies(measuredEntries, config.measuredKeystrokes)

      // Fast burst (sustained-typing secondary metric)
      const burstTyped = await typeKeystrokes(
        page,
        config.burstKeystrokes,
        config.burstCadenceMs,
        characterOffset,
        interruptions,
      )
      characterOffset += config.burstKeystrokes
      const burstEntries = await drainEntries(page)
      const burst = toLatencies(burstEntries, config.burstKeystrokes)

      // The warmup→measured→burst run is contiguous (no clicks in between),
      // so it must appear verbatim in the document. The probe char is
      // excluded: re-focusing the field afterwards may move the caret.
      typedPerField.set(target.fieldPath, `${warmupTyped}${measuredTyped}${burstTyped}`)

      for (const entries of [measuredEntries, burstEntries]) {
        for (const loaf of entries.loafs) {
          blockingMs += loaf.blockingDuration
          for (const script of loaf.scripts) {
            const key = `${script.sourceUrl}#${script.functionName}`
            const existing = attribution.get(key) ?? {
              sourceUrl: script.sourceUrl,
              functionName: script.functionName,
              totalMs: 0,
            }
            existing.totalMs += script.duration
            attribution.set(key, existing)
          }
        }
      }

      fields.push({
        label: target.label ?? target.fieldPath,
        samples: isolated.samples,
        belowFloorCount: isolated.belowFloorCount,
        burstSamples: burst.samples,
        burstBelowFloorCount: burst.belowFloorCount,
      })
    }

    // Readback: everything typed must reach the mock's copy of the document
    // (the commit path is debounced, so poll).
    // - Plain string/text fields: the warmup→measured→burst run is
    //   contiguous, so it must appear verbatim in the field's text
    //   (extracted via readbackText for non-plain-string shapes).
    // - Portable Text: re-renders/rebases on slow hosts can reset the caret
    //   mid-typing, scattering the typed run across blocks — contiguity
    //   cannot be asserted. The invariant that matters is convergence:
    //   every typed character must be present, and the editor's own text
    //   must equal the mock's extraction (local === server).
    const deadline = Date.now() + config.readbackTimeoutMs
    let lastMismatch = ''
    for (;;) {
      const document = running.mock.store.get(draftId)
      lastMismatch = ''
      for (const target of scenario.interactions) {
        const typed = typedPerField.get(target.fieldPath) ?? ''
        const text =
          target.readbackText?.(document ?? {_id: draftId, _type: scenario.documentType}) ??
          String(getAtPath(document, target.fieldPath) ?? '')
        if (target.kind === 'pte') {
          const missing = countMissingCharacters(
            text,
            baselineTexts.get(target.fieldPath) ?? '',
            typed,
          )
          if (missing > 0) {
            lastMismatch = `${target.fieldPath}: ${missing}/${typed.length} typed character(s) missing from the document text`
            break
          }
        } else if (!text.includes(typed)) {
          lastMismatch = `${target.fieldPath}: typed run "${typed.slice(0, 40)}…" not found in "${text.slice(0, 120)}"`
          break
        }
      }
      if (!lastMismatch) break
      if (Date.now() > deadline) {
        throw new SessionError('readback-mismatch', lastMismatch)
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    // Resources bucket (report-only): CPU deltas, post-GC memory, request
    // ledger totals for the whole session window
    const cpuEnd = await readCpuMetrics(session.cdp)
    const cpu =
      cpuStart && cpuEnd
        ? {
            taskMs: (cpuEnd.taskDuration - cpuStart.taskDuration) * 1000,
            scriptMs: (cpuEnd.scriptDuration - cpuStart.scriptDuration) * 1000,
            layoutMs: (cpuEnd.layoutDuration - cpuStart.layoutDuration) * 1000,
            styleMs: (cpuEnd.styleDuration - cpuStart.styleDuration) * 1000,
          }
        : null
    const memory = await readMemorySnapshot(session.cdp)

    // Session-level invariants
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
    if (session.consoleErrors.length > 0) {
      throw new SessionError('console-error', session.consoleErrors.join('\n'), session.httpErrors)
    }
    const ledgerSnapshot = running.mock.ledger.snapshot()
    if (ledgerSnapshot.unexpected.length > 0) {
      throw new SessionError(
        'unexpected-endpoint',
        ledgerSnapshot.unexpected.map((entry) => `${entry.method} ${entry.path}`).join(', '),
        UNEXPECTED_ENDPOINT_HINT,
      )
    }
    const requests: SessionRequests = {byClass: {}, total: ledgerSnapshot.entries.length}
    for (const entry of ledgerSnapshot.entries) {
      const bucket = (requests.byClass[entry.endpointClass] ??= {count: 0, bytesIn: 0, bytesOut: 0})
      bucket.count += 1
      bucket.bytesIn += entry.bytesIn
      bucket.bytesOut += entry.bytesOut
    }

    return {
      fields,
      timeToEditableMs,
      readOnlyInterruptions: interruptions,
      blockingMs,
      loafAttribution: [...attribution.values()].sort((a, b) => b.totalMs - a.totalMs).slice(0, 5),
      requests,
      cpu,
      memory,
    }
  } finally {
    await context.close()
  }
}

export interface SoakSample {
  minute: number
  heapMb: number
  domNodes: number
  listeners: number
  /** Median keystroke latency over the past interval (null before typing). */
  latencyP50Ms: number | null
  /** Main-thread task time spent during the past interval (null at minute 0). */
  cpuTaskMs: number | null
  /** Open listener connections on the mock — socket leaks across reconnects. */
  connections: number
  /** Requests the mock served during the past interval (minute 0 = boot). */
  requests: number
}

/**
 * Soak check: one long session typing continuously (bounded content —
 * each cycle types a burst then select-all-deletes), sampling every minute.
 * The workload is constant and self-erasing, so every series should be
 * flat: a rising heap/listener/DOM slope is a retention regression (a
 * leak), a rising latency/CPU slope is degradation under sustained use,
 * and a rising connection or request rate is a resubscribe loop. Runs in
 * the daily cron, not on PRs.
 */
export async function runSoakSession(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  minutes: number
  config?: Partial<SessionConfig>
  log?: (message: string) => void
}): Promise<{minutes: number; samples: SoakSample[]; interruptions: ReadOnlyInterruptions}> {
  const {browser, running, scenario, instrumentation, minutes} = options
  const config = {...DEFAULT_SESSION_CONFIG, ...options.config}
  const log = options.log ?? (() => {})

  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenario.fixture())

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context, page} = session

  try {
    await page.addInitScript(instrumentation)
    await page.goto(
      `${running.studioUrl}/${scenario.workspace ?? scenario.name}/intent/edit/id=${encodeURIComponent(scenario.documentId)};type=${encodeURIComponent(scenario.documentType)}`,
      {waitUntil: 'domcontentloaded', timeout: config.readinessTimeoutMs},
    )
    await page
      .locator('[data-testid="form-view"]:not([data-read-only="true"])')
      .waitFor({state: 'visible', timeout: config.readinessTimeoutMs})

    const target = scenario.interactions[0]
    await focusField(page, target, config.readinessTimeoutMs)
    // Flush boot + focus-click interaction entries so the first interval's
    // latency accounting starts clean
    await drainEntries(page)

    const samples: SoakSample[] = []
    // Per-interval accumulators, reset at every sample
    let intervalLatencies: number[] = []
    let lastCpu = await readCpuMetrics(session.cdp)
    let lastRequestCount = running.mock.ledger.snapshot().entries.length

    const takeSample = async (minute: number) => {
      const memory = await readMemorySnapshot(session.cdp)
      if (!memory) return
      const cpu = await readCpuMetrics(session.cdp)
      const cpuTaskMs =
        cpu && lastCpu ? Math.round((cpu.taskDuration - lastCpu.taskDuration) * 1000) : null
      lastCpu = cpu
      const requestCount = running.mock.ledger.snapshot().entries.length
      const requests = requestCount - lastRequestCount
      lastRequestCount = requestCount
      const latencyP50Ms = intervalLatencies.length > 0 ? median(intervalLatencies) : null
      intervalLatencies = []
      const connections = running.mock.hub.connectionCount
      samples.push({
        minute,
        ...memory,
        latencyP50Ms,
        cpuTaskMs,
        connections,
        requests,
      })
      log(
        `  minute ${minute}: heap ${memory.heapMb.toFixed(1)} MB, ${memory.domNodes} nodes, ` +
          `${memory.listeners} listeners, p50 ${latencyP50Ms === null ? '—' : `${latencyP50Ms.toFixed(0)}ms`}, ` +
          `cpu ${cpuTaskMs === null ? '—' : `${cpuTaskMs}ms`}, ${connections} connection(s), ${requests} request(s)`,
      )
    }

    await takeSample(0)
    const deadline = Date.now() + minutes * 60_000
    let nextSampleAt = Date.now() + 60_000
    const interruptions: ReadOnlyInterruptions = {count: 0, totalMs: 0}
    let offset = 0

    while (Date.now() < deadline) {
      // Bounded workload: type a burst, then clear it
      await typeKeystrokes(page, 40, config.burstCadenceMs, offset, interruptions)
      offset += 40
      const entries = await drainEntries(page)
      intervalLatencies.push(...toLatencies(entries, 40).samples)
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a')
      await page.keyboard.press('Backspace')
      // The clear is interaction traffic too — drain and discard so it never
      // pollutes the next interval's latency accounting
      await drainEntries(page)
      await page.waitForTimeout(300)

      if (Date.now() >= nextSampleAt) {
        await takeSample(Math.round((Date.now() - (deadline - minutes * 60_000)) / 60_000))
        nextSampleAt += 60_000
      }
    }
    // Final sample, unless the loop's last iteration already took it
    if (samples.at(-1)?.minute !== minutes) {
      await takeSample(minutes)
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
    if (session.consoleErrors.length > 0) {
      throw new SessionError('console-error', session.consoleErrors.join('\n'), session.httpErrors)
    }

    return {minutes, samples, interruptions}
  } finally {
    await context.close()
  }
}

interface CpuCounters {
  taskDuration: number
  scriptDuration: number
  layoutDuration: number
  styleDuration: number
}

/** Cumulative main-thread counters, in seconds (CDP Performance domain). */
export async function readCpuMetrics(cdp: SessionContext['cdp']): Promise<CpuCounters | null> {
  try {
    await cdp.send('Performance.enable')
    const {metrics} = await cdp.send('Performance.getMetrics')
    const get = (name: string) => metrics.find((metric) => metric.name === name)?.value ?? 0
    return {
      taskDuration: get('TaskDuration'),
      scriptDuration: get('ScriptDuration'),
      layoutDuration: get('LayoutDuration'),
      styleDuration: get('RecalcStyleDuration'),
    }
  } catch {
    return null
  }
}

/** Post-GC heap/DOM snapshot — stable retention signal (report-only). */
export async function readMemorySnapshot(
  cdp: SessionContext['cdp'],
): Promise<SessionMemory | null> {
  try {
    await cdp.send('Performance.enable')
    await cdp.send('HeapProfiler.enable')
    await cdp.send('HeapProfiler.collectGarbage')
    await cdp.send('HeapProfiler.collectGarbage')
    const {metrics} = await cdp.send('Performance.getMetrics')
    const get = (name: string) => metrics.find((metric) => metric.name === name)?.value ?? 0
    return {
      heapMb: get('JSHeapUsedSize') / 1024 / 1024,
      domNodes: get('Nodes'),
      listeners: get('JSEventListeners'),
    }
  } catch {
    return null
  }
}
