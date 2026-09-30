import {type useRecordDocumentHistoryEvent} from '@sanity/sdk-react'
import {useCallback, use} from 'react'
import {DocumentHistoryContext} from 'sanity/_singletons'

/**
 * @internal
 */
export type DocumentHistoryHandle = Parameters<typeof useRecordDocumentHistoryEvent>[0]

/**
 * @internal
 */
export type DocumentHistoryEventType = Parameters<
  ReturnType<typeof useRecordDocumentHistoryEvent>['recordEvent']
>[0]

/**
 * @internal
 */
export type RecordDocumentHistoryEvent = (
  document: DocumentHistoryHandle,
  eventType: DocumentHistoryEventType,
) => void

/**
 * Never suspends, unlike the SDK hook: `DocumentHistoryProvider` sends the events.
 *
 * @internal
 */
export function useDocumentHistoryRecorder({
  documentId,
  documentType,
  resourceType,
  resourceId,
  schemaName,
}: DocumentHistoryHandle): {recordEvent: (eventType: DocumentHistoryEventType) => void} {
  const recordDocumentHistoryEvent = use(DocumentHistoryContext)

  const recordEvent = useCallback(
    (eventType: DocumentHistoryEventType) =>
      recordDocumentHistoryEvent(
        {documentId, documentType, resourceType, resourceId, schemaName},
        eventType,
      ),
    [documentId, documentType, recordDocumentHistoryEvent, resourceId, resourceType, schemaName],
  )

  return {recordEvent}
}
