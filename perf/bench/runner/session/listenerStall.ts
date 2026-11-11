import {setTimeout as delay} from 'node:timers/promises'

import {type Browser, type Page} from 'playwright'

import {getScenario} from '../../scenarios'
import {scenarioFixture} from '../../scenarios/types'
import {attachPage, createSessionContext, type SessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {DEFAULT_READY_SELECTOR, scenarioUrl} from './navigation'

/**
 * Listener stall session: drives real Studio tabs over one HTTP/2 connection capped at the API's
 * 100 concurrent streams and asserts on the `Studio Listener Stall Detected` telemetry event each
 * stall fires. The Studio's detector, ledger and classifier do all the work; the session only
 * opens tabs and listeners and reads the events the tabs send.
 */

/** The real API's per-connection stream cap, so the classifier's budget of 80 applies unchanged. */
export const API_MAX_CONCURRENT_STREAMS = 100

const STALL_EVENT_NAME = 'Studio Listener Stall Detected'
const LISTENER_LIMIT_KINDS = ['too-many-tabs', 'this-tab-heavy', 'this-tab-over-limit']
const EXPECTED_BUDGET = 80
const STALL_TRIGGER_MS = 10_000
const TAB_LOCK_PREFIX = 'sanity-listener-tab:'
const STALLED_LOCK_SUFFIX = 's'

const POLL_INTERVAL_MS = 500
const READY_TIMEOUT_MS = 30_000
const STALL_FLAG_TIMEOUT_MS = STALL_TRIGGER_MS + 20_000
// The Studio's telemetry store flushes 30s after the first event it buffers
const EVENT_TIMEOUT_MS = 50_000
const MAX_DESK_TABS = 16
const OVER_LIMIT_LISTENERS = 105
const HEAVY_TAB_LISTENERS = 95

const DESK_SCENARIO = getScenario('singleString')
const LISTENER_TOOL_PATH = 'listenerStall/listeners'

/** The `Studio Listener Stall Detected` fields the session asserts on. */
export interface ListenerStallEvent {
  kind: string
  listenersAllTabs: number
  listenersThisTab: number
  listenersOtherTabs: number
  knownStudioTabs: number
  unknownStudioTabs: number
  stalledListenersThisTab: number
  stalledOtherTabs: number
  isBootStall: boolean
  stallOccurrence: number
  stalledForMs: number
  protocol: string
  budget: number
}

export type ListenerStallCheckName =
  | 'too-many-tabs'
  | 'second-occurrence'
  | 'single-default-tab'
  | 'this-tab-over-limit'
  | 'this-tab-heavy'

export interface ListenerStallCheck {
  name: ListenerStallCheckName
  failures: string[]
  events: ListenerStallEvent[]
  /** Requests the network refused or dropped (not client aborts), e.g. ENHANCE_YOUR_CALM. */
  networkFailures: string[]
  notes: string[]
  durationMs: number
}

interface CapturedEvent {
  page: Page
  event: ListenerStallEvent
}

interface TabLock {
  tabId: string
  count: number
  isStalled: boolean
}

interface StallHarness {
  running: RunningSide
  session: SessionContext
  pages: Page[]
  stallEvents: CapturedEvent[]
  /** When each page sent a Studio telemetry batch, stall event or not. */
  studioBatchTimes: Map<Page, number[]>
  networkFailures: string[]
  notes: string[]
}

interface CheckOutcome {
  name: ListenerStallCheckName
  failures: string[]
  events: ListenerStallEvent[]
}

interface TelemetryBatchBody {
  batch?: {name?: string; data?: unknown}[]
}

const STUDIO_BATCH_TAG = 'sanity.studio'
const CLIENT_SIDE_FAILURES = ['net::ERR_ABORTED', 'net::ERR_BLOCKED_BY_CLIENT']

async function openHarness(browser: Browser, running: RunningSide): Promise<StallHarness> {
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenarioFixture(DESK_SCENARIO))

  const session = await createSessionContext(browser, running.side, running.studioUrl)
  const harness: StallHarness = {
    running,
    session,
    pages: [],
    stallEvents: [],
    studioBatchTimes: new Map(),
    networkFailures: [],
    notes: [],
  }

  session.context.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? 'unknown'
    if (CLIENT_SIDE_FAILURES.some((failure) => errorText.startsWith(failure))) return
    harness.networkFailures.push(`${errorText} ${request.method()} ${request.url()}`)
  })

  // Answered in the browser: a stalled tab's telemetry requests would queue behind the capped connection
  await session.context.route(
    new RegExp(`^https://([^/]+\\.)?localhost:${running.side.apiPort}/v[^/]+/intake/`),
    (route) => {
      const request = route.request()
      if (request.method() === 'GET') {
        return route.fulfill({json: {status: 'granted'}})
      }
      const page = request.frame().page()
      const body = request.postDataJSON() as TelemetryBatchBody
      if (new URL(request.url()).searchParams.get('tag') === STUDIO_BATCH_TAG) {
        harness.studioBatchTimes.set(page, [
          ...(harness.studioBatchTimes.get(page) ?? []),
          Date.now(),
        ])
      }
      const events = (body.batch ?? [])
        .filter((entry) => entry.name === STALL_EVENT_NAME)
        .map((entry) => ({page, event: entry.data as ListenerStallEvent}))
      harness.stallEvents.push(...events)
      return route.fulfill({json: {}})
    },
  )

  return harness
}

