import {useContext, useEffect} from 'react'
import {IsLastPaneContext} from 'sanity/_singletons'

import {usePerspectiveActiveDocument} from '../../../perspective/activeDocument/usePerspectiveActiveDocument'
import {getPublishedId, isVersionId} from '../../../util/draftUtils'

interface SetActiveDocumentProps {
  /** From the root input's form value, so both are `undefined` until it resolves. */
  documentId: string | undefined
  documentType: string | undefined
}

/**
 * Publishes the document this form belongs to as the perspective bar's active
 * document — but only while it is the last (selected) pane, so that opening a
 * child pane does not leave the parent claiming the selection.
 *
 * Reads `IsLastPaneContext` directly rather than through
 * `core/tasks/context/isLastPane`: the context is a shared singleton and only
 * happens to be provided by code that lives under `tasks/`, so going through
 * that hook would couple variants to tasks for no benefit. It defaults to
 * `false`, which is the right answer outside a pane.
 *
 * @internal
 */
export function SetActiveDocument(props: SetActiveDocumentProps): null {
  const {documentId, documentType} = props
  const isLastPane = useContext(IsLastPaneContext)
  const {setActiveDocument} = usePerspectiveActiveDocument()

  useEffect(() => {
    if (!isLastPane || !documentId || !documentType) return undefined

    setActiveDocument({
      // Keep a version id as-is. `useDocumentVersions` normalizes to the
      // published id itself, and the follow-up delete work needs to know which
      // version is on screen.
      documentId: isVersionId(documentId) ? documentId : getPublishedId(documentId),
      documentType,
    })

    return () => setActiveDocument(null)
  }, [documentId, documentType, isLastPane, setActiveDocument])

  return null
}
