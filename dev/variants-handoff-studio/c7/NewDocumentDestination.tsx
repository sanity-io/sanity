import {useEffect, useRef} from 'react'
import {
  isNewDocument,
  isPerspectiveWriteable,
  usePerspective,
  useSetPerspective,
  useWorkspace,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

/**
 * A new document opened where it cannot be written (Published, a locked or scheduled release) moves to Drafts by itself, instead of
 * showing core's "Choose a destination" banner (26 Oct, Faheem). A live edit type needs no move: Published and Drafts both write to its one
 * document. Renders nothing; it moves once per document, so a later pick of another destination by the viewer is respected.
 */
export function NewDocumentDestination({documentId}: {documentId: string}) {
  const {editState, schemaType} = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const setPerspective = useSetPerspective()
  const draftsEnabled = useWorkspace().document.drafts.enabled
  const movedFor = useRef<string | null>(null)

  const here = isPerspectiveWriteable({
    selectedPerspective,
    isDraftModelEnabled: draftsEnabled,
    schemaType,
  })
  const drafts = isPerspectiveWriteable({
    selectedPerspective: 'drafts',
    isDraftModelEnabled: draftsEnabled,
    schemaType,
  })

  useEffect(() => {
    if (movedFor.current === documentId) return
    if (!isNewDocument(editState) || here.result || !drafts.result) return
    movedFor.current = documentId
    setPerspective('drafts')
  }, [documentId, drafts.result, editState, here.result, setPerspective])

  return null
}
