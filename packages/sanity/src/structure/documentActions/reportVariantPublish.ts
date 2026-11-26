import {first, type Observable, type Subscription, timeout} from 'rxjs'
import {type OperationError, type OperationSuccess} from 'sanity'

const RESULT_TIMEOUT_MS = 60_000

const pendingReports = new Map<string, Subscription>()

/**
 * Calls `onPublished` once the next publish operation in `operationEvents$` succeeds.
 *
 * The subscription is kept outside of React on purpose: publishing a variant draft removes it, and
 * the document pane swaps out its editing subtree, the publish action included, while it resolves
 * the new target, so state held by the action can be gone before the publish lands. A publish
 * that a later patch cancels never reports a result, so a new report for the same `key` replaces
 * the pending one instead of waiting alongside it.
 *
 * @internal
 */
export function reportVariantPublish(
  key: string,
  operationEvents$: Observable<OperationSuccess | OperationError>,
  onPublished: () => void,
): void {
  pendingReports.get(key)?.unsubscribe()

  const subscription = operationEvents$
    .pipe(
      first((event) => event.op === 'publish'),
      timeout({first: RESULT_TIMEOUT_MS}),
    )
    .subscribe({
      next: (event) => {
        if (event.type === 'success') onPublished()
      },
      error: () => undefined,
    })

  if (subscription.closed) return
  pendingReports.set(key, subscription)
  subscription.add(() => {
    if (pendingReports.get(key) === subscription) pendingReports.delete(key)
  })
}
