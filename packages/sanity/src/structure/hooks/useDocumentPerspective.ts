import {type ReleaseDocument} from '@sanity/client'
import {useEffect, useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVersionFromId,
  useActiveReleases,
  useDocumentVersions,
  useRawPerspective,
  useSetPerspective,
} from 'sanity'
import {useRouter} from 'sanity/router'

/**
 * Check if the given perspective is a cardinality one release
 */
export function isCardinalityOnePerspective(perspective: unknown): perspective is ReleaseDocument {
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
 * Cardinality one releases now appear in URLs like regular releases, but have special
 * document-contextual clearing behavior. When viewing documents that don't exist in
 * a cardinality one release, or when creating new documents, the perspective is
 * automatically cleared from the URL.
 *
 * LOGIC FLOW:
 * 1. For regular releases (non-cardinality-one): Use global perspective as-is
 * 2. For new document creation: Always use drafts AND clear URL perspective
 * 3. For cardinality one releases:
 *    a. If document EXISTS in the release → use the release version
 *    b. If document DOESN'T exist in release → clear URL perspective and use drafts
 *
 * The key insight: Cardinality one releases should be document-contextual, automatically
 * clearing from URLs when not applicable to the current document.
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
  const {selectedPerspective, selectedReleaseId, selectedPerspectiveName} = useRawPerspective()
  const {data: documentVersions, loading: documentVersionsLoading} = useDocumentVersions({
    documentId,
  })
  const {data: releases} = useActiveReleases()
  const setPerspective = useSetPerspective()
  const router = useRouter()

  // Use useEffect for side effects like clearing perspective from URL
  useEffect(() => {
    // Don't make decisions while document versions are still loading
    if (documentVersionsLoading) {
      return
    }

    // Clear perspective for new document creation
    if (isCreatingNewDocument && selectedPerspectiveName) {
      setPerspective(undefined)
      return
    }

    // Check if we have a cardinality one release selected
    const isCardinalityOne = isCardinalityOnePerspective(selectedPerspective)

    // Only handle cardinality one releases
    if (!isCardinalityOne) {
      return
    }

    // If document has no versions, clear the cardinality one perspective
    if (!documentVersions?.length) {
      setPerspective(undefined)
      return
    }

    const releasesIds = documentVersions.map((id) => getVersionFromId(id))
    const currentReleaseId = getReleaseIdFromReleaseDocumentId(selectedPerspective._id)
    const documentExistsInRelease = releasesIds.includes(currentReleaseId)

    // If document doesn't exist in the cardinality one release, clear the perspective
    if (!documentExistsInRelease) {
      setPerspective(undefined)
    }
  }, [
    documentId,
    isCreatingNewDocument,
    selectedPerspective,
    selectedPerspectiveName,
    documentVersions,
    documentVersionsLoading,
    setPerspective,
  ])

  // Return the appropriate perspective values (this is just for reading, not side effects)
  return useMemo(() => {
    // For new document creation, always use drafts
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
    // If we're still loading document versions, default to drafts
    if (documentVersionsLoading) {
      return {
        selectedReleaseId: undefined, // Default to drafts while loading
        selectedPerspectiveName: undefined, // drafts
      }
    }

    // If document has no versions, use drafts
    if (!documentVersions?.length) {
      return {
        selectedReleaseId: undefined,
        selectedPerspectiveName: undefined, // drafts
      }
    }

    const releasesIds = documentVersions.map((id) => getVersionFromId(id))
    const currentReleaseId = getReleaseIdFromReleaseDocumentId(selectedPerspective._id)
    const documentExistsInRelease = releasesIds.includes(currentReleaseId)

    // If document doesn't exist in the cardinality one release, use drafts
    if (documentExistsInRelease === false) {
      return {
        selectedReleaseId: undefined,
        selectedPerspectiveName: undefined, // drafts
      }
    }

    // If document exists in the cardinality one release, use the release ID
    return {
      selectedReleaseId,
      selectedPerspectiveName,
    }
  }, [
    isCreatingNewDocument,
    selectedPerspective,
    selectedReleaseId,
    selectedPerspectiveName,
    documentVersions,
    documentVersionsLoading,
  ])
}
