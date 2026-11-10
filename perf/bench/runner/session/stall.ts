import {type Browser, type Page} from 'playwright'

import {type BenchDocument} from '../../mock-api/types'
import {
  type BenchScenario,
  type InteractionTarget,
  scenarioDocument,
  scenarioFixture,
  type StallPlan,
} from '../../scenarios/types'
import {createSessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {SessionError} from './errors'
import {
  CHARACTERS,
  DEFAULT_SESSION_CONFIG,
  focusField,
  HERMETICITY_HINT,
  type ReadOnlyInterruptions,
  type SessionConfig,
  UNEXPECTED_ENDPOINT_HINT,
  waitUntilEditable,
} from './interaction'
import {awaitReadiness, gotoScenario} from './navigation'

/** Long enough for a 30s stall watchdog to fire twice; a session past it reports "not recovered". */
export const STALL_RECOVERY_CAP_MS = 90_000
const KEYSTROKE_INTERVAL_MS = 1_000
/** Characters of the block's text matched at each end to tell whether it is still on screen. */
const TEXT_PROBE_LENGTH = 30

export interface StallSessionResult {
  /** From the peer's delete until the page stops showing the block, or the cap. */
  recoveryMs: number
  /** False when the block was still shown at the cap. */
  recovered: boolean
  /** Keystrokes typed into the deleted block after the delete. */
  keystrokes: number
  /** Saves the mock accepted after the delete. */
  savesAfterDelete: number
  interruptions: ReadOnlyInterruptions
}

interface BlockProbe {
  fieldPath: string
  head: string
  tail: string
}

function blockText(document: BenchDocument | null, target: string, blockKey: string): string {
  const blocks = (document?.[target] ?? []) as {
    _key?: string
    children?: {text?: string}[]
  }[]
  const block = blocks.find((candidate) => candidate._key === blockKey)
  return (block?.children ?? []).map((child) => child.text ?? '').join('')
}

function stallTarget(scenario: BenchScenario, plan: StallPlan): InteractionTarget {
  const target = scenario.interactions.find(
    (interaction) => interaction.fieldPath === plan.target && interaction.kind === 'pte',
  )
  if (target === undefined) {
    throw new Error(
      `Scenario "${scenario.name}" stall target "${plan.target}" is not a Portable Text interaction`,
    )
  }
  return target
}

/** Typing lands at the caret, so one end of the block's text survives intact while it is shown. */
async function waitForBlockGone(page: Page, probe: BlockProbe, timeoutMs: number) {
  return page
    .waitForFunction(
      ({fieldPath, head, tail}) => {
        const text = document.querySelector(`[data-testid="field-${fieldPath}"]`)?.textContent ?? ''
        return [head, tail].filter((fragment) => text.includes(fragment)).length === 0
      },
      probe,
      {timeout: timeoutMs, polling: 100},
    )
    .then(() => true)
    .catch(() => false)
}

function savesSince(running: RunningSide, since: number): number {
  return running.mock.ledger
    .snapshot()
    .entries.filter(
      (entry) => entry.endpointClass === 'actions' && entry.method === 'POST' && entry.at >= since,
    ).length
}

/**
 * Listener-stall recovery: the page's listener stays connected (heartbeats
 * keep coming) but stops delivering mutations, a peer deletes the Portable
 * Text block the caret is in, and the page keeps typing into it. Its saves
 * are accepted as no-ops, so the text is silently lost until the page
 * notices it is out of date. Measures how long the deleted block stays on
 * screen, capped at `STALL_RECOVERY_CAP_MS`. Runs in the daily cron only:
 * a healthy session takes about as long as the stall watchdog's timeout.
 */
export async function runStallSession(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  config?: Partial<SessionConfig>
}): Promise<StallSessionResult> {
  const {browser, running, scenario, instrumentation} = options
  const config = {...DEFAULT_SESSION_CONFIG, ...options.config}
  const plan = scenario.stall
  if (plan === undefined) {
    throw new Error(`Scenario "${scenario.name}" declares no stall plan`)
  }
  const target = stallTarget(scenario, plan)
  const draftId = `drafts.${scenarioDocument(scenario).documentId}`

  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenarioFixture(scenario))

  const seededText = blockText(running.mock.store.get(draftId), plan.target, plan.blockKey)
  if (seededText.length < TEXT_PROBE_LENGTH * 2) {
    throw new Error(
      `Stall block ${plan.blockKey} in "${scenario.name}" needs at least ${TEXT_PROBE_LENGTH * 2} characters of text`,
    )
  }
  const probe: BlockProbe = {
    fieldPath: plan.target,
    head: seededText.slice(0, TEXT_PROBE_LENGTH),
    tail: seededText.slice(-TEXT_PROBE_LENGTH),
  }

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context, page} = session
  const diagnostics = () => [...session.consoleErrors, ...session.pageErrors]
  const interruptions: ReadOnlyInterruptions = {count: 0, totalMs: 0}

  try {
    await page.addInitScript(instrumentation)
    await gotoScenario(page, running.studioUrl, scenario, config.readinessTimeoutMs)
    await awaitReadiness(page, scenario, {timeoutMs: config.readinessTimeoutMs, diagnostics})

    await focusField(page, target, config.readinessTimeoutMs)
    await page
      .locator(`[data-testid="field-${plan.target}"]`)
      .getByText(probe.tail, {exact: false})
      .click()

    // One echoed save first: proves the caret is in the block and the listener is live
    await waitUntilEditable(page, interruptions)
    await page.keyboard.press(CHARACTERS[0])
    await waitForMockText(running, draftId, plan, seededText, config.readbackTimeoutMs)

    if (running.mock.hub.stallOpenConnections() === 0) {
      throw new SessionError('stall-precondition', 'no open listener connection to stall')
    }
    const deletedAt = Date.now()
    running.mock.commitAsPeer([
      {patch: {id: draftId, unset: [`${plan.target}[_key=="${plan.blockKey}"]`]}},
    ])

    const {recoveredAfterMs, keystrokes} = await typeUntilBlockGone({
      page,
      probe,
      deletedAt,
      interruptions,
    })

    const savesAfterDelete = savesSince(running, deletedAt)
    if (savesAfterDelete === 0) {
      throw new SessionError(
        'stall-precondition',
        `no save reached the mock after the delete (${keystrokes} keystroke(s) typed), so nothing could reveal the stall`,
        diagnostics(),
      )
    }
    assertSessionInvariants(session, running)
    return {
      recoveryMs: recoveredAfterMs ?? STALL_RECOVERY_CAP_MS,
      recovered: typeof recoveredAfterMs === 'number',
      keystrokes,
      savesAfterDelete,
      interruptions,
    }
  } finally {
    running.mock.hub.resumeStalledConnections()
    await context.close()
  }
}

