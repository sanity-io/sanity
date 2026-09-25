import {useRecordDocumentHistoryEvent} from '@sanity/sdk-react'
import {useEffect, useRef} from 'react'
import {filter, map, merge, type Observable, share, take} from 'rxjs'
import {
  type OperationError,
  type OperationSuccess,
  useDocumentStore,
  useRenderingContextStore,
  useWorkspace,
} from 'sanity'

type OperationHistoryEvent = 'edited' | 'deleted'

interface DocumentHistoryOptions {
  /** The published id, which document operation events are keyed by. */
  documentId: string
  documentType: string
  /** The id of the version, draft or published document on screen, once it exists. */
  displayedId: string | undefined
}

/**
 * Records the document's `viewed`, first `edited` and `deleted` events in the history of the host
 * rendering Studio: views under the document on screen, edits and deletes under the published id.
 */
export function useDocumentHistory({
  documentId,
  documentType,
  displayedId,
}: DocumentHistoryOptions): void {
  const hasHost = useRenderingContextStore().getCapabilities()?.dashboard === true
  const documentStore = useDocumentStore()
  const {projectId, dataset, name} = useWorkspace()
  const resourceId = `${projectId}.${dataset}`
  const {recordEvent: recordView} = useRecordDocumentHistoryEvent({
    documentId: displayedId ?? documentId,
    documentType,
    resourceType: 'studio',
    resourceId,
    schemaName: name,
  })
  const {recordEvent: recordOperation} = useRecordDocumentHistoryEvent({
    documentId,
    documentType,
    resourceType: 'studio',
    resourceId,
    schemaName: name,
  })

  const hasRecordedView = useRef(false)
  useEffect(() => {
    if (!hasHost || !displayedId || hasRecordedView.current) return
    hasRecordedView.current = true
    recordView('viewed')
  }, [displayedId, hasHost, recordView])

  useEffect(() => {
    if (!hasHost) return undefined
    const subscription = operationHistoryEvents(
      documentStore.pair.operationEvents(documentId, documentType),
    ).subscribe(recordOperation)
    return () => subscription.unsubscribe()
  }, [documentId, documentStore, documentType, hasHost, recordOperation])
}

function operationHistoryEvents(
  operations: Observable<OperationSuccess | OperationError>,
): Observable<OperationHistoryEvent> {
  const succeeded = operations.pipe(
    filter((operation) => operation.type === 'success'),
    share(),
  )

  return merge(
    // Only the first edit, to avoid inundating the host's history.
    succeeded.pipe(
      filter((operation) => operation.op === 'patch'),
      take(1),
      map((): OperationHistoryEvent => 'edited'),
    ),
    succeeded.pipe(
      filter((operation) => operation.op === 'delete' || operation.op === 'del'),
      map((): OperationHistoryEvent => 'deleted'),
    ),
  )
}
