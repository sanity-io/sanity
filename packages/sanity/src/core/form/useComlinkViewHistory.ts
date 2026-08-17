import {useEffect, useRef} from 'react'
import {useSyncObservable} from 'react-rx'

import {useRecordDocumentHistoryEvent} from '../hooks/useRecordDocumentHistoryEvent'
import {useRenderingContextStore} from '../store/datastores'
import {type EditStateFor} from '../store/document/document-pair/editState'
import {useActiveWorkspace} from '../studio/activeWorkspaceMatcher/useActiveWorkspace'

/**
 * Capture Comlink `viewed` event.
 *
 * Event capture only occurs when Comlink is available.
 *
 * @internal
 */
export function useComlinkViewHistory({editState}: {editState: EditStateFor}): void {
  const renderingContextStore = useRenderingContextStore()
  // Kept synchronous: capabilities emit once at boot and gate the history
  // recording effect below; deferring only delays it.
  const capabilities = useSyncObservable(renderingContextStore.capabilities)
  const {activeWorkspace} = useActiveWorkspace()
  const displayed = editState.version ?? editState.draft ?? editState.published

  const {recordEvent} = useRecordDocumentHistoryEvent({
    resourceType: 'studio',
    documentId: displayed?._id ?? editState.id,
    documentType: editState.type,
    resourceId: [activeWorkspace.projectId, activeWorkspace.dataset].join('.'),
    schemaName: activeWorkspace.name,
  })

  // Used to prevent redundant `viewed` events being recorded.
  const hasRecordedView = useRef<boolean>(false)

  // Capture `viewed` event one time if the document appears to exist.
  useEffect(() => {
    const documentExists = editState.ready && displayed !== null

    if (capabilities?.comlink && documentExists && !hasRecordedView.current) {
      hasRecordedView.current = true
      recordEvent('viewed')
    }
  }, [capabilities?.comlink, displayed, editState.ready, recordEvent])
}