async function waitForMockText(
  running: RunningSide,
  draftId: string,
  plan: StallPlan,
  seededText: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (blockText(running.mock.store.get(draftId), plan.target, plan.blockKey) === seededText) {
    if (Date.now() > deadline) {
      throw new SessionError(
        'readback-mismatch',
        `the keystroke typed into block ${plan.blockKey} never reached the mock`,
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

async function typeUntilBlockGone(options: {
  page: Page
  probe: BlockProbe
  deletedAt: number
  interruptions: ReadOnlyInterruptions
}): Promise<{recoveredAfterMs: number | null; keystrokes: number}> {
  const {page, probe, deletedAt, interruptions} = options
  let keystrokes = 0
  while (Date.now() - deletedAt < STALL_RECOVERY_CAP_MS) {
    await waitUntilEditable(page, interruptions)
    await page.keyboard.press(CHARACTERS[(keystrokes + 1) % CHARACTERS.length])
    keystrokes += 1
    const remainingMs = STALL_RECOVERY_CAP_MS - (Date.now() - deletedAt)
    if (await waitForBlockGone(page, probe, Math.min(KEYSTROKE_INTERVAL_MS, remainingMs))) {
      return {recoveredAfterMs: Date.now() - deletedAt, keystrokes}
    }
  }
  return {recoveredAfterMs: null, keystrokes}
}

function assertSessionInvariants(
  session: Awaited<ReturnType<typeof createSessionContext>>,
  running: RunningSide,
): void {
  if (session.violations.length > 0) {
    throw new SessionError('hermeticity-violation', session.violations.join(', '), HERMETICITY_HINT)
  }
  if (session.pageErrors.length > 0) {
    throw new SessionError('page-error', session.pageErrors.join('\n'))
  }
  if (session.consoleErrors.length > 0) {
    throw new SessionError('console-error', session.consoleErrors.join('\n'), session.httpErrors)
  }
  const {unexpected} = running.mock.ledger.snapshot()
  if (unexpected.length > 0) {
    throw new SessionError(
      'unexpected-endpoint',
      unexpected.map((entry) => `${entry.method} ${entry.path}`).join(', '),
      UNEXPECTED_ENDPOINT_HINT,
    )
  }
}