async function openPage(harness: StallHarness): Promise<Page> {
  const page =
    harness.pages.length === 0
      ? harness.session.page
      : (await attachPage(harness.session.context)).page
  harness.pages.push(page)
  return page
}

function eventsFrom(harness: StallHarness, page: Page): ListenerStallEvent[] {
  return harness.stallEvents
    .filter((captured) => captured.page === page)
    .map((captured) => captured.event)
}

async function pollUntil<T>(
  read: () => Promise<T | undefined> | T | undefined,
  timeoutMs: number,
): Promise<T | undefined> {
  const deadline = Date.now() + timeoutMs
  const attempt = async (): Promise<T | undefined> => {
    const value = await read()
    if (value === undefined && Date.now() < deadline) {
      await delay(POLL_INTERVAL_MS)
      return attempt()
    }
    return value
  }
  return attempt()
}

/** Every Studio tab's presence lock in this browser context, deduped by tab id. */
async function readTabLocks(page: Page): Promise<TabLock[]> {
  const names = await page.evaluate(
    async (prefix) =>
      ((await navigator.locks.query()).held ?? [])
        .map((lock) => lock.name ?? '')
        .filter((name) => name.startsWith(prefix)),
    TAB_LOCK_PREFIX,
  )
  const byTabId = new Map(
    names.map((name) => {
      const [, tabId = '', count = '0', stalledFlag] = name.slice(TAB_LOCK_PREFIX.length).split(':')
      const lock: TabLock = {
        tabId,
        count: Number(count),
        isStalled: stalledFlag === STALLED_LOCK_SUFFIX,
      }
      return [tabId, lock] as const
    }),
  )
  return [...byTabId.values()]
}

function listenerTotal(locks: TabLock[]): number {
  return locks.reduce((total, lock) => total + lock.count, 0)
}

function waitForStalledLocks(page: Page, timeoutMs: number): Promise<TabLock[] | undefined> {
  return pollUntil(async () => {
    const locks = await readTabLocks(page)
    return locks.some((lock) => lock.isStalled) ? locks : undefined
  }, timeoutMs)
}

function waitForEvents(
  harness: StallHarness,
  page: Page | undefined,
  count: number,
): Promise<ListenerStallEvent[] | undefined> {
  return pollUntil(() => {
    const events = page
      ? eventsFrom(harness, page)
      : harness.stallEvents.map((captured) => captured.event)
    return events.length >= count ? events : undefined
  }, EVENT_TIMEOUT_MS)
}

/** Waits until the context's summed listener count stops changing between two reads. */
async function readSettledListenerTotal(page: Page): Promise<number> {
  const readings: number[] = []
  const settled = await pollUntil(async () => {
    readings.push(listenerTotal(await readTabLocks(page)))
    const [previous, latest] = readings.slice(-2)
    return readings.length >= 2 && previous === latest ? latest : undefined
  }, READY_TIMEOUT_MS)
  return settled ?? readings.at(-1) ?? 0
}

async function openDeskTab(harness: StallHarness): Promise<Page> {
  const page = await openPage(harness)
  await page.goto(scenarioUrl(harness.running.studioUrl, DESK_SCENARIO), {
    waitUntil: 'domcontentloaded',
  })
  const isReady = await page
    .locator(DEFAULT_READY_SELECTOR)
    .waitFor({state: 'visible', timeout: READY_TIMEOUT_MS})
    .then(
      () => true,
      () => false,
    )
  const total = await readSettledListenerTotal(page)
  harness.notes.push(
    `desk tab ${harness.pages.length}: ${isReady ? 'ready' : 'never ready'}, ${total} listeners across the context`,
  )
  return page
}

