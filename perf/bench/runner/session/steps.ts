import {type Locator, type Page} from 'playwright'

import {
  type InteractionTarget,
  type ScenarioStep,
  type StepContext,
  type StepSelector,
} from '../../scenarios/types'
import {SessionError} from './errors'
import {
  DEFAULT_SESSION_CONFIG,
  fieldInput,
  focusField,
  typeBurst,
  waitUntilEditable,
} from './interaction'

export interface StepResult {
  /** Interactions driven (clicks + key presses) — folded into INP's `driven` total. */
  interactions: number
}

const DEFAULT_KEYSTROKES = 4
const DEFAULT_REPEAT = 1

function scopeFor(page: Page, within?: string): Page | Locator {
  return within ? page.locator(`[data-testid="${within}"]`) : page
}

export function resolveLocator(page: Page, selector: StepSelector): Locator {
  if ('field' in selector) {
    return fieldInput(page, {fieldPath: selector.field, kind: selector.kind})
  }
  if ('testId' in selector) {
    return scopeFor(page, selector.within).locator(`[data-testid="${selector.testId}"]`).first()
  }
  if ('label' in selector) {
    return scopeFor(page, selector.within).getByLabel(selector.label, {exact: true}).first()
  }
  return page.locator(selector.css).first()
}

/** Focus the target for keyboard input; returns the click interactions that took. */
async function focusForKeys(context: StepContext, selector: StepSelector): Promise<number> {
  if ('field' in selector) {
    const {clicks} = await focusField(
      context.page,
      {fieldPath: selector.field, kind: selector.kind},
      context.timeoutMs,
    )
    return clicks
  }
  await resolveLocator(context.page, selector).click({timeout: context.timeoutMs})
  return 1
}

/** How long the editable probe waits for its keystroke's `input` event. */
const PROBE_TIMEOUT_MS = 20_000

/** The measure name a step's `milestone` records (navigation start → reached). */
export function milestoneMeasureName(milestone: string): string {
  return `bench:milestone:${milestone}`
}

async function recordMilestone(page: Page, milestone: string | undefined): Promise<void> {
  if (milestone === undefined) return
  const name = milestoneMeasureName(milestone)
  await page.evaluate((measureName) => {
    performance.measure(measureName)
  }, name)
}

/**
 * Trial click: every actionability check (visible, stable, enabled, receives
 * events) without clicking, then the milestone.
 */
async function awaitClickable(
  context: StepContext,
  target: Locator,
  milestone: string | undefined,
): Promise<void> {
  await target.click({trial: true, timeout: context.timeoutMs})
  await recordMilestone(context.page, milestone)
}

/** See the `awaitAllFieldsEditable` step. */
async function awaitAllFieldsEditable(
  context: StepContext,
  milestone: string,
  minFields: number,
): Promise<void> {
  await context.page.waitForFunction(
    ({measureName, min}) => {
      const form = document.querySelector('[data-testid="form-view"]')
      if (!form || form.getAttribute('data-read-only') === 'true') return false
      const control =
        'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), ' +
        'select:not([disabled]), button:not([disabled]), [contenteditable="true"]'
      const fields = [...form.querySelectorAll<HTMLElement>('[data-testid^="field-"]')].filter(
        (field) =>
          // field-actions-* are per-field menus, not fields; closed overlays
          // stay mounted hidden (@sanity/ui <Activity>) and are skipped
          !field.dataset.testid?.startsWith('field-actions-') && field.checkVisibility(),
      )
      // Header chrome (presence, the field-actions menu and the comment
      // button) mounts before a lazy input does, so its buttons must not
      // stand in for the input. The title area stays eligible: a collapsed
      // object's only control is its expand toggle there
      const chrome =
        '[data-ui="PresenceBox"], [data-ui="FieldActionsFlex"], [data-actions-visible], ' +
        '[data-testid="field-actions-trigger"]'
      if (fields.length < min) return false
      // Inline arrows only: tsx wraps named functions in a `__name` helper
      // that doesn't exist in the page
      if (
        !fields.every((field) =>
          [...field.querySelectorAll(control)].some((element) => !element.closest(chrome)),
        )
      ) {
        return false
      }
      performance.measure(measureName)
      return true
    },
    {measureName: milestoneMeasureName(milestone), min: minFields},
    {timeout: context.timeoutMs, polling: 'raf'},
  )
}

