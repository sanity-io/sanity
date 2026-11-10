import {useEffect, useRef} from 'react'
import {type EditStateFor, useDataset, useProjectId, useRenderingContextStore} from 'sanity'

interface DocumentApplicationContextOptions {
  /** The id of the version, draft or published document on screen. */
  displayedId: string | undefined
  editState: EditStateFor
}

// Sent once per pane and never cleared, so the host keeps the last opened document.
export function useDocumentApplicationContext({
  displayedId,
  editState,
}: DocumentApplicationContextOptions): void {
  const connection = useRenderingContextStore().getMessageBusConnection()
  const projectId = useProjectId()
  const dataset = useDataset()
  // The pane can show a variant that doesn't exist yet, filled in from a sibling.
  const displayedExists =
    displayedId !== undefined &&
    editState.ready &&
    [editState.version, editState.draft, editState.published].some(
      (document) => document?._id === displayedId,
    )
  const hasSent = useRef(false)

  useEffect(() => {
    if (!connection || !displayedExists || !displayedId) return
    if (hasSent.current) return
    hasSent.current = true
    void connection.emit('applications.context.update', {
      resource: {id: `${projectId}.${dataset}`, type: 'dataset'},
      document: {id: displayedId},
    })
  }, [connection, dataset, displayedId, displayedExists, projectId])
}