async function openListenerTool(harness: StallHarness): Promise<Page> {
  const page = await openPage(harness)
  await page.goto(`${harness.running.studioUrl}/${LISTENER_TOOL_PATH}`, {
    waitUntil: 'domcontentloaded',
  })
  await page
    .getByTestId('listener-stall-open')
    .waitFor({state: 'visible', timeout: READY_TIMEOUT_MS})
  return page
}

async function openListeners(page: Page, count: number): Promise<void> {
  await page.getByTestId('listener-stall-count').fill(String(count))
  await page.getByTestId('listener-stall-open').click()
}

/** Opens desk tabs until the context's listeners outnumber the connection's streams. */
async function openDeskTabsUntilOverCap(harness: StallHarness): Promise<void> {
  const page = await openDeskTab(harness)
  const total = listenerTotal(await readTabLocks(page))
  if (total > API_MAX_CONCURRENT_STREAMS || harness.pages.length >= MAX_DESK_TABS) return
  await openDeskTabsUntilOverCap(harness)
}

function expectThat(condition: boolean, failure: string): string[] {
  return condition ? [] : [failure]
}

function rejectWhen(condition: boolean, failure: string): string[] {
  return condition ? [failure] : []
}

function calibrationFailures(
  event: ListenerStallEvent,
  label: string,
  protocols: string[] = ['h2'],
): string[] {
  const numericFields = [
    'listenersAllTabs',
    'listenersThisTab',
    'listenersOtherTabs',
    'knownStudioTabs',
    'unknownStudioTabs',
    'stalledListenersThisTab',
    'stalledOtherTabs',
    'stallOccurrence',
    'stalledForMs',
    'budget',
  ] as const
  const presence = numericFields.flatMap((field) =>
    expectThat(typeof event[field] === 'number', `${label}: ${field} is ${String(event[field])}`),
  )
  return [
    ...presence,
    ...expectThat(
      event.listenersAllTabs === event.listenersThisTab + event.listenersOtherTabs,
      `${label}: listenersAllTabs ${event.listenersAllTabs} is not listenersThisTab ${event.listenersThisTab} + listenersOtherTabs ${event.listenersOtherTabs}`,
    ),
    ...expectThat(
      event.listenersAllTabs >= EXPECTED_BUDGET,
      `${label}: listenersAllTabs ${event.listenersAllTabs} is under the budget`,
    ),
    ...expectThat(
      event.budget === EXPECTED_BUDGET,
      `${label}: budget ${event.budget}, expected ${EXPECTED_BUDGET}`,
    ),
    ...expectThat(
      protocols.includes(event.protocol),
      `${label}: protocol ${event.protocol}, expected ${protocols.join(' or ')}`,
    ),
    ...expectThat(
      event.unknownStudioTabs === 0,
      `${label}: unknownStudioTabs ${event.unknownStudioTabs}, expected 0`,
    ),
    ...rejectWhen(event.isBootStall, `${label}: isBootStall, expected a listener stall`),
    ...expectThat(
      event.stalledForMs >= STALL_TRIGGER_MS,
      `${label}: stalledForMs ${event.stalledForMs}, expected at least ${STALL_TRIGGER_MS}`,
    ),
  ]
}

function kindFailures(event: ListenerStallEvent, label: string, kind: string): string[] {
  return expectThat(event.kind === kind, `${label}: kind ${event.kind}, expected ${kind}`)
}

