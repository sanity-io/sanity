import {type Browser} from 'playwright'

import {type BenchEntries} from '../../instrumentation/types'
import {type BenchScenario, scenarioFixture} from '../../scenarios/types'
import {measureSoftNavigations, type SoftNavigationMeasurement} from '../../stats/softNav'
import {createSessionContext, type SessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {SessionError} from './errors'
import {
  DEFAULT_SESSION_CONFIG,
  drainEntries,
  HERMETICITY_HINT,
  type ReadOnlyInterruptions,
  type SessionConfig,
  UNEXPECTED_ENDPOINT_HINT,
  waitUntilEditable,
} from './interaction'
import {awaitReadiness, gotoScenario} from './navigation'
import {navigationsWithoutSoftNavigation, runStep} from './steps'

/** Drains after each step: two clicks closer than a paint produce no soft navigation. */
export async function runSoftNavSession(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  config?: Partial<Pick<SessionConfig, 'cpuThrottleRate'>>
}): Promise<SoftNavigationMeasurement[]> {
  const {browser, running, scenario, instrumentation} = options
  const plan = scenario.softNav
  if (plan === undefined) {
    throw new Error(`Scenario "${scenario.name}" has no soft-navigation plan (softNav)`)
  }

  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenarioFixture(scenario))

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: options.config?.cpuThrottleRate ?? DEFAULT_SESSION_CONFIG.cpuThrottleRate,
  })
  const {context, page} = session
  const diagnostics = () => [...session.consoleErrors, ...session.pageErrors]

  try {
    await page.addInitScript(instrumentation)
    await gotoScenario(page, running.studioUrl, scenario, DEFAULT_SESSION_CONFIG.readinessTimeoutMs)
    await awaitReadiness(page, scenario, {
      timeoutMs: DEFAULT_SESSION_CONFIG.readinessTimeoutMs,
      diagnostics,
    })
    // Boot belongs to the hard navigation
    await drainEntries(page)

    const interruptions: ReadOnlyInterruptions = {count: 0, totalMs: 0}
    const drains: BenchEntries[] = []
    for (const step of plan.steps) {
      throwOnPageErrors(session)
      await runStep({page, running, timeoutMs: 30_000, interruptions, diagnostics}, step)
      // Ready passes once the data shows; let the form turn editable before the next click
      if (step.kind === 'navigate' && plan.documentOpens.includes(step.label)) {
        await waitUntilEditable(page, interruptions)
      }
      drains.push(await drainEntries(page))
    }

    throwOnPageErrors(session)
    if (session.violations.length > 0) {
      throw new SessionError(
        'hermeticity-violation',
        session.violations.join(', '),
        HERMETICITY_HINT,
      )
    }
    const {unexpected: unexpectedEndpoints} = running.mock.ledger.snapshot()
    if (unexpectedEndpoints.length > 0) {
      throw new SessionError(
        'unexpected-endpoint',
        unexpectedEndpoints.map((entry) => `${entry.method} ${entry.path}`).join(', '),
        UNEXPECTED_ENDPOINT_HINT,
      )
    }

    const measures = drains.flatMap((drain) => drain.measures)
    const softNavigations = drains.flatMap((drain) => drain.softNavigations)
    const {navigations, undrivenUrls} = measureSoftNavigations({
      measures,
      softNavigations,
      events: drains.flatMap((drain) => drain.events),
      layoutShifts: drains.flatMap((drain) => drain.layoutShifts),
      interactionContentfulPaints: drains.flatMap((drain) => drain.interactionContentfulPaints),
    })
    const missing = navigationsWithoutSoftNavigation(measures, softNavigations)
    if (missing.length > 0 || undrivenUrls.length > 0) {
      throw new SessionError(
        'sample-count-mismatch',
        `${navigations.length + missing.length} navigate steps, ${softNavigations.length} soft navigations` +
          (missing.length > 0 ? `; no soft navigation for: ${missing.join(', ')}` : '') +
          (undrivenUrls.length > 0 ? `; no navigate step for: ${undrivenUrls.join(', ')}` : ''),
      )
    }
    const misattributed = navigations.filter(
      (navigation) =>
        plan.documentOpens.includes(navigation.label) && isMiscreditedDocumentOpen(navigation),
    )
    if (misattributed.length > 0) {
      throw new SessionError(
        'paint-attribution',
        `document opens whose soft LCP is not the document's content: ` +
          misattributed
            .map(
              (navigation) =>
                `${navigation.label} → ${navigation.lcpElement ?? 'nothing'} at ${navigation.softLcpMs?.toFixed(0) ?? '-'}ms, ready at ${navigation.clickToReadyMs.toFixed(0)}ms`,
            )
            .join(', '),
      )
    }

    return navigations
  } finally {
    await context.close()
  }
}

function throwOnPageErrors(session: SessionContext): void {
  if (session.pageErrors.length > 0) {
    throw new SessionError('page-error', session.pageErrors.join('\n'))
  }
  if (session.consoleErrors.length > 0) {
    throw new SessionError('console-error', session.consoleErrors.join('\n'), session.httpErrors)
  }
}

const DETACHED_ELEMENT = '(detached)'

/** The ready check runs on animation frames, so the paint that shows the data can trail it by up to a frame. */
const READY_FRAME_MS = 16

/** Studio swaps the title element as the form turns editable, so a detached element passes when its timing holds. */
export function isMiscreditedDocumentOpen(navigation: SoftNavigationMeasurement): boolean {
  if (navigation.softLcpMs === null) return true
  const paintedBeforeData = navigation.softLcpMs + READY_FRAME_MS < navigation.clickToReadyMs
  const landedOnChrome =
    navigation.lcpElementKind === 'other' && navigation.lcpElement !== DETACHED_ELEMENT
  return paintedBeforeData || landedOnChrome
}
