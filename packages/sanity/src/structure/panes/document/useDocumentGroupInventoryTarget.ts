import {type SanityDocument} from '@sanity/types'
import {
  type EditStateFor,
  getDefaultVariant,
  isGoingToUnpublish,
  useIsDocumentGroupInventoryAvailable,
  usePerspective,
  useWorkspace,
} from 'sanity'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'
import {EMPTY_PARAMS} from './constants'
import {shouldRenderDocumentStatusBar} from './statusBar/shouldRenderDocumentStatusBar'
import {useDocumentPane} from './useDocumentPane'

export type DocumentGroupInventoryTarget =
  | {
      isAvailable: true
      /** The document id the inventory is opened for. */
      documentId: string
    }
  | {isAvailable: false}

const UNAVAILABLE: DocumentGroupInventoryTarget = {isAvailable: false}

/**
 * The document id the document group inventory should be opened for.
 *
 * When a document is designated to be unpublished in a release, the published document is
 * displayed instead. The inventory must always reflect the intended document id, even if the
 * document pane decided to display a different document for some reason.
 *
 * In the future, this would be more robust if `DocumentPaneProvider` exposed both the displayed
 * document and the original source document.
 */
export function getDocumentGroupInventoryDocumentId(
  editState: EditStateFor | null,
  displayed: Partial<SanityDocument> | null,
): string | undefined {
  return editState?.version && isGoingToUnpublish(editState.version)
    ? editState.version._id
    : displayed?._id
}

/**
 * Resolves whether the document group inventory ("Manage versions") can be opened in the
 * current document pane, and for which document id.
 *
 * This is the single predicate shared by everything that opens the inventory, i.e. the
 * "Manage versions" action in the pane footer and the "Where did the version buttons go?" hint
 * in the pane header: the hint is only shown when the action it opens is mounted, so pressing
 * it is never a no-op.
 *
 * The inventory is available when all of these hold:
 *
 * - the `beta.documentGroupInventory` feature is enabled for the workspace,
 * - the pane resolved a document id to open the inventory for,
 * - the pane footer (which hosts the action and its popover) renders for the current edit
 *   state, perspective and variant selection, and
 * - the document group has at least one existing version (a deleted or never-created document,
 *   e.g. an empty singleton, has none and therefore nothing to manage).
 */
export function useDocumentGroupInventoryTarget(): DocumentGroupInventoryTarget {
  const {beta} = useWorkspace()
  const {displayed, documentId, editState, revisionNotFound, targetDocumentState} =
    useDocumentPane()
  const {params = EMPTY_PARAMS} = usePaneRouter()
  const {selectedPerspective, selectedVariantNames} = usePerspective()

  const isEnabled = beta?.documentGroupInventory?.enabled === true
  const targetDocumentId = getDocumentGroupInventoryDocumentId(editState, displayed)

  // The versions observable is cached per published id, so keying it on the pane's document id
  // when no target is resolved yet shares the subscription with the action once it mounts.
  const hasVersions = useIsDocumentGroupInventoryAvailable({
    documentId: targetDocumentId ?? documentId,
  })

  if (!isEnabled || typeof targetDocumentId === 'undefined' || !hasVersions) {
    return UNAVAILABLE
  }

  const isFooterRendered = shouldRenderDocumentStatusBar({
    editState,
    targetDocumentState,
    selectedPerspective,
    selectedVariantName: getDefaultVariant(selectedVariantNames),
    showingRevision: Boolean(params.rev),
    revisionNotFound,
  })

  return isFooterRendered ? {isAvailable: true, documentId: targetDocumentId} : UNAVAILABLE
}