async function tooManyTabs(harness: StallHarness): Promise<CheckOutcome[]> {
  await openDeskTabsUntilOverCap(harness)
  const [firstPage] = harness.pages
  const stalledLocks = await waitForStalledLocks(firstPage, STALL_FLAG_TIMEOUT_MS)
  if (stalledLocks === undefined) {
    return [{name: 'too-many-tabs', failures: ['no tab flagged a stall'], events: []}]
  }
  const lockedListeners = listenerTotal(stalledLocks)
  harness.notes.push(
    `stall flagged with ${lockedListeners} listeners in ${stalledLocks.length} tabs`,
  )
  const events = (await waitForEvents(harness, undefined, 1)) ?? []
  if (events.some((event) => event.protocol === 'unknown')) {
    harness.notes.push('a stalled tab reported protocol unknown: its protocol probe queued')
  }
  const occurrencesPerPage = harness.pages.map((page) =>
    eventsFrom(harness, page).map((event) => event.stallOccurrence),
  )
  const failures = [
    ...expectThat(events.length > 0, `no "${STALL_EVENT_NAME}" event arrived`),
    ...events.flatMap((event, index) => {
      const label = `event ${index + 1}`
      return [
        ...kindFailures(event, label, 'too-many-tabs'),
        ...expectThat(
          event.knownStudioTabs === harness.pages.length,
          `${label}: knownStudioTabs ${event.knownStudioTabs}, expected ${harness.pages.length} open tabs`,
        ),
        ...expectThat(
          event.listenersAllTabs === lockedListeners,
          `${label}: listenersAllTabs ${event.listenersAllTabs}, expected the ${lockedListeners} the tabs' presence locks sum to`,
        ),
        ...expectThat(
          event.stallOccurrence === 1,
          `${label}: stallOccurrence ${event.stallOccurrence}, expected 1`,
        ),
        // The newest tab boots into the full connection, so its protocol probe can time out
        ...calibrationFailures(event, label, ['h2', 'unknown']),
      ]
    }),
    ...occurrencesPerPage.flatMap((occurrences, index) =>
      expectThat(
        occurrences.length <= 1,
        `tab ${index + 1} sent ${occurrences.length} events for one occurrence`,
      ),
    ),
  ]
  return [{name: 'too-many-tabs', failures, events}]
}

async function overLimitThenSecondOccurrence(harness: StallHarness): Promise<CheckOutcome[]> {
  const page = await openListenerTool(harness)
  await openListeners(page, OVER_LIMIT_LISTENERS)
  const firstStall = await waitForStalledLocks(page, STALL_FLAG_TIMEOUT_MS)
  const firstEvents = firstStall ? ((await waitForEvents(harness, page, 1)) ?? []) : []
  const [firstEvent] = firstEvents
  const overLimit: CheckOutcome = {
    name: 'this-tab-over-limit',
    events: firstEvents,
    failures: firstEvent
      ? [
          ...kindFailures(firstEvent, 'first stall', 'this-tab-over-limit'),
          ...expectThat(
            firstEvent.stallOccurrence === 1,
            `first stall: stallOccurrence ${firstEvent.stallOccurrence}, expected 1`,
          ),
          ...expectThat(
            firstEvent.knownStudioTabs === 1,
            `first stall: knownStudioTabs ${firstEvent.knownStudioTabs}, expected 1`,
          ),
          ...expectThat(
            firstEvent.listenersOtherTabs === 0,
            `first stall: listenersOtherTabs ${firstEvent.listenersOtherTabs}, expected 0`,
          ),
          ...calibrationFailures(firstEvent, 'first stall'),
        ]
      : [firstStall ? `no "${STALL_EVENT_NAME}" event arrived` : 'the tab never flagged a stall'],
  }
  if (firstEvent === undefined) {
    return [
      overLimit,
      {name: 'second-occurrence', failures: ['the first stall never reported'], events: []},
    ]
  }

  await page.getByTestId('listener-stall-close').click()
  const cleared = await pollUntil(async () => {
    const locks = await readTabLocks(page)
    return locks.some((lock) => lock.isStalled) ? undefined : locks
  }, STALL_FLAG_TIMEOUT_MS)
  await openListeners(page, OVER_LIMIT_LISTENERS)
  const secondStall = await waitForStalledLocks(page, STALL_FLAG_TIMEOUT_MS)
  const events = secondStall
    ? ((await waitForEvents(harness, page, 2)) ?? firstEvents)
    : firstEvents
  const secondEvent = events.at(1)
  const secondOccurrence: CheckOutcome = {
    name: 'second-occurrence',
    events,
    failures: [
      ...expectThat(Boolean(cleared), 'the first stall never cleared after closing listeners'),
      ...expectThat(Boolean(secondStall), 'the tab never flagged a second stall'),
      ...expectThat(events.length === 2, `${events.length} events for two occurrences`),
      ...(secondEvent
        ? [
            ...kindFailures(secondEvent, 'second stall', 'this-tab-over-limit'),
            ...expectThat(
              secondEvent.stallOccurrence === 2,
              `second stall: stallOccurrence ${secondEvent.stallOccurrence}, expected 2`,
            ),
            ...calibrationFailures(secondEvent, 'second stall'),
          ]
        : []),
    ],
  }
  return [overLimit, secondOccurrence]
}

