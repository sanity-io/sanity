import {type MonoTypeOperatorFunction} from 'rxjs'
import {tap} from 'rxjs/operators'

/**
 * RxJS operator that measures the time from subscription to the first emission.
 * Calls `onMeasured` once with the elapsed duration in milliseconds and the emitted value.
 * Uses `tap()` internally so data flow is unchanged.
 *
 * Re-subscriptions (e.g. navigating between documents) naturally produce fresh measurements.
 *
 * @param onMeasured - Callback receiving the duration in ms and the first emitted value
 * @returns An RxJS operator
 * @internal
 */
export function measureFirstEmission<T>(
  onMeasured: (durationMs: number, value: T) => void,
): MonoTypeOperatorFunction<T> {
  return (source) => {
    let measured = false
    let startTime: number

    return source.pipe(
      tap({
        subscribe: () => {
          measured = false
          startTime = performance.now()
        },
        next: (value) => {
          if (!measured) {
            measured = true
            onMeasured(performance.now() - startTime, value)
          }
        },
      }),
    )
  }
}

/**
 * RxJS operator that measures the time from subscription to the first emission
 * where the given predicate returns `true`.
 * Calls `onMeasured` once with the elapsed duration in milliseconds and the matching value.
 * Uses `tap()` internally so data flow is unchanged.
 *
 * @param predicate - Function that determines if the emitted value is a match
 * @param onMeasured - Callback receiving the duration in ms and the first matching value
 * @returns An RxJS operator
 * @internal
 */
export function measureFirstMatch<T>(
  predicate: (value: T) => boolean,
  onMeasured: (durationMs: number, value: T) => void,
): MonoTypeOperatorFunction<T> {
  return (source) => {
    let measured = false
    let startTime: number

    return source.pipe(
      tap({
        subscribe: () => {
          measured = false
          startTime = performance.now()
        },
        next: (value) => {
          if (!measured && predicate(value)) {
            measured = true
            onMeasured(performance.now() - startTime, value)
          }
        },
      }),
    )
  }
}
