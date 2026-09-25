import {useEffect, useRef} from 'react'
import {useRenderingContextStore, useWorkspace} from 'sanity'

/**
 * Tells a message bus host which document the pane shows. Like the `viewed` history event it is
 * sent once per pane and never cleared, so the host holds the last opened document.
 */
export function useDocumentApplicationContext(displayedId: string | undefined): void {
  const renderingContext = useRenderingContextStore().getRenderingContext()
  const {projectId, dataset} = useWorkspace()
  const hasSent = useRef(false)

  useEffect(() => {
    // Application context only exists on the message bus, not over Comlink.
    if (renderingContext?.name !== 'messageBus' || !displayedId || hasSent.current) return
    hasSent.current = true
    void renderingContext.metadata.connection.emit('applications.context.update', {
      resource: {id: `${projectId}.${dataset}`, type: 'dataset'},
      document: {id: displayedId},
    })
  }, [dataset, displayedId, projectId, renderingContext])
}
