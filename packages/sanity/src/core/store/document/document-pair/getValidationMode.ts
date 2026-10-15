import {type ValidationScheduling} from '@sanity/validation/_internal'
import {BehaviorSubject} from 'rxjs'

const validationModes = new Map<string, BehaviorSubject<ValidationScheduling>>()

/**
 * How many active `immediate` subscriptions share each validation mode.
 * The mode stays `immediate` until the last of them unsubscribes, including
 * when one subscriber remounts while another is still listening.
 */
const immediateSubscriberCounts = new Map<string, number>()

export function getValidationMode(key: string): BehaviorSubject<ValidationScheduling> {
  let mode = validationModes.get(key)
  if (!mode) {
    mode = new BehaviorSubject<ValidationScheduling>('idle')
    validationModes.set(key, mode)
  }
  return mode
}

/**
 * Retains `immediate` scheduling for `key` until the returned release runs.
 * Releasing the same retain twice does nothing.
 *
 * @internal
 */
export function acquireImmediateValidation(key: string): () => void {
  const count = (immediateSubscriberCounts.get(key) ?? 0) + 1
  immediateSubscriberCounts.set(key, count)
  if (count === 1) {
    getValidationMode(key).next('immediate')
  }

  let released = false
  return () => {
    if (released) return
    released = true

    const remaining = (immediateSubscriberCounts.get(key) ?? 1) - 1
    if (remaining > 0) {
      immediateSubscriberCounts.set(key, remaining)
      return
    }

    immediateSubscriberCounts.delete(key)
    const mode = validationModes.get(key)
    if (mode?.getValue() === 'immediate') {
      mode.next('idle')
    }
  }
}
