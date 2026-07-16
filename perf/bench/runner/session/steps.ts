import {type Locator, type Page} from 'playwright'

import {
  type InteractionTarget,
  type ScenarioStep,
  type StepContext,
  type StepSelector,
} from '../../scenarios/types'
import {DEFAULT_SESSION_CONFIG, fieldInput, focusField, typeBurst} from './interaction'

export interface StepResult {
  /** Interactions driven (clicks + keystrokes) — folded into INP's `driven` total. */
  interactions: number
}

const DEFAULT_KEYSTROKES = 4

export function resolveLocator(page: Page, selector: StepSelector): Locator {
  if ('field' in selector) {
    return fieldInput(page, {fieldPath: selector.field, kind: selector.kind})
  }
  if ('testId' in selector) {
    const scope = selector.within ? page.locator(`[data-testid="${selector.within}"]`) : page
    return scope.locator(`[data-testid="${selector.testId}"]`).first()
  }
  if ('label' in selector) {
    const scope = selector.within ? page.locator(`[data-testid="${selector.within}"]`) : page
    return scope.getByLabel(selector.label, {exact: true}).first()
  }
  return page.locator(selector.css).first()
}

async function focusForType(context: StepContext, selector: StepSelector): Promise<number> {
  if ('field' in selector) {
    const {clicks} = await focusField(
      context.page,
      {fieldPath: selector.field, kind: selector.kind},
      context.timeoutMs,
    )
    return clicks
  }
  await resolveLocator(context.page, selector).click()
  return 1
}

export async function runStep(context: StepContext, step: ScenarioStep): Promise<StepResult> {
  switch (step.kind) {
    case 'type': {
      const clicks = await focusForType(context, step.selector)
      if (step.text !== undefined) {
        await context.page.keyboard.type(step.text, {
          delay: DEFAULT_SESSION_CONFIG.isolatedCadenceMs,
        })
        return {interactions: clicks + step.text.length}
      }
      const keystrokes = step.keystrokes ?? DEFAULT_KEYSTROKES
      await typeBurst(
        context.page,
        keystrokes,
        DEFAULT_SESSION_CONFIG.isolatedCadenceMs,
        0,
        context.interruptions,
      )
      return {interactions: clicks + keystrokes}
    }
    case 'click':
      await resolveLocator(context.page, step.selector).click()
      return {interactions: 1}
    case 'awaitVisible':
      await resolveLocator(context.page, step.selector).waitFor({
        state: 'visible',
        timeout: context.timeoutMs,
      })
      return {interactions: 0}
    case 'hover':
      await resolveLocator(context.page, step.selector).hover({timeout: context.timeoutMs})
      return {interactions: 0}
    case 'raw':
      return step.drive(context)
    default:
      return step
  }
}

export function toTypeStep(target: InteractionTarget): ScenarioStep {
  return {kind: 'type', selector: {field: target.fieldPath, kind: target.kind}}
}
