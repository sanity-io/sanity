import {useRecordDocumentHistoryEvent} from '@sanity/sdk-react'
import {type ReactNode, Suspense, useCallback, useEffect, useRef, useState} from 'react'
import {DocumentHistoryContext} from 'sanity/_singletons'

import {ErrorBoundary} from '../../ui-components/errorBoundary/ErrorBoundary'
import {
  type DocumentHistoryEventType,
  type DocumentHistoryHandle,
  type RecordDocumentHistoryEvent,
} from '../hooks/useDocumentHistoryRecorder'

interface DocumentHistoryEvent {
  id: number
  document: DocumentHistoryHandle
  eventType: DocumentHistoryEventType
}

/**
 * Each event waits for the host in its own Suspense boundary, so recording never suspends.
 *
 * @internal
 */
export function DocumentHistoryProvider({children}: {children: ReactNode}) {
  const [events, setEvents] = useState<DocumentHistoryEvent[]>([])
  const lastEventId = useRef(0)

  const recordDocumentHistoryEvent = useCallback<RecordDocumentHistoryEvent>(
    (document, eventType) => {
      lastEventId.current += 1
      const event = {id: lastEventId.current, document, eventType}
      setEvents((current) => [...current, event])
    },
    [],
  )

  const handleSent = useCallback((sent: DocumentHistoryEvent) => {
    setEvents((current) => current.filter((event) => event !== sent))
  }, [])

  return (
    <DocumentHistoryContext.Provider value={recordDocumentHistoryEvent}>
      {children}
      {events.map((event) => (
        // A failed send drops the event instead of failing Studio.
        <ErrorBoundary key={event.id} onCatch={() => handleSent(event)}>
          <Suspense fallback={null}>
            <DocumentHistoryEventSender event={event} onSent={handleSent} />
          </Suspense>
        </ErrorBoundary>
      ))}
    </DocumentHistoryContext.Provider>
  )
}

function DocumentHistoryEventSender({
  event,
  onSent,
}: {
  event: DocumentHistoryEvent
  onSent: (event: DocumentHistoryEvent) => void
}): null {
  const {recordEvent} = useRecordDocumentHistoryEvent(event.document)
  const hasSent = useRef(false)

  useEffect(() => {
    // StrictMode runs mount effects twice, which would send the event twice.
    if (hasSent.current) return
    hasSent.current = true
    recordEvent(event.eventType)
    onSent(event)
  }, [event, onSent, recordEvent])

  return null
}
