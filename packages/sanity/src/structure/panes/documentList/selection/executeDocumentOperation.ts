import {filter, firstValueFrom, timeout} from 'rxjs'
import {type DocumentStore} from 'sanity'

/** The document operations the list-item surfaces (row menu, bulk bar) execute. */
export type ListItemOperationName =
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'duplicate'
  | 'discardChanges'
  | 'patch'

/**
 * Executes one document operation through the standard edit-operations
 * pipeline (so drafts, published and version documents are handled the same
 * way as the single-document actions), and waits for its actual result.
 *
 * The operations pipeline is cold: `execute()` only pushes a call onto a
 * subject that the store's operation-events stream consumes — inside a
 * document pane that stream is already subscribed, but from a list pane it
 * is not. Subscribe to the pair's operation events BEFORE executing so the
 * pipeline is live when the call lands, then resolve with this operation's
 * outcome.
 *
 * @returns `'done'` on success, otherwise the reason the operation was
 * skipped (its disabled-reason, or `'ERROR'` for execution failures).
 *
 * @internal
 */
export async function executeDocumentOperation(
  documentStore: DocumentStore,
  publishedId: string,
  documentType: string,
  operationName: ListItemOperationName,
  extraArgs: unknown[] = [],
): Promise<'done' | string> {
  try {
    const operations = await firstValueFrom(
      documentStore.pair.editOperations(publishedId, documentType).pipe(
        // the pair emits a guarded API first; wait until it is ready
        filter((ops) => ops[operationName].disabled !== 'NOT_READY'),
        timeout({first: 15_000}),
      ),
    )
    const operation = operations[operationName]
    if (operation.disabled) return String(operation.disabled)

    const result = firstValueFrom(
      documentStore.pair.operationEvents(publishedId, documentType).pipe(
        filter((event) => event.op === operationName),
        timeout({first: 30_000}),
      ),
    )
    ;(operation.execute as (...args: unknown[]) => void)(...extraArgs)

    const event = await result
    return event.type === 'success' ? 'done' : 'ERROR'
  } catch {
    return 'ERROR'
  }
}
