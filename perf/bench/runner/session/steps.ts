import {type Locator, type Page} from 'playwright'

import {
  type InteractionTarget,
  type ScenarioStep,
  type StepContext,
  type StepSelector,
} from '../../scenarios/types'
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
    case 'click':
      await resolveLocator(page, step.selector).click({timeout: context.timeoutMs})
      return {interactions: 1}
    case 'awaitVisible':
      await resolveLocator(page, step.selector).waitFor({
        state: 'visible',
        timeout: context.timeoutMs,
      })
      return {interactions: 0}
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
