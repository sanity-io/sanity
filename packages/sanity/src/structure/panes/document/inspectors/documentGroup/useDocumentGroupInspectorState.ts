import {useCallback} from 'react'
import {type DocumentInspector} from 'sanity'

import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../constants'

/**
 * Derives the document group inventory's open state from the document pane's inspector, so the
 * "Manage versions" button and the onboarding hint open and close the document group inspector.
 */
export function useDocumentGroupInspectorState({
  currentInspector,
  openInspector,
  closeInspector,
}: {
  currentInspector: DocumentInspector | undefined
  openInspector: (inspectorName: string) => void
  closeInspector: (inspectorName: string) => void
}): {
  isDocumentGroupInventoryActive: boolean
  setIsDocumentGroupInventoryActive: (active: boolean) => void
} {
  const isDocumentGroupInventoryActive = currentInspector?.name === DOCUMENT_GROUP_INSPECTOR_NAME

  const setIsDocumentGroupInventoryActive = useCallback(
    (active: boolean) => {
      if (active) {
        openInspector(DOCUMENT_GROUP_INSPECTOR_NAME)
        return
      }

      // `closeInspector` closes whichever inspector is open, so only call it when the document
      // group inspector is the one that is open.
      if (isDocumentGroupInventoryActive) {
        closeInspector(DOCUMENT_GROUP_INSPECTOR_NAME)
      }
    },
    [closeInspector, isDocumentGroupInventoryActive, openInspector],
  )

  return {isDocumentGroupInventoryActive, setIsDocumentGroupInventoryActive}
}
