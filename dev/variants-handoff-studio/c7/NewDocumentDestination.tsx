import {useEffect} from 'react'
import {
  isNewDocument,
  isPerspectiveWriteable,
  usePerspective,
  useSetPerspective,
  useWorkspace,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

/** The new documents already moved this session. It is module-level, not a ref: the pane can remount when the perspective changes, and a
 * ref would then forget and send the viewer back to Drafts after they chose Published (26 Oct). */
const moved = new Set<string>()

/**
 * A new document opened where it cannot be written (Published, a locked or scheduled release) moves to Drafts by itself, instead of
 * showing core's "Choose a destination" banner (26 Oct, Faheem). A live edit type needs no move: Published and Drafts both write to its one
 * document. Renders nothing; it moves once per document. The global perspective stays switchable after that: a later pick of Published or a locked
 * release shows core's "Cannot create a published document" banner in the pane, which says why.
 */
export function NewDocumentDestination({documentId}: {documentId: string}) {
  const {editState, schemaType} = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const setPerspective = useSetPerspective()
  const draftsEnabled = useWorkspace().document.drafts.enabled

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
    if (moved.has(documentId)) return
    if (!isNewDocument(editState) || here.result || !drafts.result) return
    moved.add(documentId)
    setPerspective('drafts')
  }, [documentId, drafts.result, editState, here.result, setPerspective])

  return null
}
