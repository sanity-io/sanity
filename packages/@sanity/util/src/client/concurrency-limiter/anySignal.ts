import {anySignal as combineSignals, type ClearableSignal} from 'any-signal'

export type {ClearableSignal}

/**
 * Combines abort signals into one that aborts as soon as any of them aborts, like
 * `AbortSignal.any`. Nullish entries are ignored.
 *
 * Deliberately avoids the native static: Safari only gained `AbortSignal.any` in 17.4, and
 * earlier 17.x releases throw `TypeError: AbortSignal.any is not a function`.
 *
 * Unlike the native static, which tracks its sources through weak references, the returned
 * signal keeps an `abort` listener on every source until one of them aborts. Call `clear()`
 * once the combined signal is no longer needed so long-lived sources do not accumulate
 * listeners.
 *
 * @internal
 */
export function anySignal(signals: Array<AbortSignal | undefined>): ClearableSignal {
  return combineSignals(signals)
}