async function heavyTab(harness: StallHarness): Promise<CheckOutcome[]> {
  await openDeskTab(harness)
  const page = await openListenerTool(harness)
  await openListeners(page, HEAVY_TAB_LISTENERS)
  const stall = await waitForStalledLocks(page, STALL_FLAG_TIMEOUT_MS)
  const events = stall ? ((await waitForEvents(harness, page, 1)) ?? []) : []
  const [event] = events
  const failures = event
    ? [
        ...kindFailures(event, 'heavy tab', 'this-tab-heavy'),
        ...expectThat(
          event.knownStudioTabs === 2,
          `heavy tab: knownStudioTabs ${event.knownStudioTabs}, expected 2`,
        ),
        ...expectThat(
          event.listenersOtherTabs > 0,
          'heavy tab: listenersOtherTabs 0, expected the desk tab',
        ),
        ...expectThat(
          event.listenersThisTab >= EXPECTED_BUDGET,
          `heavy tab: listenersThisTab ${event.listenersThisTab} is under the budget`,
        ),
        ...expectThat(
          event.stallOccurrence === 1,
          `heavy tab: stallOccurrence ${event.stallOccurrence}, expected 1`,
        ),
        ...calibrationFailures(event, 'heavy tab'),
      ]
    : [stall ? `no "${STALL_EVENT_NAME}" event arrived` : 'the tab never flagged a stall']
  return [{name: 'this-tab-heavy', failures, events}]
}

async function singleDefaultTab(harness: StallHarness): Promise<CheckOutcome[]> {
  const page = await openDeskTab(harness)
  // A batch sent this late carries any stall the tab could have detected after it loaded
  const coveredAfter = Date.now() + STALL_TRIGGER_MS + POLL_INTERVAL_MS * 4
  const coveringBatch = await pollUntil(
    () => harness.studioBatchTimes.get(page)?.find((sentAt) => sentAt >= coveredAfter),
    STALL_TRIGGER_MS + EVENT_TIMEOUT_MS,
  )
  const events = eventsFrom(harness, page)
  const failures = [
    ...expectThat(
      Boolean(coveringBatch),
      `no telemetry batch arrived more than ${STALL_TRIGGER_MS}ms after the tab loaded`,
    ),
    ...events.flatMap((event, index) =>
      rejectWhen(
        LISTENER_LIMIT_KINDS.includes(event.kind),
        `event ${index + 1}: a single default tab classified a stall as ${event.kind}`,
      ),
    ),
  ]
  return [{name: 'single-default-tab', failures, events}]
}

async function runInHarness(
  browser: Browser,
  running: RunningSide,
  names: ListenerStallCheckName[],
  run: (harness: StallHarness) => Promise<CheckOutcome[]>,
): Promise<ListenerStallCheck[]> {
  const startedAt = Date.now()
  const harness = await openHarness(browser, running)
  const outcomes = await run(harness)
    .catch((error: unknown) =>
      names.map((name) => ({
        name,
        failures: [error instanceof Error ? error.message : String(error)],
        events: [],
      })),
    )
    .finally(() => harness.session.context.close())

  const {unexpected} = running.mock.ledger.snapshot()
  const environmentFailures = [
    ...harness.session.violations.map((violation) => `hermeticity violation: ${violation}`),
    ...unexpected.map((entry) => `unexpected mock endpoint: ${entry.method} ${entry.path}`),
  ]
  return outcomes.map((outcome) => ({
    ...outcome,
    failures: [...outcome.failures, ...environmentFailures],
    networkFailures: harness.networkFailures,
    notes: harness.notes,
    durationMs: Date.now() - startedAt,
  }))
}

/**
 * Runs every listener stall check against `running`, whose mock must cap concurrent streams at
 * {@link API_MAX_CONCURRENT_STREAMS}. Each check group gets its own browser context, so its own
 * connection, Web Locks and stall counters.
 */
export async function runListenerStallSession(options: {
  browser: Browser
  running: RunningSide
  log: (message: string) => void
}): Promise<ListenerStallCheck[]> {
  const {browser, running, log} = options
  const groups: [ListenerStallCheckName[], (harness: StallHarness) => Promise<CheckOutcome[]>][] = [
    [['too-many-tabs'], tooManyTabs],
    [['this-tab-over-limit', 'second-occurrence'], overLimitThenSecondOccurrence],
    [['this-tab-heavy'], heavyTab],
    [['single-default-tab'], singleDefaultTab],
  ]
  return groups.reduce<Promise<ListenerStallCheck[]>>(async (previous, [names, run]) => {
    const checks = await previous
    log(`running ${names.join(', ')}`)
    return [...checks, ...(await runInHarness(browser, running, names, run))]
  }, Promise.resolve([]))
}