/**
 * The editable probe (see the `awaitEditable` step). Text inputs, textareas
 * and contenteditables all qualify; the PTE root is not clicked first, so
 * the probe lands on the first editable the field renders.
 */
async function awaitEditable(context: StepContext, field: string): Promise<void> {
  const {page} = context
  const input = page
    .locator(
      `[data-testid="field-${field}"] input[type="text"], ` +
        `[data-testid="field-${field}"] textarea, ` +
        `[data-testid="field-${field}"] [contenteditable="true"]`,
    )
    .first()
  await input.waitFor({state: 'visible', timeout: context.timeoutMs})
  await input.click()
  await input.evaluate((el) => {
    el.addEventListener('input', () => performance.measure('bench:time-to-editable'), {once: true})
  })
  await page.keyboard.press('a')

  await page
    .waitForFunction(
      () => performance.getEntriesByName('bench:time-to-editable', 'measure').length > 0,
      undefined,
      {timeout: PROBE_TIMEOUT_MS, polling: 100},
    )
    .catch(() => {
      throw new SessionError(
        'probe-timeout',
        `probe keystroke never landed${context.label ? ` (${context.label})` : ''}`,
        context.diagnostics?.() ?? [],
      )
    })
}

export async function runStep(context: StepContext, step: ScenarioStep): Promise<StepResult> {
  const {page} = context
  const cadenceMs = DEFAULT_SESSION_CONFIG.isolatedCadenceMs
  switch (step.kind) {
    case 'type': {
      const clicks = await focusForKeys(context, step.selector)
      if (step.text !== undefined) {
        // Same once-per-burst read-only gate as typeBurst: keystrokes typed
        // while the form is transiently read-only are swallowed but would
        // still count as driven
        await waitUntilEditable(page, context.interruptions)
        await page.keyboard.type(step.text, {delay: cadenceMs})
        return {interactions: clicks + step.text.length}
      }
      const keystrokes = step.keystrokes ?? DEFAULT_KEYSTROKES
      // Isolated cadence so each keystroke is its own interaction (the Event
      // Timing observer needs a paint between them); read-only is gated once
      // per burst, not per keystroke.
      await typeBurst(page, keystrokes, cadenceMs, 0, context.interruptions)
      return {interactions: clicks + keystrokes}
    }
    case 'click': {
      const target = resolveLocator(page, step.selector)
      if (step.milestone !== undefined) {
        // Mark when the target became clickable, not when the click finished
        await awaitClickable(context, target, step.milestone)
      }
      await target.click({timeout: context.timeoutMs})
      return {interactions: 1}
    }
    case 'awaitClickable':
      await awaitClickable(context, resolveLocator(page, step.selector), step.milestone)
      return {interactions: 0}
    case 'awaitAllFieldsEditable':
      await awaitAllFieldsEditable(context, step.milestone, step.minFields ?? 1)
      return {interactions: 0}
    case 'awaitVisible':
      await resolveLocator(page, step.selector).waitFor({
        state: 'visible',
        timeout: context.timeoutMs,
      })
      await recordMilestone(page, step.milestone)
      return {interactions: 0}
    case 'awaitEditable':
      await awaitEditable(context, step.field)
      return {interactions: 2}
    case 'hover':
      await resolveLocator(page, step.selector).hover({timeout: context.timeoutMs})
      return {interactions: 0}
    case 'scroll': {
      await resolveLocator(page, step.selector).hover({timeout: context.timeoutMs})
      const repeat = step.repeat ?? DEFAULT_REPEAT
      for (let i = 0; i < repeat; i++) {
        await page.mouse.wheel(0, step.deltaY)
        await page.waitForTimeout(cadenceMs)
      }
      return {interactions: 0}
    }
    case 'press': {
      const clicks = step.selector ? await focusForKeys(context, step.selector) : 0
      const repeat = step.repeat ?? DEFAULT_REPEAT
      for (let i = 0; i < repeat; i++) {
        await page.keyboard.press(step.key)
        await page.waitForTimeout(cadenceMs)
      }
      return {interactions: clicks + repeat}
    }
    case 'raw':
      return step.drive(context)
    default: {
      const exhaustiveStep: never = step
      throw new Error(`runStep received an unhandled step kind: ${JSON.stringify(exhaustiveStep)}`)
    }
  }
}

/** The step INP mode derives for a scenario without `steps`: focus the field, type a burst. */
export function toTypeStep(target: InteractionTarget): ScenarioStep {
  return {kind: 'type', selector: {field: target.fieldPath, kind: target.kind}}
}
