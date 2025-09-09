import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

import {useCardinalityOnePerspective} from '../../core/perspective/CardinalityOnePerspectiveContext'
import {useRawPerspective} from '../../core/perspective/usePerspective'
import {useDocumentVersions} from '../../core/releases/hooks/useDocumentVersions'
import {getReleaseIdFromReleaseDocumentId} from '../../core/releases/util/getReleaseIdFromReleaseDocumentId'
import {getVersionFromId} from '../../core/util/draftUtils'

/**
 * Check if the given perspective is a cardinality one release
 */
function isCardinalityOnePerspective(perspective: unknown): perspective is ReleaseDocument {
  return (
    perspective !== 'drafts' &&
    perspective !== 'published' &&
    typeof perspective === 'object' &&
    perspective !== null &&
    (perspective as ReleaseDocument)?.metadata?.cardinality === 'one'
  )
}

/**
 * Provides document-level perspective logic for cardinality one releases.
 *
 * CARDINALITY ONE RELEASES OVERVIEW:
 * Cardinality one releases have special behavior where they should NOT appear in URLs
 * but should be stored in React state only. This creates a complex interaction between
 * global perspective state and document-specific behavior.
 *
 * LOGIC FLOW:
 * 1. For regular releases (non-cardinality-one): Use global perspective as-is
 * 2. For new document creation: Always use drafts AND clear cardinality one state
 * 3. For cardinality one releases:
 *    a. If document EXISTS in the release → load the release version
 *    b. If document DOESN'T exist in release → load drafts AND clear cardinality one state
 *
 * The key insight: Cardinality one releases should be document-contextual, not globally persistent.
 * Cardinality one state should be cleared reactively when creating new documents or when documents
 * don't exist in the selected release.
 *
 * @internal
 */
export function useDocumentPerspective({
  documentId,
  isCreatingNewDocument = false,
}: {
  documentId: string
  isCreatingNewDocument?: boolean
}): {
  selectedReleaseId: string | undefined
  selectedPerspectiveName: 'published' | string | undefined
} {
  // IMPORTANT: Use RAW perspective to get unmodified cardinality one release data
  // (usePerspective() would map cardinality one releases to "drafts" for global UI)
  const {selectedPerspective, selectedReleaseId, selectedPerspectiveName} = useRawPerspective()
  const {data: documentVersions} = useDocumentVersions({documentId})
  const {setCardinalityOneReleaseId, cardinalityOneReleaseId} = useCardinalityOnePerspective()

  return useMemo(() => {
    // CRITICAL: Clear cardinality one state when creating new documents
    // New documents should always be created in drafts, never in cardinality one releases
    // This is purely reactive - when isCreatingNewDocument becomes true, we clear the state
    if (isCreatingNewDocument && cardinalityOneReleaseId) {
      // Clear immediately and synchronously - this will trigger a re-render
      setCardinalityOneReleaseId(null)
    }

    // For new document creation, always use drafts regardless of global perspective
    if (isCreatingNewDocument) {
      return {
        selectedReleaseId: undefined,
        selectedPerspectiveName: undefined, // drafts
      }
    }

    // Check if we have a cardinality one release selected
    const isCardinalityOne = isCardinalityOnePerspective(selectedPerspective)

    // For non-cardinality-one releases, use the raw perspective as-is
    if (!isCardinalityOne) {
      return {
        selectedReleaseId,
        selectedPerspectiveName,
      }
    }

    // For cardinality one releases, check if document exists in the release
    if (!documentVersions?.length) {
      return {
        selectedReleaseId: undefined, // Default to drafts if we don't have version data yet
        selectedPerspectiveName: undefined, // drafts
      }
    }

    const releasesIds = documentVersions.map((id) => getVersionFromId(id))
    const currentReleaseId = getReleaseIdFromReleaseDocumentId(selectedPerspective._id)
    const documentExistsInRelease = releasesIds.includes(currentReleaseId)

    // CRITICAL: If document doesn't exist in the cardinality one release, clear the cardinality one state
    // This prevents getting "stuck" in a cardinality one release when viewing documents that don't exist in it
    if (documentExistsInRelease === false) {
      // Clear immediately and synchronously - this will trigger a re-render
      setCardinalityOneReleaseId(null)
    }

    // If document exists in the cardinality one release, use the release ID
    // Otherwise, use undefined (which will load drafts)
    return {
      selectedReleaseId: documentExistsInRelease ? selectedReleaseId : undefined,
      selectedPerspectiveName: documentExistsInRelease ? selectedReleaseId : undefined,
    }
  }, [
    isCreatingNewDocument,
    selectedPerspective,
    selectedReleaseId,
    selectedPerspectiveName,
    documentVersions,
    setCardinalityOneReleaseId,
    cardinalityOneReleaseId,
  ])
}
