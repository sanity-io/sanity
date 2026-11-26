import {useCallback} from 'react'

import {type PresentationNavigate} from './types'
import {useLocalState} from './useLocalState'

/**
 * Open/closed state of the right-hand panel that shows the document being edited, or the list of
 * documents on the page. Persisted in the browser like the navigator toggle.
 *
 * @internal
 */
export function useDocumentPanel(props: {defaultOpen?: boolean; navigate: PresentationNavigate}): {
  documentPanelOpen: boolean
  toggleDocumentPanel: () => void
  /** Like `navigate`, but opens the panel when the navigation targets a document. */
  navigateToDocument: PresentationNavigate
} {
  const {defaultOpen = true, navigate} = props
  const [documentPanelOpen, setDocumentPanelOpen] = useLocalState<boolean>(
    'presentation/document-panel',
    defaultOpen,
  )

  const toggleDocumentPanel = useCallback(
    () => setDocumentPanelOpen((open) => !open),
    [setDocumentPanelOpen],
  )

  const navigateToDocument = useCallback<PresentationNavigate>(
    (options) => {
      if (options.state?.id) setDocumentPanelOpen(true)
      navigate(options)
    },
    [navigate, setDocumentPanelOpen],
  )

  return {documentPanelOpen, toggleDocumentPanel, navigateToDocument}
}
