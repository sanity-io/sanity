import {type Observable, type Subscription} from 'rxjs'

/**
 * Holds subscriptions on behalf of components inside a hidden `<Activity>` boundary.
 *
 * Hiding a tool cleans up its effects, which unsubscribes every observable its components read.
 * The shared sources behind them (a document pair's listener, its versions) are reference counted
 * and tear down once nobody is subscribed, so showing the tool again started them over: the
 * cold-start emissions (`ready: false`, `loading: true`) flipped the form read-only until the data
 * had been fetched again. A keep-alive takes over the subscription from the effect cleanup while
 * the tool is hidden (`retain`) and hands it back when the effect runs again on reveal
 * (`release`), so the source never sees its subscriber count drop.
 *
 * `setHidden` is what tells a cleanup apart from an unmount: a cleanup while the tool is visible
 * is an unmount (or a changed observable), and nothing is retained. Whatever was retained during
 * the latest hide survives the reveal, because not every component releases in the reveal's own
 * effects flush: content under a Suspense boundary that re-suspends on reveal only runs its
 * effects once it resolves, and finds its entry then. What nobody releases, because its component
 * unmounted or remounted while hidden (a remounted pane reads a new pipe and never releases its
 * predecessor's), is dropped by `sweep` on the reveal after the next hide, when every live
 * component has retained again and the leftovers stand out.
 *
 * @internal
 */
export interface ActivityKeepAlive {
  /** From an effect cleanup: keep `observable` subscribed if the tool is hidden. */
  retain(observable: Observable<unknown>): void
  /** From the effect: the component subscribes again itself, so stop holding `observable`. */
  release(observable: Observable<unknown>): void
  setHidden(hidden: boolean): void
  /** Drop what no component retained during the most recent hide. */
  sweep(): void
  /** Drop every held subscription. */
  releaseAll(): void
}

interface Held {
  subscription: Subscription
  /** The hide during which the subscription was last retained */
  hide: number
}

function noop() {}

/** @internal */
export function createActivityKeepAlive(): ActivityKeepAlive {
  const held = new Map<Observable<unknown>, Held>()
  let hidden = false
  let hide = 0

  return {
    retain(observable) {
      if (!hidden) return
      const current = held.get(observable)
      if (current) {
        current.hide = hide
        return
      }
      // Errors are the component's to handle when it subscribes again; an unhandled one here
      // would be reported as uncaught by rxjs.
      held.set(observable, {subscription: observable.subscribe({error: noop}), hide})
    },
    release(observable) {
      const current = held.get(observable)
      if (!current) return
      held.delete(observable)
      // After the current commit's effects, so the component's own subscription is in place
      // before this one goes and the source's subscriber count never reaches zero in between.
      queueMicrotask(() => current.subscription.unsubscribe())
    },
    setHidden(next) {
      if (next && !hidden) hide++
      hidden = next
    },
    sweep() {
      for (const [observable, current] of held) {
        if (current.hide === hide) continue
        held.delete(observable)
        current.subscription.unsubscribe()
      }
    },
    releaseAll() {
      for (const current of held.values()) current.subscription.unsubscribe()
      held.clear()
    },
  }
}
