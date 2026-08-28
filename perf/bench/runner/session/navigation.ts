import {type Page} from 'playwright'

import {type BenchScenario} from '../../scenarios/types'
import {SessionError} from './errors'

/**
 * Shared scenario navigation: every session mode boots the same way — open
 * the scenario's route and wait for its readiness selector. Centralized here
 * so scenario-level routing options (`path`, `readySelector`) apply to all
 * modes identically instead of living in four hardcoded copies.
 */

/** The default readiness oracle: the document form claims to be editable. */
export const DEFAULT_READY_SELECTOR = '[data-testid="form-view"]:not([data-read-only="true"])'

/**
 * The studio route a scenario opens: its `path` (workspace-relative, e.g. a
 * structure pane like `structure/<itemId>`) when set, otherwise the edit
 * intent for the document under test.
 */
export function scenarioUrl(studioUrl: string, scenario: BenchScenario): string {
  const workspace = scenario.workspace ?? scenario.name
  if (scenario.path) {
    return `${studioUrl}/${workspace}/${scenario.path}`
  }
  return `${studioUrl}/${workspace}/intent/edit/id=${encodeURIComponent(scenario.documentId)};type=${encodeURIComponent(scenario.documentType)}`
}

export function readySelector(scenario: BenchScenario): string {
  return scenario.readySelector ?? DEFAULT_READY_SELECTOR
}

export async function gotoScenario(
  page: Page,
  studioUrl: string,
  scenario: BenchScenario,
  timeoutMs: number,
): Promise<void> {
  await page.goto(scenarioUrl(studioUrl, scenario), {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMs,
  })
}

/**
 * Wait for the scenario's readiness selector; a timeout throws a typed
 * `readiness-timeout` SessionError naming the selector that never matched
 * and carrying the caller's diagnostics (console/page/http errors gathered
 * so far — the usual cause).
 */
export async function awaitReadiness(
  page: Page,
  scenario: BenchScenario,
  options: {
    timeoutMs: number
    /** Appended to the failure message in parens, e.g. a load condition. */
    context?: string
    diagnostics?: () => string[]
  },
): Promise<void> {
  const {timeoutMs, context, diagnostics} = options
  await page
    .locator(readySelector(scenario))
    .waitFor({state: 'visible', timeout: timeoutMs})
    .catch(() => {
      throw new SessionError(
        'readiness-timeout',
        `${readySelector(scenario)} never became ready${context ? ` (${context})` : ''}`,
        diagnostics?.() ?? [],
      )
    })
}
