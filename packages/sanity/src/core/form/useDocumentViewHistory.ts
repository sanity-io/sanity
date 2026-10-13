import {useEffect, useRef} from 'react'
import {useSyncObservable} from 'react-rx'

import {useDocumentHistoryRecorder} from '../hooks/useDocumentHistoryRecorder'
import {useRenderingContextStore} from '../store/datastores'
import {type EditStateFor} from '../store/document/document-pair/editState'
import {useActiveWorkspace} from '../studio/activeWorkspaceMatcher/useActiveWorkspace'

/**
 * @internal
 */
export function useDocumentViewHistory({editState}: {editState: EditStateFor}): void {
  const renderingContextStore = useRenderingContextStore()
  // Synchronous, so the effect can record on the mounting commit.
  const capabilities = useSyncObservable(
    renderingContextStore.capabilities,
    renderingContextStore.getCapabilities,
  )
  const {activeWorkspace} = useActiveWorkspace()
  const displayed = editState.version ?? editState.draft ?? editState.published

  const {recordEvent} = useDocumentHistoryRecorder({
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

    if (capabilities?.dashboard && documentExists && !hasRecordedView.current) {
      hasRecordedView.current = true
      recordEvent('viewed')
    }
  }, [capabilities?.dashboard, displayed, editState.ready, recordEvent])
}
