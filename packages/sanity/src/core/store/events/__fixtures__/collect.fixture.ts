import {type Observable, type Subscription} from 'rxjs'

/**
 * Subscribes to `observable` and collects every emission into `values`. Combine with
 * `vi.waitFor` to await async emissions, and remember to unsubscribe.
 */
export function collectEmissions<T>(observable: Observable<T>): {
  values: T[]
  subscription: Subscription
} {
  const values: T[] = []
  const subscription = observable.subscribe((value) => values.push(value))
  return {values, subscription}
}
